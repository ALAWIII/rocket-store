import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { Column, CreateDateColumn, Entity, ForeignKey } from 'typeorm';
import { OrderStatus } from '../../domain/order';

@Entity('orders')
export class OrderEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'integer', default: 0 }) // using integer minor units like cents/pennies.
  totalAmount!: number;
  @Column({ type: 'varchar', length: 15 })
  status!: OrderStatus;
  @Column('uuid')
  @ForeignKey(() => UserEntity, (u) => u.id)
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
