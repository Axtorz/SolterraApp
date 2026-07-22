const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Collection } = require('discord.js');
const config = require('../src/config');
const { findJavaScriptFiles, loadCommands } = require('../src/handlers/commandHandler');
const { parseDuration } = require('../src/utils/duration');
const JsonStore = require('../src/utils/jsonStore');

const projectRoot = path.resolve(__dirname, '..');
const sourceFiles = findJavaScriptFiles(path.join(projectRoot, 'src'));
const scriptFiles = findJavaScriptFiles(path.join(projectRoot, 'scripts'));
const failures = [];

for (const file of [...sourceFiles, ...scriptFiles]) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) failures.push(`${path.relative(projectRoot, file)}: ${result.stderr.trim()}`);
}

const holder = { commands: new Collection() };
try {
  loadCommands(holder);
  for (const command of holder.commands.values()) {
    const body = command.data.toJSON();
    if (!/^[a-z0-9_-]{1,32}$/.test(body.name)) failures.push(`Invalid command name: ${body.name}`);
    if (!body.description) failures.push(`Missing description: ${body.name}`);
    if (!command.category) failures.push(`Missing category: ${body.name}`);
    if (!Array.isArray(command.requiredUserPermissions)) {
      failures.push(`Missing requiredUserPermissions array: ${body.name}`);
    }
    if (!Array.isArray(command.requiredBotPermissions)) {
      failures.push(`Missing requiredBotPermissions array: ${body.name}`);
    }
  }
} catch (error) {
  failures.push(error.stack ?? String(error));
}

for (const [name, value] of Object.entries({
  joinLeaveChannelId: config.joinLeaveChannelId,
  memberRoleId: config.memberRoleId,
  botRoleId: config.botRoleId,
  minecraftStatusChannelId: config.minecraftServer.statusChannelId,
})) {
  if (!/^\d{17,20}$/.test(value)) failures.push(`Invalid configured Discord ID: ${name}`);
}

if (!config.minecraftServer.host || typeof config.minecraftServer.host !== 'string') {
  failures.push('Minecraft server host must be a non-empty string.');
}
if (!Number.isInteger(config.minecraftServer.port) || config.minecraftServer.port < 1 || config.minecraftServer.port > 65_535) {
  failures.push('Minecraft server port must be between 1 and 65535.');
}
if (!Number.isInteger(config.minecraftServer.checkIntervalMs) || config.minecraftServer.checkIntervalMs < 10_000) {
  failures.push('Minecraft check interval must be at least 10000 milliseconds.');
}
if (!Number.isInteger(config.minecraftServer.connectionTimeoutMs) || config.minecraftServer.connectionTimeoutMs < 1_000) {
  failures.push('Minecraft connection timeout must be at least 1000 milliseconds.');
}
if (!Number.isInteger(config.minecraftServer.offlineFailureThreshold) || config.minecraftServer.offlineFailureThreshold < 1) {
  failures.push('Minecraft offline failure threshold must be at least 1.');
}

try {
  const warningData = JSON.parse(fs.readFileSync(config.paths.warnings, 'utf8'));
  if (!Array.isArray(warningData.warnings)) failures.push('data/warnings.json must contain a warnings array.');
} catch (error) {
  failures.push(`Could not validate data/warnings.json: ${error.message}`);
}

try {
  const statusData = JSON.parse(fs.readFileSync(config.paths.minecraftStatus, 'utf8'));
  if (![null, 'online', 'offline'].includes(statusData.status)) {
    failures.push('data/minecraft-status.json contains an invalid status.');
  }
} catch (error) {
  failures.push(`Could not validate data/minecraft-status.json: ${error.message}`);
}

const durationCases = { '10m': 600_000, '2h': 7_200_000, '1d': 86_400_000, '1d12h': 129_600_000 };
for (const [input, expected] of Object.entries(durationCases)) {
  if (parseDuration(input) !== expected) failures.push(`Duration parser failed for ${input}.`);
}
if (parseDuration('ten minutes') !== null) failures.push('Duration parser accepted invalid text.');

async function validateJsonStorage() {
  const temporaryDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'solterra-store-'));
  const filePath = path.join(temporaryDirectory, 'test.json');
  const defaultValue = { version: 1, values: [] };
  const store = new JsonStore(
    filePath,
    defaultValue,
    (data) => data?.version === 1 && Array.isArray(data.values),
    { logRecoveries: false },
  );

  try {
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        store.update((data) => {
          data.values.push(index);
        }),
      ),
    );

    const written = await store.read();
    if (written.values.length !== 20 || new Set(written.values).size !== 20) {
      failures.push('Queued JSON writes lost or duplicated data.');
    }

    await fsPromises.writeFile(filePath, '{ invalid json', 'utf8');
    const recovered = await store.read();
    const recoveryFiles = await fsPromises.readdir(temporaryDirectory);
    if (recovered.values.length !== 0) failures.push('Malformed JSON recovery did not restore defaults.');
    if (!recoveryFiles.some((name) => name.includes('.corrupt.'))) {
      failures.push('Malformed JSON recovery did not preserve a recovery copy.');
    }
  } finally {
    await fsPromises.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function finishValidation() {
  try {
    await validateJsonStorage();
  } catch (error) {
    failures.push(`JSON storage validation failed: ${error.stack ?? error.message}`);
  }

  if (failures.length > 0) {
    console.error(`Validation failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Validation passed: ${sourceFiles.length + scriptFiles.length} JavaScript files and ${holder.commands.size} commands checked.`,
  );
}

finishValidation();
