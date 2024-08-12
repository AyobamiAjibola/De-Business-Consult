import { Redis } from 'ioredis';
// import twilio from 'twilio';
import crypto from 'crypto';
import settings from '../config/settings';
// const Redis = require('ioredis');

class RedisService {
  private twilioConfig = {
    accountSid: settings.twilio.twilioSid,
    authToken: settings.twilio.twilioAuthToken,
    phoneNumber: settings.twilio.phoneNumber
  };

  private redisClient = new Redis({
    host: 'redis',
    port: 6379
  });
  // private twilioClient = twilio(this.twilioConfig.accountSid, this.twilioConfig.authToken);
  // private twilioPhoneNumber = this.twilioConfig.phoneNumber;

  public generateToken(): string {
    const letters = '0123456789';
    const letterCount = letters.length;
    const limit = 4;
    const randomBytes = crypto.randomBytes(limit);
    let token = '';
    for (let i = 0; i < limit; i++) {
      const randomNum = randomBytes[i] % letterCount;
      token += letters[randomNum];
    }

    return token;
  }

  // public saveToken(keys: string, data: any, expire: number): void {
  //   this.redisClient.set(keys, data, 'EX', expire);
  // }

  public saveToken(keys: string, data: any, expire?: number): void {
    if (expire) {
      this.redisClient.set(keys, data, 'EX', expire);
    } else {
      this.redisClient.set(keys, data);
    }
  }

  // public sendNotification(phoneNumber: string, message: string): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     this.twilioClient.messages
  //       .create({
  //         body: message,
  //         from: this.twilioPhoneNumber,
  //         to: phoneNumber
  //       })
  //       .then((response: any) => {
  //         resolve(response);
  //       })
  //       .catch((error) => {
  //         reject(error);
  //       });
  //   });
  // }

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

  public getToken(token: string): Promise<string | null> {
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


