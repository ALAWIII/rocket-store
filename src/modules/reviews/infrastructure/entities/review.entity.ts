import { OrderEntity } from 'src/modules/orders/infrastructure/entities/order.entity';
import { ProductEntity } from 'src/modules/products/infrastructure/entities/product.entity';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { Column, Entity, ForeignKey } from 'typeorm';
import { type ReviewStatus } from '../../domain/review';
import { CreateDateColumnTz } from 'src/modules/shared/database/decorators/timestamptz-data-column.decorator';

@Entity('reviews')
export class ReviewEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => UserEntity, (u) => u.id)
  userId!: string;
  @Column('uuid')
  @ForeignKey(() => ProductEntity, (p) => p.id)
  productId!: string;
  @Column('uuid')
  @ForeignKey(() => OrderEntity, (o) => o.id)
  orderId!: string;
  @Column('integer')
  rating!: number;
  @Column('varchar', { length: 50, nullable: true })
  title!: string | null;
  @Column('varchar', { length: 1000 })
  body!: string;
  @Column('varchar', { length: 15 })
  status!: ReviewStatus;
  @Column('timestamptz', { nullable: true })
  editedAt!: Date | null;
  @CreateDateColumnTz()
  createdAt!: Date;
}
