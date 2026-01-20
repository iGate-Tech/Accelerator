import { createContext, useContext } from 'solid-js';
import { logger } from '../lib/core';


const LoggerContext = createContext();

export const LoggerProvider = (props) => {
  logger.trace('LoggerProvider: Starting');
  return (
    <LoggerContext.Provider value={logger}>
      {props.children}
    </LoggerContext.Provider>
  );
};

export const useLogger = () => {
  const logger = useContext(LoggerContext);
  if (!logger) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return logger;
};