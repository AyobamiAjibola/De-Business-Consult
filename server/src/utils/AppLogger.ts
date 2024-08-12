import { createLogger, format, Logger, transports } from 'winston';
import colors from 'colors';
import DailyRotateFile from 'winston-daily-rotate-file';

import { ConsoleTransportInstance } from 'winston/lib/winston/transports';
import { LOG_LEVEL_COLORS } from '../config/constants';

export default class AppLogger {
  private readonly module: string;
  private readonly transports: ConsoleTransportInstance | DailyRotateFile;

  constructor(module: string) {
    this.transports = this.getTransports();
    this.module = module;
    this.createLogger();
  }

  private _logger?: Logger;

  get logger(): Logger {
    return <Logger>this._logger;
  }

  public static init(module: string) {
    return new AppLogger(module);
  }

  private createLogger() {
    const { errors, label, timestamp, combine } = format;

    this._logger = createLogger({
      transports: [this.transports],
      exitOnError: false,
      level: 'info',
      format: combine(
        errors({ stack: true }),
        label({ label: this.module }),
        timestamp({ format: 'YYYY-MM-DD hh:mm:ss a' }),
      ),
    });
  }

  private getTransports() {
    if (process.env.NODE_ENV === 'production') {
      const options = {
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: format.printf(({ level, label, timestamp, stack, message }) => {
          return `[${timestamp}] ${label}.${level}: ${stack ? stack : message}`;
        }),
      };

      return new DailyRotateFile({
        ...options,
        filename: 'logs/app-%DATE%.log',
      });
    }

    return new transports.Console({
      level: 'debug',
      format: format.printf(({ level, label, timestamp, stack, message }) => {
        //@ts-ignore
        return colors[LOG_LEVEL_COLORS[level]](`[${timestamp}] ${label}.${level}: ${stack ? stack : message}`);
      }),
    });
  }
}
