import { appCommonTypes } from '../@types/app-common';
import { NextFunction, Request, Response } from 'express';
import AsyncWrapper = appCommonTypes.AsyncWrapper;

export default function asyncErrorWrapper(handler: AsyncWrapper) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await handler(req, res, next);
    } catch (e) {
      next(e);
    }
  };
}
