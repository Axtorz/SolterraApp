const fs = require('node:fs/promises');
const path = require('node:path');
const logger = require('./logger');

/**
 * Small JSON store with serialized operations, atomic replacement, and recovery backups.
 */
class JsonStore {
  constructor(filePath, defaultValue, validator = () => true, { logRecoveries = true } = {}) {
    this.filePath = filePath;
    this.defaultValue = defaultValue;
    this.validator = validator;
    this.logRecoveries = logRecoveries;
    this.queue = Promise.resolve();
  }

  _cloneDefault() {
    return structuredClone(this.defaultValue);
  }

  async _ensureFile() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.writeFile(this.filePath, `${JSON.stringify(this.defaultValue, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
      });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  async _writeAtomic(value) {
    await this._ensureFile();
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const backupPath = `${this.filePath}.bak`;
    const serialized = `${JSON.stringify(value, null, 2)}\n`;

    try {
      await fs.copyFile(this.filePath, backupPath).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });

      const handle = await fs.open(temporaryPath, 'wx');
      try {
        await handle.writeFile(serialized, 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }

      await fs.rename(temporaryPath, this.filePath);
    } catch (error) {
      await fs.rm(temporaryPath, { force: true }).catch(() => {});
      throw error;
    }
  }

  async _readUnlocked() {
    await this._ensureFile();

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const value = JSON.parse(raw);
      if (!this.validator(value)) {
        throw new SyntaxError('The JSON document has an invalid data structure.');
      }
      return value;
    } catch (error) {
      if (error instanceof SyntaxError) {
        const corruptedPath = `${this.filePath}.corrupt.${Date.now()}.json`;
        await fs.copyFile(this.filePath, corruptedPath).catch(() => {});
        if (this.logRecoveries) {
          logger.error(
            `Malformed JSON detected at ${this.filePath}. A recovery copy was saved to ${corruptedPath}.`,
            error,
          );
        }
        const replacement = this._cloneDefault();
        await this._writeAtomic(replacement);
        return replacement;
      }
      throw error;
    }
  }

  _enqueue(operation) {
    const result = this.queue.then(operation, operation);
    this.queue = result.catch(() => {});
    return result;
  }

  read() {
    return this._enqueue(() => this._readUnlocked());
  }

  update(mutator) {
    return this._enqueue(async () => {
      const current = await this._readUnlocked();
      const draft = structuredClone(current);
      const result = await mutator(draft);
      await this._writeAtomic(draft);
      return result;
    });
  }
}

module.exports = JsonStore;
