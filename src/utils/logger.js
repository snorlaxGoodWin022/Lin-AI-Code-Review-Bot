const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

let currentLevel = LEVELS[process.env.LOG_LEVEL || 'info'];

class Logger {
  debug(msg, ...args) {
    if (currentLevel <= LEVELS.debug) console.log(`[DEBUG] ${msg}`, ...args);
  }
  info(msg, ...args) {
    if (currentLevel <= LEVELS.info) console.log(`[INFO] ${msg}`, ...args);
  }
  warn(msg, ...args) {
    if (currentLevel <= LEVELS.warn) console.warn(`[WARN] ${msg}`, ...args);
  }
  error(msg, ...args) {
    if (currentLevel <= LEVELS.error) console.error(`[ERROR] ${msg}`, ...args);
  }
}

let instance = null;

export function getLogger() {
  if (!instance) instance = new Logger();
  return instance;
}
