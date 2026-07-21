const timestamp = () => new Date().toISOString();

const write = (level, message, error) => {
  const output = `[${timestamp()}] [${level}] ${message}`;

  if (level === 'ERROR') {
    console.error(output, error ?? '');
    return;
  }

  if (level === 'WARN') {
    console.warn(output, error ?? '');
    return;
  }

  console.log(output);
};

module.exports = Object.freeze({
  info: (message) => write('INFO', message),
  warn: (message, error) => write('WARN', message, error),
  error: (message, error) => write('ERROR', message, error),
});
