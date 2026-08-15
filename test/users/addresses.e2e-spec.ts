import { it } from 'test/support/fixtures/authenticated-e2e.fixture';
import { AddressTestDto } from 'test/support/types/user/address.dto.type';
import { createRandomAddress } from 'test/support/utils/create-random-address.util';
import { pickFrom } from 'test/support/utils/pick-from.util';

describe.concurrent('addresses (e2e)', () => {
  const apiPrefix = '/api/v1/users/me/addresses';
  describe(`POST ${apiPrefix} (create)`, () => {
    it('should successfully create new address for user.', async ({
      myAddressController,
    }) => {
      const adrs = createRandomAddress();
      const response = await myAddressController.create(adrs, {
        code: 201,
        parseBody: true,
      });
      expect(pickFrom(adrs, response.body!)).toEqual(adrs);
    });
  });
  describe(`GET ${apiPrefix} (findAll)`, () => {
    it('should successfully return all addresses for the requester user.', async ({
      myAddressController,
    }) => {
      const addresses: AddressTestDto[] = [];

      for (let i = 1; i <= 5; i++) {
        const response = await myAddressController.create(
          createRandomAddress(),
          {
            code: 201,
            parseBody: true,
          },
        );

        addresses.push(response.body!);
      }

      const fetchedAddresses = (
        await myAddressController.findAll({
          code: 200,
          parseBody: true,
        })
      ).body!;

      const sortById = (a: AddressTestDto, b: AddressTestDto) =>
        a.id.localeCompare(b.id);

      expect(fetchedAddresses).toHaveLength(addresses.length);
      expect(fetchedAddresses).toHaveLength(5);

      expect([...fetchedAddresses].sort(sortById)).toEqual(
        [...addresses].sort(sortById),
      );
    });
  });
});
