import { Module } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { RoleRepository } from './infrastructure/repositories/typeorm-role.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './infrastructure/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity])],
  providers: [{ provide: IRoleRepository, useClass: RoleRepository }],
})
export class AccessControlModule {}
