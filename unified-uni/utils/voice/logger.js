const logger = {
    debug: (...args) => console.debug('[Voice]', ...args),
    log: (...args) => console.log('[Voice]', ...args),
    info: (...args) => console.info('[Voice]', ...args),
    warn: (...args) => console.warn('[Voice]', ...args),
    error: (...args) => console.error('[Voice]', ...args)
};

export default logger;
