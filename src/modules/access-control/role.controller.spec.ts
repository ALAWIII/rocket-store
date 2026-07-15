import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './role.controller';
import { AccessControlService } from './access-control.service';
import { AccessGuard } from './guards/access-control.guard';
import { AllPermissions } from './domain/permission';
import { Role } from './domain/role';
import { AppSession } from 'src/auth/auth.config';
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: () => () => undefined,
}));
describe('RolesController', () => {
  let controller: RolesController;

  const serviceMock = {
    reloadPolicies: jest.fn(),
    upsertRole: jest.fn(),
    updateRole: jest.fn(),
    removeRole: jest.fn(),
    findAll: jest.fn(),
  };
  const accessGuard = { canActivate: jest.fn().mockReturnValue(true) };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: AccessControlService, useValue: serviceMock }],
      controllers: [RolesController],
    })
      .overrideGuard(AccessGuard)
      .useValue(accessGuard)
      .compile();

    controller = module.get<RolesController>(RolesController);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('create', () => {
    it('should successfully create and return Role', async () => {
      const expectedRole = Role.create({
        name: 'name',
        permissions: [AllPermissions.role.RoleReloadOwn],
      }).unwrap();
      const roleJson = expectedRole.toJSON();
      serviceMock.upsertRole.mockReturnValue(expectedRole);
      const roleDto = {
        name: roleJson.name,
        permissions: roleJson.permissions,
      };
      const newRole = await controller.create(
        {
          user: { roleId: 'user' },
        } as AppSession,
        roleDto,
      );
      expect(serviceMock.upsertRole).toHaveBeenCalledWith('user', roleDto);
      expect(newRole).toBe(expectedRole);
    });
  });
  describe('remove', () => {
    it('should successfully remove and return number of affected', async () => {
      const expectedRole = Role.create({
        name: 'name',
        permissions: [AllPermissions.role.RoleReloadOwn],
      }).unwrap();
      serviceMock.removeRole.mockReturnValue(1);
      const removeResult = await controller.remove(expectedRole.id);
      expect(serviceMock.removeRole).toHaveBeenCalledWith(expectedRole.id);
      expect(removeResult).toBe(1);
    });
  });
});
