import { Length } from 'class-validator';

export class UpdateRoleDto {
  @Length(2, 50)
  name!: string;
}
