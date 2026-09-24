import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApisModule, Public } from '@new-hros/libs-apis';
import { ConfigurationModule, CoreModule } from '@new-hros/libs-core';
import request, { Response } from 'supertest';

@Controller('test-correlation')
@Public()
class TestCorrelationController {
  @Get()
  getTest(): { ok: boolean } {
    return { ok: true };
  }
}

describe('Correlation Headers & Request ID Propagation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigurationModule.register({ configDir: 'config' }),
        CoreModule.forRoot(),
        ApisModule.forRoot({
          auth: {
            publicKey: 'test-public-key',
          },
        }),
      ],
      controllers: [TestCorrelationController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return client request-id in response header', () => {
    const testReqId = 'correlation-trace-id-abc';

    return request(app.getHttpServer())
      .get('/test-correlation')
      .set('x-request-id', testReqId)
      .expect(200)
      .expect((res: Response) => {
        expect(res.headers['x-request-id']).toBe(testReqId);
        expect(res.body).toEqual({ ok: true });
      });
  });

  it('should automatically generate a UUID request-id if header is missing', () => {
    return request(app.getHttpServer())
      .get('/test-correlation')
      .expect(200)
      .expect((res: Response) => {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.headers['x-request-id'].length).toBeGreaterThan(10);
      });
  });
});
