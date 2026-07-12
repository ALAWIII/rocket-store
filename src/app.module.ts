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
import { AppAuthModule } from './auth/auth.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { AppErrorModule } from './error/app-error.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppErrorModule,
    DatabaseModule,
    AppAuthModule,
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
    AccessControlModule,
  ],
})
export class AppModule {}
