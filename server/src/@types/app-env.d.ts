declare namespace NodeJS {
  interface ProcessEnv {
    //Environment configuration
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    ROOT_API: string;

    QUEUE_CONN_URL: string;

    //Redis configuration
    REDIS_HOST: string;
    REDIS_USERNAME: string;
    REDIS_PASSWORD: string;
    REDIS_PORT: string;
    REDIS_DEV_DB_NAME: string;
    REDIS_PROD_DB_NAME: string;
    REDIS_TEST_DB_NAME: string;

    MONGO_DEV_HOST: string;
    MONGO_PROD_HOST: string;
    MONGO_TEST_HOST: string;

    JWT_KEY: string; // JWT key
    JWT_EXPIRY: string; // JWT key
    CLIENT_HOST: string;

    PAYMENT_GW_NAME: string;
    PAYMENT_GW_BASE_URL: string;
    PAYMENT_GW_SECRET_KEY: string;
    PAYMENT_GW_CB_URL: string;
    PAYMENT_GW_WEB_HOOK: string;

    BCRYPT_SALT: string;
    ADMIN_PASS: string;

    COOKIE_AUTH: string;
    COOKIE_SECRET: string;

    SSL_CRT_FILE: string;
    SSL_KEY_FILE: string;
  }
}
