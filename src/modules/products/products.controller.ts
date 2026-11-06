import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindByIdQuery } from './dto/find-by-id-query.dto';
import { ProductDetailsResponseDto } from './dto/product-details-response.dto';
import { FindAllProductsQueryDto } from './dto/find-all-products-query.dto';
import { FindAllProductsResponseDto } from './dto/find-all-products-response.dto';
import { AttachImagesDto } from '../shared/dto/attach-images.dto';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { AffectedResponseDto } from '../shared/dto/affected-response.dto';
import { DetachImagesDto } from '../shared/dto/detach-images.dto';
import { AttachCategoriesDto } from './dto/attach-categories.dto';
import { ProductCategoriesResponseDto } from './dto/product-categories-response.dto';

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

  @Get(':id')
  @RequirePermission(AllPermissions.product.ProductReadAny)
  findById(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Query() query: FindByIdQuery,
  ): Promise<ProductDetailsResponseDto> {
    return this.productService.findById(id, query);
  }

  @Get()
  findAll(@Query() query: FindAllProductsQueryDto): Promise<FindAllProductsResponseDto> {
    return this.productService.findAll(query);
  }
  @Post(':id/images')
  @RequirePermission(AllPermissions.product.ProductAttachImageAny)
  attachImages(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() data: AttachImagesDto,
  ): Promise<ImageResponseDto[]> {
    return this.productService.attachImages(id, data.imageIds);
  }
  @Post(':id/images/detach')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(AllPermissions.product.ProductAttachImageAny)
  detachImages(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() data: DetachImagesDto,
  ): Promise<AffectedResponseDto> {
    return this.productService.detachImages(id, data.imageIds);
  }

  @Post(':id/categories')
  @RequirePermission(AllPermissions.product.ProductAttachCategoryAny)
  attachCategories(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() data: AttachCategoriesDto,
  ): Promise<ProductCategoriesResponseDto> {
    return this.productService.attachCategories(id, data.categoryIds);
  }
}
