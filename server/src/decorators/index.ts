import { Request } from 'express';

import 'reflect-metadata';

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
