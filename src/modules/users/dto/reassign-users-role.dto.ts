import { IsUUID } from 'class-validator';

export class ReassignUsersRoleDto {
  @IsUUID('7')
  oldRoleId!: string;
  @IsUUID('7')
  newRoleId!: string;
}
