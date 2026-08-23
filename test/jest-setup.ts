import 'reflect-metadata';
import crypto from 'crypto';

process.env.NODE_ENV = 'test';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
process.env.JWT_PRIVATE_KEY = privateKey;
process.env.JWT_PUBLIC_KEY = publicKey;

process.env.DATABASE_PORT = process.env.DATABASE_PORT || '54329';
process.env.REDIS_PORT = process.env.REDIS_PORT || '63799';
process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'hrms_directory_db_test';

jest.setTimeout(30000);
