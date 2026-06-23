import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity } from 'typeorm';

@Entity('brands')
export class BrandEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 30, unique: true })
  name!: string;
  @CreateDateColumn()
  createdAt!: Date;
}
