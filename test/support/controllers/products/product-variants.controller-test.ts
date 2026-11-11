import { CreateProductVariantDto } from 'src/modules/products/dto/create-product-variant.dto';
import { ProductVariantImagesDto } from 'src/modules/products/dto/product-variant-images.dto';
import { ProductVariantResponseDto } from 'src/modules/products/dto/product-variant-response.dto';
import { UpdateProductVariantDto } from 'src/modules/products/dto/update-product-variant.dto';
import { UpdateVariantsSortOrderDto } from 'src/modules/products/dto/update-variant-sort-order.dto';
import { AffectedResponseDto } from 'src/modules/shared/dto/affected-response.dto';
import { DetachImagesDto } from 'src/modules/shared/dto/detach-images.dto';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { UserAgent } from 'test/support/helpers/app-test.helper';
import { ExpectedTestStatusCode } from 'test/support/types/expected-test-status-code.type';
import { parseResponseBody } from 'test/support/utils/parse-response-body.util';

export class ProductVariantsControllerTest {
  readonly urlPrefix = '/api/v1/products';

  constructor(private readonly agent: UserAgent) {}

  withAgent(agent: UserAgent): ProductVariantsControllerTest {
    return new ProductVariantsControllerTest(agent);
  }

  async create(
    productId: string,
    data: CreateProductVariantDto = { description: 'variant', info: {}, price: 49.99, sortOrder: 1 },
    statusCode: ExpectedTestStatusCode = { code: 201, parseBody: true },
  ) {
    const response = await this.agent
      .post(`${this.urlPrefix}/${productId}/variants`)
      .send(data)
      .expect(statusCode.code);

    return {
      response,
      body: parseResponseBody<ProductVariantResponseDto>(response, statusCode.parseBody),
    };
  }

  async findAll(productId: string, statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true }) {
    const response = await this.agent.get(`${this.urlPrefix}/${productId}/variants`).expect(statusCode.code);

    return {
      response,
      body: parseResponseBody<ProductVariantResponseDto[]>(response, statusCode.parseBody),
    };
  }

  async findById(
    productId: string,
    variantId: string,
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent
      .get(`${this.urlPrefix}/${productId}/variants/${variantId}`)
      .expect(statusCode.code);

    return {
      response,
      body: parseResponseBody<ProductVariantResponseDto>(response, statusCode.parseBody),
    };
  }

  async update(
    productId: string,
    variantId: string,
    data: UpdateProductVariantDto,
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent
      .patch(`${this.urlPrefix}/${productId}/variants/${variantId}`)
      .send(data)
      .expect(statusCode.code);

    return {
      response,
      body: parseResponseBody<ProductVariantResponseDto>(response, statusCode.parseBody),
    };
  }

  async updateSortOrder(
    productId: string,
    data: UpdateVariantsSortOrderDto,
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent
      .patch(`${this.urlPrefix}/${productId}/variants/sort-order`)
      .send(data)
      .expect(statusCode.code);

    return {
      response,
      body: parseResponseBody<ProductVariantResponseDto[]>(response, statusCode.parseBody),
    };
  }
}

export class ProductVariantImagesControllerTest {
  readonly urlPrefix = '/api/v1/product-variants';

  constructor(private readonly agent: UserAgent) {}

  withAgent(agent: UserAgent): ProductVariantImagesControllerTest {
    return new ProductVariantImagesControllerTest(agent);
  }

  async attachImages(
    variantId: string,
    data: ProductVariantImagesDto,
    statusCode: ExpectedTestStatusCode = { code: 201, parseBody: true },
  ) {
    const response = await this.agent.post(`${this.urlPrefix}/${variantId}/images`).send(data).expect(statusCode.code);

    return {
      response,
      body: parseResponseBody<ImageResponseDto[]>(response, statusCode.parseBody),
    };
  }

  async detachImages(
    variantId: string,
    data: DetachImagesDto,
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent
      .post(`${this.urlPrefix}/${variantId}/images/detach`)
      .send(data)
      .expect(statusCode.code);

    return {
      response,
      body: parseResponseBody<AffectedResponseDto>(response, statusCode.parseBody),
    };
  }

  async updateImageSortOrder(
    variantId: string,
    data: ProductVariantImagesDto,
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent
      .patch(`${this.urlPrefix}/${variantId}/images/sort-order`)
      .send(data)
      .expect(statusCode.code);

    return {
      response,
      body: parseResponseBody<AffectedResponseDto>(response, statusCode.parseBody),
    };
  }
}
