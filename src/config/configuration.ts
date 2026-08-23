export interface AppConfig {
  name: string;
  port: number;
  env: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  name: string;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
}

export interface DirectoryServiceConfig {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  kafka: KafkaConfig;
  jwt: {
    publicKey?: string;
    privateKey?: string;
  };
}

export default (): DirectoryServiceConfig => ({
  app: {
    name: process.env.APP_NAME || 'hrms-directory-service',
    port: parseInt(process.env.APP_PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'hrms_user',
    password: process.env.DATABASE_PASSWORD || 'hrms_password',
    name: process.env.DATABASE_NAME || 'hrms_directory_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'hrms-directory-service-client',
    groupId: process.env.KAFKA_GROUP_ID || 'hrms-directory-service-group',
  },
  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY,
    privateKey: process.env.JWT_PRIVATE_KEY,
  },
});
