import { IsOptional, IsString, Length } from 'class-validator';

export class AddressPayloadDto {
  @IsString()
  @Length(2, 100)
  fullName!: string;
  @IsString()
  @Length(2, 20)
  phone!: string;
  @IsString()
  @Length(2, 50)
  country!: string;
  @IsString()
  @Length(2, 50)
  city!: string;
  @IsString()
  @Length(2, 50)
  state!: string;
  @IsString()
  @Length(2, 50)
  postalCode!: string;
  @IsString()
  @Length(2, 50)
  addressLine1!: string;
  @IsOptional()
  @IsString()
  @Length(2, 50)
  addressLine2?: string;
}
