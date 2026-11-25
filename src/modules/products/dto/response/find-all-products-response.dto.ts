import { PaginationResponseDto } from 'src/modules/shared/dto/pagination-response.dto';
import { ProductListItem } from '../../application/models/product-list-item';

export class FindAllProductsResponseDto {
  products!: ProductListItem[];
  pagination!: PaginationResponseDto;
}
