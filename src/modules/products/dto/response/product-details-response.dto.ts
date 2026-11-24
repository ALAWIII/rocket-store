import { BrandResponseDto } from 'src/modules/brands/dto/brand-response.dto';
import { ProductResponseDto } from './product-response.dto';
import { CategoryResponseDto } from 'src/modules/categories/dto/category-response.dto';
import { ProductVariantResponseDto } from './product-variant-response.dto';

export class ProductDetailsResponseDto {
  product!: ProductResponseDto;
  brand!: BrandResponseDto | null;
  variants!: ProductVariantResponseDto[];
  categories!: CategoryResponseDto[];
}
