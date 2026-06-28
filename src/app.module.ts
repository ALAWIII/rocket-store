import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ImagesModule } from './modules/images/images.module';
import { CartsModule } from './modules/carts/carts.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { DataSource } from 'typeorm';
import { createAuth } from './auth/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DataSource],
      useFactory: (dataSource: DataSource) => ({
        auth: createAuth(dataSource),
      }),
    }),
    AuditLogModule,
    UsersModule,
    ProductsModule,
    WishlistModule,
    ShippingModule,
    ReviewsModule,
    PromotionsModule,
    PaymentsModule,
    OrdersModule,
    ImagesModule,
    CartsModule,
  ],
})
export class AppModule {}
