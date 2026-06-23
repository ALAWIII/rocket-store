import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity } from 'typeorm';

@Entity('images')
export class ImageEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid', { unique: true })
  storageKey!: string;
  @Column('varchar', { length: 50 })
  name!: string;
  @Column('text', { nullable: true })
  url!: string | null;
  @Column('varchar', { length: 100 })
  mimeType!: string;
  @Column('bigint')
  sizeBytes!: number;
  @Column('integer', { nullable: true })
  width!: number | null;
  @Column('integer', { nullable: true })
  height!: number | null;
  @Column('varchar', { length: 100, nullable: true })
  altText!: string | null;
  @Column('jsonb', { nullable: true })
  metadata!: Record<string, unknown> | null;
  @CreateDateColumn()
  createdAt!: Date;
}
