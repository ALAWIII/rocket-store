import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './role.controller';
import { RoleService } from './role.service';
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
    findAssignableRoles: jest.fn(),
    findCreatedRoles: jest.fn(),
    reloadPolicies: jest.fn(),
    createRole: jest.fn(),
    renameRole: jest.fn(),
    removeRole: jest.fn(),
    findAll: jest.fn(),
  };
  const accessGuard = { canActivate: jest.fn().mockReturnValue(true) };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: RoleService, useValue: serviceMock }],
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
        permissions: [AllPermissions.role.RoleReloadAll],
      }).unwrap();
      const roleJson = expectedRole.toJSON();
      serviceMock.createRole.mockReturnValue(expectedRole);
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
      expect(serviceMock.createRole).toHaveBeenCalledWith('user', roleDto);
      expect(newRole).toBe(expectedRole);
    });
  });
  describe('remove', () => {
    it('should successfully remove and return number of affected', async () => {
      const expectedRole = Role.create({
        name: 'name',
        permissions: [AllPermissions.role.RoleReloadAll],
      }).unwrap();
      serviceMock.removeRole.mockReturnValue(1);
      const removeResult = await controller.remove(expectedRole.id, {
        user: { roleId: 'user' },
      } as AppSession);
      expect(serviceMock.removeRole).toHaveBeenCalledWith(
        'user',
        expectedRole.id,
      );
      expect(removeResult).toBe(1);
    });
  });
});
