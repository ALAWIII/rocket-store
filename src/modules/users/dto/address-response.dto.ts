export class AddressResponseDto {
  id!: string;
  userId!: string;
  fullName!: string;
  phone!: string;
  country!: string;
  city!: string;
  state!: string;
  postalCode!: string;
  addressLine1!: string;
  addressLine2?: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
}
