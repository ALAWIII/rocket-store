import { it } from 'test/support/fixtures/authenticated-e2e.fixture';
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
});
