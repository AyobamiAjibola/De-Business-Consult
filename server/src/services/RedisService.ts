import settings from "../config/settings";

const Redis = require('ioredis');

class RedisService {

  private redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  });

  public saveToken(keys: string, data: any, expire?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (err: Error | null) => {
        if (err) {
          return reject(err);
        }
        resolve();
      };
  
      if (expire) {
        this.redisClient.set(keys, data, 'EX', expire, callback);
      } else {
        this.redisClient.set(keys, data, callback);
      }
    });
  }  

  public checkRedisKey(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.redisClient.exists(key, (err: any, reply: any) => {
        if (err) {
          reject(err);
        } else {
          const result = reply?.toString();
          resolve(result ?? null);
        }
      })
    });
  };

  public deleteRedisKey(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.redisClient.del(key, (err: any, reply: any) => {
        if (err) {
          reject(err);
        } else {
          const result = reply?.toString();
          resolve(result ?? null)
        }
      })
    });
  };

  public getToken(token: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.redisClient.get(token, (error: any, reply: any) => {
        if (error) {
          reject(error);
        } else {
          const data = reply ? JSON.parse(reply) : null;
          resolve(data);
        }
      });
    });
  }

  public closeConnections(): void {
    this.redisClient.quit();
  }
}

export default RedisService;


