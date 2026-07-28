export class OrderAddressResponseDto {
  id!: string;
  fullName!: string;
  orderId!: string;
  phone!: string;
  country!: string;
  city!: string;
  state!: string;
  postalCode!: string;
  addressType!: 'billing' | 'shipping';
  addressLine1!: string;
  addressLine2?: string;
  createdAt!: Date;
}
