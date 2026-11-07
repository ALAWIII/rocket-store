import { AttachCategoriesDto } from 'src/modules/products/dto/attach-categories.dto';
import { CreateProductDto } from 'src/modules/products/dto/create-product.dto';
import { DetachCategoriesDto } from 'src/modules/products/dto/detach-categories.dto';
import { FindAllProductsQueryDto } from 'src/modules/products/dto/find-all-products-query.dto';
import { FindAllProductsResponseDto } from 'src/modules/products/dto/find-all-products-response.dto';
import { FindByIdQuery } from 'src/modules/products/dto/find-by-id-query.dto';
import { ProductCategoriesResponseDto } from 'src/modules/products/dto/product-categories-response.dto';
import { ProductDetailsResponseDto } from 'src/modules/products/dto/product-details-response.dto';
import { ProductResponseDto } from 'src/modules/products/dto/product-response.dto';
import { UpdateProductDto } from 'src/modules/products/dto/update-product.dto';
import { AffectedResponseDto } from 'src/modules/shared/dto/affected-response.dto';
import { AttachImagesDto } from 'src/modules/shared/dto/attach-images.dto';
import { DetachImagesDto } from 'src/modules/shared/dto/detach-images.dto';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { UserAgent } from 'test/support/helpers/app-test.helper';
import { ExpectedTestStatusCode } from 'test/support/types/expected-test-status-code.type';
import { parseResponseBody } from 'test/support/utils/parse-response-body.util';

export class ProductsControllerTest {
  readonly urlPrefix = '/api/v1/products';
  constructor(private readonly agent: UserAgent) {}

  withAgent(agent: UserAgent): ProductsControllerTest {
    return new ProductsControllerTest(agent);
  }

  async create(product?: CreateProductDto, statusCode: ExpectedTestStatusCode = { code: 201, parseBody: true }) {
    const response = await this.agent
      .post(this.urlPrefix)
      .send(product ?? { title: 'playstation', description: 'a console that you can hack and jailbreak it.' })
      .expect(statusCode.code);
    return { response, body: parseResponseBody<ProductResponseDto>(response, statusCode.parseBody) };
  }

  async update(
    id: string,
    data: UpdateProductDto = { title: 'updated' },
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent.patch(`${this.urlPrefix}/${id}`).send(data).expect(statusCode.code);
    return { response, body: parseResponseBody<ProductResponseDto>(response, statusCode.parseBody) };
  }

  async findById(
    id: string,
    query: FindByIdQuery = { include: [] },
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent.get(`${this.urlPrefix}/${id}`).query(query).expect(statusCode.code);
    return { response, body: parseResponseBody<ProductDetailsResponseDto>(response, statusCode.parseBody) };
  }

  async findAll(
    query: FindAllProductsQueryDto = {},
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent.get(this.urlPrefix).query(query).expect(statusCode.code);
    return { response, body: parseResponseBody<FindAllProductsResponseDto>(response, statusCode.parseBody) };
  }

  async attachImages(
    id: string,
    data: AttachImagesDto = { imageIds: [] },
    statusCode: ExpectedTestStatusCode = { code: 201, parseBody: true },
  ) {
    const response = await this.agent.post(`${this.urlPrefix}/${id}/images`).send(data).expect(statusCode.code);
    return { response, body: parseResponseBody<ImageResponseDto[]>(response, statusCode.parseBody) };
  }

  async detachImages(
    id: string,
    data: DetachImagesDto = { imageIds: [] },
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent.post(`${this.urlPrefix}/${id}/images/detach`).send(data).expect(statusCode.code);
    return { response, body: parseResponseBody<AffectedResponseDto>(response, statusCode.parseBody) };
  }

  async attachCategories(
    id: string,
    data: AttachCategoriesDto = { categoryIds: [] },
    statusCode: ExpectedTestStatusCode = { code: 201, parseBody: true },
  ) {
    const response = await this.agent.post(`${this.urlPrefix}/${id}/categories`).send(data).expect(statusCode.code);
    return { response, body: parseResponseBody<ProductCategoriesResponseDto>(response, statusCode.parseBody) };
  }

  async detachCategories(
    id: string,
    data: DetachCategoriesDto = { categoryIds: [] },
    statusCode: ExpectedTestStatusCode = { code: 200, parseBody: true },
  ) {
    const response = await this.agent
      .post(`${this.urlPrefix}/${id}/categories/detach`)
      .send(data)
      .expect(statusCode.code);
    return { response, body: parseResponseBody<AffectedResponseDto>(response, statusCode.parseBody) };
  }
}
