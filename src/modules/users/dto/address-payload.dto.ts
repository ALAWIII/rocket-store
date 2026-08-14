import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class AddressPayloadDto {
  @IsString()
  @Length(2, 100)
  fullName!: string;
  @IsString()
  @Matches(/^\+[1-9]\d{3,15}$/, {
    message: 'phone must be a valid E.164 phone number',
  })
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
