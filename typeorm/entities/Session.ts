import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('sessions')
export class Session {
  @UuidV7PrimaryColumn()
  id!: string;

  @Column('timestamptz', { name: 'expiresAt' })
  expiresAt!: Date;

  @Column('text', { name: 'token', unique: true })
  token!: string;

  @Column('timestamptz', {
    name: 'createdAt',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column('timestamptz', { name: 'updatedAt' })
  updatedAt!: Date;

  @Column('text', { name: 'ipAddress', nullable: true })
  ipAddress!: string | null;

  @Column('text', { name: 'userAgent', nullable: true })
  userAgent!: string | null;

  @Index('session_userId_idx')
  @Column('uuid', { name: 'userId' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: UserEntity;
}
