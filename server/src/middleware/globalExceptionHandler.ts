import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../config/constants";
import AppLogger from "../utils/AppLogger";
import { appCommonTypes } from "../@types/app-common";
import { AxiosError } from "axios";
import HttpResponse = appCommonTypes.HttpResponse;
import HttpStatus from "../helpers/HttpStatus";
import CustomAPIError from "../exceptions/CustomAPIError";

const logger = AppLogger.init(globalExceptionHandler.name).logger;

export default function globalExceptionHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) return next(err);

  const response: HttpResponse<null> = {
    code: HttpStatus.INTERNAL_SERVER_ERROR.code,
    message: MESSAGES.http["500"],
  };

  if (err instanceof CustomAPIError) {
    logger.error(err.message);
    logger.error(err.stack);

    response.code = err.code;
    response.message = err.message;

    return res.status(err.code).json(response);
  }

  if (err instanceof AxiosError) {
    if (err.response) {
      logger.error(err.message);
      logger.error(err.response.data);

      response.code = err.response.status;
      response.message = err.message;

      return res.status(response.code).json(response);
    }

    if (err.request) {
      logger.error(err.message);
      logger.error(err.request);

      response.message = err.message;

      return res.status(response.code).json(response);
    }

    return res.status(response.code).json(response);
  }

  process.on("uncaughtException", (error) => {
    logger.error(error.message);
    logger.error(error.stack);

    response.message = error.message;
    return res.status(response.code).json(response);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error(reason);

    response.message = reason as unknown as string;

    return res.status(response.code).json(response);
  });

  logger.error(err.message);
  logger.error(err.stack);

  response.message = err.message || `${err}`;

  return res.status(response.code).json(response);
}
