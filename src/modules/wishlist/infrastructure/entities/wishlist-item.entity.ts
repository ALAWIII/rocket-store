import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity, ForeignKey } from 'typeorm';
import { WishlistEntity } from './wishlist.entity';
import { ProductEntity } from 'src/modules/products/infrastructure/entities/product.entity';
import { ProductVariantEntity } from 'src/modules/products/infrastructure/entities/product-variant.entity';

@Entity('wishlist_items')
export class WishlistItemEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => WishlistEntity, (w) => w.id)
  wishlistId!: string;
  @Column('uuid')
  @ForeignKey(() => ProductEntity, (p) => p.id)
  productId!: string;
  @Column('uuid', { nullable: true })
  @ForeignKey(() => ProductVariantEntity, (pv) => pv.id)
  variantId!: string | null;
  @Column('varchar', { nullable: true, length: 500 })
  note!: string | null;
  @CreateDateColumn({ name: 'added_at' })
  addedAt!: Date;
}
