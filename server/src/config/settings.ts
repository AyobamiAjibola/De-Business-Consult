import { appCommonTypes } from '../@types/app-common';
import AppSettings = appCommonTypes.AppSettings;

export const LOGIN_TOKEN = 'token';

const settings: AppSettings = {
  twilio: {
    twilioSid: <string>process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: <string>process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: <string>process.env.TWILIO_PHONE_NUMBER
  },
  paystack: {
    apiKey: <string>process.env.PAYMENT_GW_SECRET_KEY
  },
  nodemailer: {
    email: <string>process.env.NODEMAILER_EMAIL_ADDRESS,
    password: <string>process.env.NODEMAILER_EMAIL_PASSWORD,
    service: <string>process.env.NODEMAILER_SERVICE,
    host: <string>process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    secure: process.env.NODEMAILER_SECURE,
  },
  termii: {
    host: <string>process.env.TERMII_HOST,
    key: <string>process.env.TERMII_SECRET,
    from: <string>process.env.TERMII_FROM,
    message: <string>process.env.TERMII_MESSAGE
  },
  queue: {
    development: {
      host: <string>process.env.QUEUE_CONN_URL,
    },
    production: {
      host: <string>process.env.QUEUE_CONN_URL,
    },
    test: {
      host: <string>process.env.QUEUE_CONN_URL,
    },
  },
  jwt: {
    key: <string>process.env.JWT_KEY,
    expiry: <string>process.env.JWT_EXPIRY,
  },
  jwtAccessToken: {
    key: <string>process.env.JWT_ACCESS_KEY,
    expiry: <string>process.env.JWT_ACCESS_EXPIRY,
  },
  jwtRefreshToken: {
    key: <string>process.env.JWT_REFRESH_KEY,
    expiry: <string>process.env.JWT_REFRESH_EXPIRY,
  },
  redis: {
    development: {
      database: <string>process.env.REDIS_DEV_DB_NAME,
      host: <string>process.env.REDIS_HOST,
      username: <string>process.env.REDIS_USERNAME,
      password: <string>process.env.REDIS_PASSWORD,
      port: <string>process.env.REDIS_PORT,
    },
    production: {
      database: <string>process.env.REDIS_PROD_DB_NAME,
      host: <string>process.env.REDIS_HOST,
      username: <string>process.env.REDIS_USERNAME,
      password: <string>process.env.REDIS_PASSWORD,
      port: <string>process.env.REDIS_PORT,
    },
    test: {
      database: <string>process.env.REDIS_TEST_DB_NAME,
      host: <string>process.env.REDIS_HOST,
      username: <string>process.env.REDIS_USERNAME,
      password: <string>process.env.REDIS_PASSWORD,
      port: <string>process.env.REDIS_PORT,
    },
  },
  mongo: {
    development: {
      host: <string>process.env.MONGO_DEV_HOST,
      port: process.env.MONGO_PORT
    },
    production: {
      host: <string>process.env.MONGO_PROD_HOST,
      port: process.env.MONGO_PORT
    },
    test: {
      host: <string>process.env.MONGO_TEST_HOST,
      port: process.env.MONGO_PORT
    },
  },
  service: {
    env: <string>process.env.NODE_ENV,
    port: <string>process.env.PORT,
    apiRoot: <string>process.env.ROOT_API,
  },
  rabbitMq: {
    connection: ''
  },
  googleOAuth: {
    google_client_id: '',
    google_client_secret: '',
    google_callbackURL: ''
  },
  facebookAuth: {
    client_ID: '',
    client_secret: '',
    facebook_callbackURL: ''
  },
  instagramAuth: {
    client_ID: '',
    client_secret: '',
    instagram_callbackURL: ''
  }
};

export default settings;
