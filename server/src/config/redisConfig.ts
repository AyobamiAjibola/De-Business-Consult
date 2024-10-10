import { Redis } from 'ioredis';
import settings from '../config/settings';

//@ts-ignore
const config = settings.redis[settings.service.env];

const redisClient = async () => {
    return new Redis({
        host: config.host,
        port: config.port
    });
};

export default redisClient;
