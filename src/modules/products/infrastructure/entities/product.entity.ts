import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity, ForeignKey } from 'typeorm';
import { BrandEntity } from './brand.entity';

@Entity('products')
export class ProductEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('varchar', { length: 100 })
  title!: string;
  @Column('varchar', { length: 500 })
  description!: string;

  @Column('uuid', { nullable: true })
  @ForeignKey(() => BrandEntity, (b) => b.id)
  brandId?: string | null;
  @CreateDateColumn()
  createdAt!: Date;
}
