import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('account')
export class Account {
  @UuidV7PrimaryColumn()
  id!: string;

  @Column('text', { name: 'accountId' })
  accountId!: string;

  @Column('text', { name: 'providerId' })
  providerId!: string;

  @Index('account_userId_idx')
  @Column('uuid', { name: 'userId' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: UserEntity;

  @Column('text', { name: 'accessToken', nullable: true })
  accessToken!: string | null;

  @Column('text', { name: 'refreshToken', nullable: true })
  refreshToken!: string | null;

  @Column('text', { name: 'idToken', nullable: true })
  idToken!: string | null;

  @Column('timestamptz', { name: 'accessTokenExpiresAt', nullable: true })
  accessTokenExpiresAt!: Date | null;

  @Column('timestamptz', { name: 'refreshTokenExpiresAt', nullable: true })
  refreshTokenExpiresAt!: Date | null;

  @Column('text', { name: 'scope', nullable: true })
  scope!: string | null;

  @Column('text', { name: 'password', nullable: true })
  password!: string | null;

  @Column('timestamptz', {
    name: 'createdAt',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column('timestamptz', { name: 'updatedAt' })
  updatedAt!: Date;
}
