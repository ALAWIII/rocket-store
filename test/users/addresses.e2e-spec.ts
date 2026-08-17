import { pickSharedFields } from 'src/modules/shared/utils/pick-shared-fields.util';
import { it } from 'test/support/fixtures/authenticated-e2e.fixture';
import { UserAuthFlowBuilder } from 'test/support/helpers/auth-user-flow.builder';
import { AddressTestDto } from 'test/support/types/user/address.dto.type';
import { createRandomAddress } from 'test/support/utils/create-random-address.util';

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
      expect(pickSharedFields(adrs, response.body!)).toEqual(adrs);
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
  describe(`GET ${apiPrefix}/:id (findById)`, () => {
    it('should successfully return address by its id for requester user.', async ({
      myAddressController,
    }) => {
      const adrs = await myAddressController.create(createRandomAddress(), {
        code: 201,
        parseBody: true,
      });
      const findAdrs = await myAddressController.findById(adrs.body!.id, {
        code: 200,
        parseBody: true,
      });
      expect(adrs.body).toEqual(findAdrs.body);
    });
    it('should fail return address id not owned by the requester user.', async ({
      app,
      db,
      mailClient,
      myAddressController,
    }) => {
      const customer = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .signin()
        .verified()
        .build();
      const customerAdrs = await myAddressController
        .withAgent(customer.userAgent)
        .create(createRandomAddress(), { code: 201, parseBody: true });
      await myAddressController.findById(customerAdrs.body!.id, { code: 404 });
    });
  });
  describe(`PUT ${apiPrefix}/:id (update)`, () => {
    it('should successfully update user address.', async ({
      myAddressController,
    }) => {
      const adrs = await myAddressController.create(createRandomAddress(), {
        code: 201,
        parseBody: true,
      });
      const adrsPayload = createRandomAddress();
      const updatedAdrs = await myAddressController.update(
        adrs.body!.id,
        adrsPayload,
        {
          code: 200,
          parseBody: true,
        },
      );
      expect(pickSharedFields(adrsPayload, updatedAdrs.body!)).toEqual(
        adrsPayload,
      );
      expect(updatedAdrs.body).not.toEqual(adrs.body);
    });
  });
  describe(`DELETE ${apiPrefix} (delete)`, () => {
    it('should success delete user requester address.', async ({
      myAddressController,
    }) => {
      const adrs = await myAddressController.create(createRandomAddress(), {
        code: 201,
        parseBody: true,
      });
      const deletedAdrs = await myAddressController.delete(adrs.body!.id, {
        code: 200,
        parseBody: true,
      });
      expect(deletedAdrs.body).toEqual({ affected: 1 });
      await myAddressController.findById(adrs.body!.id, {
        code: 404,
      });
    });
  });
});
describe.concurrent('adminstrative addresses (e2e)', () => {
  const apiPrefix = '/api/v1/users';
  describe(`GET ${apiPrefix}/:userId/addresses/:id (findById)`, () => {
    it('should success return address by authorized requester user.', async ({
      app,
      db,
      mailClient,
      userAddressController,
      myAddressController,
    }) => {
      const customer = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .verified()
        .signin()
        .build();
      const customerAdrs = await myAddressController
        .withAgent(customer.userAgent)
        .create(createRandomAddress(), {
          code: 201,
          parseBody: true,
        });
      const fetchedAdrs = await userAddressController.findById(
        customer.userDb.id,
        customerAdrs.body!.id,
        { code: 200, parseBody: true },
      );
      expect(fetchedAdrs.body).toEqual(customerAdrs.body);
    });
    it('should fail find address by unauthorized requester user.', async ({
      app,
      db,
      mailClient,
      userAddressController,
      myAddressController,
    }) => {
      const customer = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .verified()
        .signin()
        .build();
      const customerAdrs = await myAddressController
        .withAgent(customer.userAgent)
        .create(createRandomAddress(), {
          code: 201,
          parseBody: true,
        });
      //===================== create another user who doesnt has AddressReadLessOrEqual permission
      const customer2 = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .verified()
        .signin()
        .build();
      await userAddressController
        .withAgent(customer2.userAgent)
        .findById(customer.userDb.id, customerAdrs.body!.id, { code: 403 });
    });
  });
  describe(`GET ${apiPrefix}/:userId/addresses/ (findAllForUser)`, () => {
    it('should success findAll addresses by authorized requester user for specific user.', async ({
      app,
      db,
      mailClient,
      userAddressController,
      myAddressController,
    }) => {
      const customer = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .verified()
        .signin()
        .build();
      const customerAdrs = await myAddressController
        .withAgent(customer.userAgent)
        .create(createRandomAddress(), {
          code: 201,
          parseBody: true,
        });
      //============================
      const fetchedAdrss = await userAddressController.findAllForUser(
        customer.userDb.id,
        { code: 200, parseBody: true },
      );
      expect(fetchedAdrss.body).toEqual([customerAdrs.body]);
    });
    it('should fail find all addresses by unauthorized requester user for user.', async ({
      app,
      db,
      mailClient,
      userAddressController,
      myAddressController,
    }) => {
      const customer = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .verified()
        .signin()
        .build();
      const customerAdrs = await myAddressController
        .withAgent(customer.userAgent)
        .create(createRandomAddress(), {
          code: 201,
          parseBody: true,
        });
      //===================== create another user who doesnt has AddressReadLessOrEqual permission
      const customer2 = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .verified()
        .signin()
        .build();
      await userAddressController
        .withAgent(customer2.userAgent)
        .findAllForUser(customer.userDb.id, { code: 403 });
    });
  });
});
