import { PaginationResponseDto } from 'src/modules/shared/dto/pagination-response.dto';
import { ProductResponseDto } from './product-response.dto';

export class FindAllProductsResponseDto {
  products!: ProductResponseDto[];
  pagination!: PaginationResponseDto;
}
