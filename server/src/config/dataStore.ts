import Redis from 'ioredis';

import settings from './settings';
import { appCommonTypes } from '../@types/app-common';
import RedisDataStoreOptions = appCommonTypes.RedisDataStoreOptions;

//@ts-ignore
const config = settings.redis[settings.service.env];

interface Options {
  flush?: boolean;
}

const dataStore = {
  init(options?: Options) {
    const client = new Redis({
      host: `${config.host}`,
      username: `${config.username}`,
      password: config.password,
      db: +config.database,
    });

    if (options?.flush) client.flushdb();

    return client;
  },

  async set(key: string, value: string) {
    const client = this.init();

    return client.set(key, value);
  },

  async setEx(key: string, value: string, options?: RedisDataStoreOptions) {
    const client = this.init();

    return client.setex(key, <number>options?.PX, value);
  },

  async get(key: string) {
    const client = this.init();
    return client.get(key);
  },

  async del(key: string) {
    const client = this.init();
    return client.del(key);
  },

  client() {
    return this.init();
  },

  async close() {
    return this.init().disconnect();
  },
};

export default dataStore;
