import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { validateEnvironment } from './config/env.validation';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseType = configService.get<string>('DB_TYPE', 'sqlite');
        const synchronize =
          configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true';
        const logging =
          configService.get<string>('DB_LOGGING', 'false') === 'true';

        if (databaseType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.getOrThrow<string>('DB_HOST'),
            port: Number(configService.get<string>('DB_PORT', '5432')),
            username: configService.getOrThrow<string>('DB_USERNAME'),
            password: configService.getOrThrow<string>('DB_PASSWORD'),
            database: configService.getOrThrow<string>('DB_DATABASE'),
            autoLoadEntities: true,
            synchronize,
            logging,
          } as unknown as TypeOrmModuleOptions;
        }

        if (databaseType === 'sqlite' || databaseType === 'better-sqlite3') {
          return {
            type: 'better-sqlite3',
            database: configService.get<string>(
              'DB_DATABASE',
              'data/app.sqlite',
            ),
            autoLoadEntities: true,
            synchronize,
            logging,
          } as unknown as TypeOrmModuleOptions;
        }

        throw new Error(`DB_TYPE no soportado: ${databaseType}`);
      },
    }),
    UsersModule,
    ProductsModule,
    OrdersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
