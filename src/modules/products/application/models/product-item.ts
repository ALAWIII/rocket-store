import { ImagePrimitives } from 'src/modules/images/domain/image';
import { ProductPrimitives } from '../../domain/product';

export type ProductItem = Partial<ProductPrimitives> & { coverImage?: ImagePrimitives };
