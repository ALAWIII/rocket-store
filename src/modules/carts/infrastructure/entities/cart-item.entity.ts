import { Column, Entity, ForeignKey } from 'typeorm';
import { CartEntity } from './cart.entity';
import { ProductVariantEntity } from 'src/modules/products/infrastructure/entities/product-variant.entity';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';

@Entity('cart_items')
export class CartItemEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => ProductVariantEntity, (p) => p.id)
  productVariantId!: string;
  @Column('uuid')
  @ForeignKey(() => CartEntity, (c) => c.id, { onDelete: 'CASCADE' })
  cartId!: string;

  @Column('integer', { default: 1 })
  quantity!: number;
}
