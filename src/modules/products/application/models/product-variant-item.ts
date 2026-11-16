import { ImagePrimitives } from 'src/modules/images/domain/image';
import { ProductVariantPrimitives } from '../../domain/product-variant';

export type ProductVariantItem = Partial<ProductVariantPrimitives> & { images?: ImagePrimitives[] };
