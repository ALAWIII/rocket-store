import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}
  @Post()
  @RequirePermission(AllPermissions.product.ProductCreateAny)
  create(@Body() data: CreateProductDto): Promise<ProductResponseDto> {
    return this.productService.create(data);
  }
  @Patch(':id')
  @RequirePermission(AllPermissions.product.ProductUpdateAny)
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() data: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.update(id, data);
  }
}
