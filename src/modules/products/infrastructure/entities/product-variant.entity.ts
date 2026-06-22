import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Entity } from 'typeorm';

@Entity('product_variants')
export class ProductVariantEntity {
  @UuidV7PrimaryColumn()
  id!: string;
}
