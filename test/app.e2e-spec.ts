import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        app: 'Come Jave Backend',
        status: 'online',
        version: '1.0.0',
        message: 'API lista para manejar usuarios, productos y pedidos.',
        endpoints: {
          users: '/users',
          products: '/products',
          orders: '/orders',
        },
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
