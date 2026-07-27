import { IsUUID } from 'class-validator';

export class AssignRoleToUserDto {
  @IsUUID('7')
  roleId!: string;
}
