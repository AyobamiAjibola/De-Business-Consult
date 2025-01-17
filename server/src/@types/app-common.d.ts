import { appModelTypes } from './app-model';
import Permission from '../models/Permission';
import type { Fields, Files } from 'formidable';
import type { Attributes } from 'sequelize';
import IncomingForm from 'formidable/Formidable';
import { Response, Request, NextFunction } from 'express';
import { ICustomerModel } from '../models/Customer';
import { IRestaurantUserModel } from '../models/RestaurantUser';

export declare namespace appCommonTypes {
  import IPermission = appModelTypes.IPermission;

  type DatabaseEnv = 'development' | 'production' | 'test';
  
  type AuthPayload = {
    permissions: IPermission[];
    userId: number;
    restuarantId?: number;
    customer?: number;
  };

  type CustomJwtPayload = JwtPayload & AuthPayload;

  type AppRequestParams = {
    customerId: string;
    appointmentId: string;
    driverId: string;
  };

  type QueueMailTypes = 'DE-EMAIL' | 'DE-PAYMENT' | 'DLQ' | 'DLX' | 'DE-CHAT-MESSAGE' | 'DE-CHAT-SEEN' | 'DE-CALENDLY' | 'DE-TEXT';
  type AnyObjectType = { [p: string]: any };

  interface DatabaseConfig {
    host?: string;
    username?: string;
    password?: string;
    port?: string;
    dialect?: string;
    database?: string;
  }

  interface AppSettings {
    termii: {
      host: string;
      key: string;
      from: string;
      message: string;
    };
    paystack: {
      apiKey: string
    };
    redis: Record<DatabaseEnv, DatabaseConfig>;
    mongo: Record<DatabaseEnv, DatabaseConfig>;
    queue: Record<DatabaseEnv, DatabaseConfig>;
    service: {
      port: string;
      env: string;
      apiRoot?: string;
    };
    jwt: { key: string; expiry: string };
    jwtAccessToken: { key: string; expiry: string };
    jwtRefreshToken: { key: string; expiry: string };
    twilio: {
      twilioSid: string;
      twilioAuthToken: string;
      phoneNumber: string;
    };
    nodemailer: {
      email: string;
      password: string;
      service: string;
      host: string;
      port: any;
      secure: any;
    },
    googleOAuth: {
      google_client_id: string,
      google_client_secret: string,
      google_callbackURL: string
    },
    facebookAuth: {
      client_ID: string,
      client_secret: string,
      facebook_callbackURL: string
    },
    instagramAuth: {
      client_ID: string,
      client_secret: string,
      instagram_callbackURL: string
    },
    rabbitMq: {
      connection: string
    },
    stripe: {
      secret_key: string,
      api_version: any,
      web_hook_secret: string
    }
  }

  interface HttpResponse<T> {
    message: string;
    code: number;
    timestamp?: string;
    result?: T | null;
    results?: T[];
    count?: number;
    newOrdersCount?: number;
    totalAmount?: number;
  }

  type AsyncWrapper = (req: Request, res: Response, next: NextFunction) => Promise<void>;

  interface RouteEndpointConfig {
    name: string;
    path: string;
    method: string;
    handler: AsyncWrapper;
    hasRole?: string;
    hasAuthority?: string;
    hasAnyRole?: string[];
    hasAnyAuthority?: string[];
  }

  type RouteEndpoints = RouteEndpointConfig[];

  interface RedisDataStoreOptions {
    PX: number | string; //Expiry date in milliseconds
  }

  interface BcryptPasswordEncoder {
    encode(rawPassword: string): Promise<string>;

    match(rawPassword: string, hash: string): Promise<boolean>;
  }

  interface QueueEvents {
    name: QueueMailTypes;
  }

  interface StatusTypes {
    sent: string,
    delivered: string,
    read: string
  }

  interface MailTextConfig {
    message?: string,
    subText?: string,
    content?: string,
    fullName?: string,
    email?: string,
    phone?: string
  }
}

declare global {
  namespace Express {
    export interface Request {
      files: Files;
      fields: Fields;
      permissions: Attributes<Permission>[];
      user: IRestaurantUserModel;
      form: IncomingForm;
      jwt: string;
      subscription: any;
      jwtToken: string;
      data: string;
      customer: ICustomerModel
    }
  }
}
