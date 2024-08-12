import { Request } from 'express';

import 'reflect-metadata';

import CustomAPIError from '../exceptions/CustomAPIError';
import HttpStatus from '../helpers/HttpStatus';

const errorResponse = CustomAPIError.response(
  'Unauthorized access. Please contact system administrator',
  HttpStatus.FORBIDDEN.code,
);

export function TryCatch(target: object, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (request: Request) {
    try {
      return method.apply(this, arguments);
    } catch (e) {
      return Promise.reject(e);
    }
  };
}
