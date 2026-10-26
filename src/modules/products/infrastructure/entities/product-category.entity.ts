import { CategoryEntity } from 'src/modules/categories/infrastructure/entities/category.entity';
import { Entity, ForeignKey, Index, PrimaryColumn } from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('product_categories')
@Index('idx_pc_cat', ['categoryId'])
@Index('idx_pc_prod', ['productId'])
export class ProductCategoryEntity {
  @PrimaryColumn('uuid')
  @ForeignKey(
    () => CategoryEntity,
    (cat) => cat.id,
    { onDelete: 'CASCADE' },
  )
  categoryId!: string;

  @PrimaryColumn('uuid')
  @ForeignKey(
    () => ProductEntity,
    (p) => p.id,
    { onDelete: 'CASCADE' },
  )
  productId!: string;
}
