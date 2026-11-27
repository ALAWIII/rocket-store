import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsVariantsService } from './product-variants.service';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { CreateProductVariantDto } from './dto/request/write/create-product-variant.dto';
import { ProductVariantResponseDto } from './dto/response/product-variant-response.dto';
import { UpdateProductVariantDto } from './dto/request/write/update-product-variant.dto';
import { UpdateVariantsSortOrderDto } from './dto/request/write/update-variant-sort-order.dto';
import { ProductVariantImagesDto } from './dto/request/write/product-variant-images.dto';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { DetachImagesDto } from '../shared/dto/detach-images.dto';
import { AffectedResponseDto } from '../shared/dto/affected-response.dto';
import { FindVariantsQueryDto } from './dto/request/read/find-variants-query.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('products/:id/variants')
export class ProductVariantsController {
  constructor(private readonly pvariantService: ProductsVariantsService) {}

  // --- POST ---
  @Post()
  @RequirePermission(AllPermissions.product.ProductCreateAny)
  create(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Body() data: CreateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    return this.pvariantService.create(productId, data);
  }

  // --- GET ---
  // Base path
  @AllowAnonymous()
  @Get()
  findAll(@Param('id', new ParseUUIDPipe({ version: '7' })) productId: string): Promise<ProductVariantResponseDto[]> {
    return this.pvariantService.findAll(productId, 'public');
  }

  // Static 'admin' MUST come before dynamic ':variantId'
  @Get('admin')
  @RequirePermission(AllPermissions.product.ProductReadAny)
  findAllAdmin(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Query() query: FindVariantsQueryDto,
  ): Promise<ProductVariantResponseDto[]> {
    return this.pvariantService.findAll(productId, query.visibility);
  }

  // Specific dynamic path comes before generic dynamic path
  @Get(':variantId/admin')
  @RequirePermission(AllPermissions.product.ProductReadAny)
  findByIdAdmin(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Query() query: FindVariantsQueryDto,
  ): Promise<ProductVariantResponseDto> {
    return this.pvariantService.findById(productId, variantId, query.visibility);
  }

  // Generic dynamic route MUST be last
  @AllowAnonymous()
  @Get(':variantId')
  findById(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
  ): Promise<ProductVariantResponseDto> {
    return this.pvariantService.findById(productId, variantId, 'public');
  }

  // --- PATCH ---
  // Static 'sort-order' MUST come before dynamic ':variantId'
  @Patch('sort-order')
  @RequirePermission(AllPermissions.product.ProductUpdateAny)
  updateSortOrder(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Body() data: UpdateVariantsSortOrderDto,
  ): Promise<ProductVariantResponseDto[]> {
    return this.pvariantService.updateSortOrder(productId, data);
  }

  // Generic dynamic route MUST be last
  @Patch(':variantId')
  @RequirePermission(AllPermissions.product.ProductUpdateAny)
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() data: UpdateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    return this.pvariantService.update(productId, variantId, data);
  }
}

@Controller('product-variants/:variantId/images')
export class ProductVariantImagesController {
  constructor(private readonly pvariantService: ProductsVariantsService) {}

  // --- POST ---
  // Static 'detach' MUST come before base @Post() if you ever add @Post(':id') later
  @Post('detach')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(AllPermissions.product.ProductManageImageAny)
  detachImages(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() data: DetachImagesDto,
  ): Promise<AffectedResponseDto> {
    return this.pvariantService.detachImages(variantId, data.imageIds);
  }

  @Post()
  @RequirePermission(AllPermissions.product.ProductManageImageAny)
  attachImages(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() data: ProductVariantImagesDto,
  ): Promise<ImageResponseDto[]> {
    return this.pvariantService.attachImages(variantId, data);
  }

  // --- PATCH ---
  // No dynamic PATCH routes currently exist here, but keeping it organized
  @Patch('sort-order')
  @RequirePermission(AllPermissions.product.ProductManageImageAny)
  updateImageSortOrder(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() data: ProductVariantImagesDto,
  ): Promise<AffectedResponseDto> {
    return this.pvariantService.updateVariantImageSortOrders(variantId, data);
  }
}
