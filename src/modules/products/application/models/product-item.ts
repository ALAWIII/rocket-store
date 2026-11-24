import { ProductPrimitives } from '../../domain/product';

export type ProductItem = Partial<Omit<ProductPrimitives, 'coverImage'>> & { coverImageId?: string };
