import { IsIn, IsOptional } from 'class-validator';

export class FindRolesQueryDto {
  @IsOptional()
  @IsIn(['assignable', 'creatable'])
  scope?: 'assignable' | 'creatable';
}
