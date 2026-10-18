import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      app: 'Come Jave Backend',
      status: 'online',
      version: '1.0.0',
      message: 'API lista para manejar usuarios, productos y pedidos.',
      endpoints: {
        users: '/users',
        products: '/products',
        orders: '/orders',
      },
    };
  }
}
