import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ProductsVariantsService } from './product-variants.service';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { ProductVariantResponseDto } from './dto/product-variant-response.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { UpdateVariantsSortOrderDto } from './dto/update-variant-sort-order.dto';
import { ProductVariantImagesDto } from './dto/product-variant-images.dto';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { DetachImagesDto } from '../shared/dto/detach-images.dto';
import { AffectedResponseDto } from '../shared/dto/affected-response.dto';

@Controller('products/:id/variants')
export class ProductVariantsController {
  constructor(private readonly pvariantService: ProductsVariantsService) {}

  @Post()
  @RequirePermission(AllPermissions.product.ProductCreateAny)
  create(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Body() data: CreateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    return this.pvariantService.create(productId, data);
  }

  @Get()
  findAll(@Param('id', new ParseUUIDPipe({ version: '7' })) productId: string): Promise<ProductVariantResponseDto[]> {
    return this.pvariantService.findAll(productId);
  }

  @Get(':variantId')
  findById(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
  ): Promise<ProductVariantResponseDto> {
    return this.pvariantService.findById(productId, variantId);
  }

  @Patch(':variantId')
  @RequirePermission(AllPermissions.product.ProductUpdateAny)
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() data: UpdateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    return this.pvariantService.update(productId, variantId, data);
  }

  @Patch('sort-order')
  @RequirePermission(AllPermissions.product.ProductUpdateAny)
  updateSortOrder(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Body() data: UpdateVariantsSortOrderDto,
  ): Promise<ProductVariantResponseDto[]> {
    return this.pvariantService.updateSortOrder(productId, data);
  }
}

@Controller('product-variants/:variantId/images')
export class ProductVariantImagesController {
  constructor(private readonly pvariantService: ProductsVariantsService) {}

  @Post()
  @RequirePermission(AllPermissions.product.ProductManageImageAny)
  attachImages(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() data: ProductVariantImagesDto,
  ): Promise<ImageResponseDto[]> {
    return this.pvariantService.attachImages(variantId, data);
  }

  @Post('detach')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(AllPermissions.product.ProductManageImageAny)
  detachImages(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() data: DetachImagesDto,
  ): Promise<AffectedResponseDto> {
    return this.pvariantService.detachImages(variantId, data.imageIds);
  }

  @Patch('sort-order')
  @RequirePermission(AllPermissions.product.ProductManageImageAny)
  updateImageSortOrder(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() data: ProductVariantImagesDto,
  ): Promise<AffectedResponseDto> {
    return this.pvariantService.updateVariantImageSortOrders(variantId, data);
  }
}
