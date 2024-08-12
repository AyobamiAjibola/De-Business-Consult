import endpoints from '../config/endpoints';
import settings from '../config/settings';
import { Router } from 'express';
import asyncErrorWrapper from '../middleware/asyncErrorWrapper';

type RouteMethods = 'get' | 'post' | 'put' | 'delete' | 'patch';

const router = Router();

endpoints.forEach(value => {
    const method = value.method as RouteMethods;
   
    router[method](value.path, asyncErrorWrapper(value.handler));
});

export default router;