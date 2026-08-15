import { AddressResponseDto } from 'src/modules/users/dto/address-response.dto';
import { UserAgent } from 'test/support/helpers/app-test.helper';
import { ExpectedTestStatusCode } from 'test/support/types/expected-test-status-code.type';
import { AddressTestDto } from 'test/support/types/user/address.dto.type';
import {
  parseResponseBody,
  statusCodesListNormalize,
} from 'test/support/utils/parse-response-body.util';

type AddressPayloadDto = {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
};

export class MyAddressesControllerTest {
  private urlPrefix = '/api/v1/users/me/addresses';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): MyAddressesControllerTest {
    return new MyAddressesControllerTest(agent);
  }
  async findAll(statusCode: ExpectedTestStatusCode) {
    const response = await this.agent
      .get(this.urlPrefix)
      .expect(statusCode.code);
    const body = parseResponseBody<AddressTestDto[]>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  async findById(addressId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent
      .get(`${this.urlPrefix}/${addressId}`)
      .expect(statusCode.code);
    const body = parseResponseBody<AddressTestDto>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  async create(payload: AddressPayloadDto, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent
      .post(this.urlPrefix)
      .send(payload)
      .expect(statusCode.code);
    const body = parseResponseBody<AddressTestDto>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  async update(
    addressId: string,
    payload: AddressPayloadDto,
    statusCode: ExpectedTestStatusCode,
  ) {
    const response = await this.agent
      .put(`${this.urlPrefix}/${addressId}`)
      .send(payload)
      .expect(statusCode.code);
    const body = parseResponseBody<AddressTestDto>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  async delete(addressId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent
      .delete(`${this.urlPrefix}/${addressId}`)
      .expect(statusCode.code);
    const body = parseResponseBody<{ affected: number }>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
}

export class UserAddressesControllerTest {
  private urlPrefix = '/api/v1/users';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): UserAddressesControllerTest {
    return new UserAddressesControllerTest(agent);
  }
  async findById(
    userId: string,
    addressId: string,
    statusCode: ExpectedTestStatusCode,
  ) {
    const response = await this.agent
      .get(`${this.urlPrefix}/${userId}/addresses/${addressId}`)
      .expect(statusCode.code);
    const body = parseResponseBody<AddressResponseDto>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
  async findAllForUser(userId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent
      .get(`${this.urlPrefix}/${userId}/addresses`)
      .expect(statusCode.code);
    const body = parseResponseBody<AddressResponseDto[]>(
      response,
      statusCodesListNormalize(statusCode),
    );
    return { response, body };
  }
}
