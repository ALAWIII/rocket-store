import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Entity } from 'typeorm';

@Entity('product_categories')
export class ProductCategoryEntity {
  @UuidV7PrimaryColumn()
  categoryId!: string;
  @UuidV7PrimaryColumn()
  productId!: string;
}
