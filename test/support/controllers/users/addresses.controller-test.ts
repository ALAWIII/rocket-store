import { AffectedDeletedResponseDto } from 'src/modules/shared/dto/affected-deleted-response.dto';
import { AddressResponseDto } from 'src/modules/users/dto/address-response.dto';
import { CreateAddressDto } from 'src/modules/users/dto/create-address.dto';
import { UpdateAddressDto } from 'src/modules/users/dto/update-address.dto';
import { UserAgent } from 'test/support/helpers/app-test.helper';
import { ExpectedTestStatusCode } from 'test/support/types/expected-test-status-code.type';
import { parseResponseBody } from 'test/support/utils/parse-response-body.util';

export class MyAddressesControllerTest {
  private urlPrefix = '/api/v1/users/me/addresses';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): MyAddressesControllerTest {
    return new MyAddressesControllerTest(agent);
  }
  async findAll(statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.get(this.urlPrefix).expect(statusCode.code);
    const body = parseResponseBody<AddressResponseDto[]>(response, statusCode.parseBody);
    return { response, body };
  }
  async findById(addressId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.get(`${this.urlPrefix}/${addressId}`).expect(statusCode.code);
    const body = parseResponseBody<AddressResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async create(payload: CreateAddressDto, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.post(this.urlPrefix).send(payload).expect(statusCode.code);
    const body = parseResponseBody<AddressResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async update(addressId: string, payload: UpdateAddressDto, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.put(`${this.urlPrefix}/${addressId}`).send(payload).expect(statusCode.code);
    const body = parseResponseBody<AddressResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async delete(addressId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.delete(`${this.urlPrefix}/${addressId}`).expect(statusCode.code);
    const body = parseResponseBody<AffectedDeletedResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
}

export class UserAddressesControllerTest {
  private urlPrefix = '/api/v1/users';
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): UserAddressesControllerTest {
    return new UserAddressesControllerTest(agent);
  }
  async findById(userId: string, addressId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.get(`${this.urlPrefix}/${userId}/addresses/${addressId}`).expect(statusCode.code);
    const body = parseResponseBody<AddressResponseDto>(response, statusCode.parseBody);
    return { response, body };
  }
  async findAllForUser(userId: string, statusCode: ExpectedTestStatusCode) {
    const response = await this.agent.get(`${this.urlPrefix}/${userId}/addresses`).expect(statusCode.code);
    const body = parseResponseBody<AddressResponseDto[]>(response, statusCode.parseBody);
    return { response, body };
  }
}
