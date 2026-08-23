import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthModule as LibsHealthModule } from '@new-hros/libs-apis';
import { ConfigurationModule, CoreModule, HealthService } from '@new-hros/libs-core';
import request, { Response } from 'supertest';

describe('Directory Service HealthCheck (e2e)', () => {
  let app: INestApplication;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let healthServiceMock: any;

  beforeAll(async () => {
    healthServiceMock = {
      checkAll: jest.fn().mockResolvedValue({
        status: 'up',
        components: {
          postgres: { status: 'up' },
          redis: { status: 'up' },
        },
      }),
      registerIndicator: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigurationModule.register({ configDir: 'config' }),
        CoreModule.forRoot({ cache: { store: 'memory' } }),
        LibsHealthModule,
      ],
    })
      .overrideProvider(HealthService)
      .useValue(healthServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) - 200 OK when healthy', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toEqual({
          status: 'ok',
          info: {
            postgres: { status: 'up' },
            redis: { status: 'up' },
          },
          error: {},
          details: {
            postgres: { status: 'up' },
            redis: { status: 'up' },
          },
        });
      });
  });

  it('/health (GET) - 503 SERVICE UNAVAILABLE when degraded', () => {
    healthServiceMock.checkAll.mockResolvedValueOnce({
      status: 'down',
      components: {
        postgres: { status: 'up' },
        redis: { status: 'down', error: 'Connection failure' },
      },
    });

    return request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect((res: Response) => {
        expect(res.body).toEqual({
          status: 'error',
          info: {
            postgres: { status: 'up' },
          },
          error: {
            redis: { status: 'down', error: 'Connection failure' },
          },
          details: {
            postgres: { status: 'up' },
            redis: { status: 'down', error: 'Connection failure' },
          },
        });
      });
  });
});
