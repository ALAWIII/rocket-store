import { Column, CreateDateColumn, Entity, ForeignKey } from 'typeorm';
import { AuditAction } from '../../domain/audit-log';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';

@Entity('audit_logs')
export class AuditLogEntity {
  @UuidV7PrimaryColumn()
  id!: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'occurred_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  occurredAt!: Date;

  @Column('uuid', { name: 'actor_id', nullable: true })
  @ForeignKey(() => UserEntity, (user) => user.id, {
    onDelete: 'SET NULL',
  })
  actorId!: string | null;

  @Column('varchar', { length: 10 })
  action!: AuditAction;

  @Column('varchar', { length: 100 }) // can be updated many times so they are not unique
  entity!: string;

  @Column('uuid', { name: 'entity_id' })
  entityId!: string;
}
