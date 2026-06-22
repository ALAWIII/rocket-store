import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity, ForeignKey } from 'typeorm';
import { OrderEntity } from './order.entity';
import { ProductVariantEntity } from 'src/modules/products/infrastructure/entities/product-variant.entity';

@Entity('order_items')
export class OrderItemEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 100 })
  productTitle!: string;
  @Column('integer', { default: 0 })
  unitPrice!: number;
  @Column('integer', { default: 0 })
  quantity!: number;
  @Column('integer', { default: 0 })
  subtotal!: number;
  @Column({ type: 'uuid', name: 'order_id' })
  @ForeignKey(() => OrderEntity, (o) => o.id, {
    onDelete: 'CASCADE',
  })
  orderId!: string;

  @Column({ type: 'uuid', name: 'product_variant_id' })
  @ForeignKey(() => ProductVariantEntity, (p) => p.id, {
    onDelete: 'RESTRICT',
  })
  productVariantId!: string;
}
