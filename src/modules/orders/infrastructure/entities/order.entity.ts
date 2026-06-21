import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { OrderStatus } from '../../domain/order';

@Entity('orders')
export class OrderEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column({ type: 'varchar', length: 15 })
  status!: OrderStatus;
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;
}
