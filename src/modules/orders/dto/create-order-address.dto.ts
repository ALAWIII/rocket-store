import { IsIn, IsUUID } from 'class-validator';

export class CreateOrderAddressDto {
  @IsUUID('7')
  addressId!: string;
  @IsIn(['billing', 'shipping'])
  addressType!: 'billing' | 'shipping';
}
