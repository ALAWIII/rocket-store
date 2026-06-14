import { AddressId, OrderId, UserId } from 'src/shared/domain/ids';
import { Name, Phone } from './user';
type SharedProps = {
  fullName: Name;
  phone: Phone;
  country: Name;
  city: Name;
  state: Name;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
};
type CreateAddressProps = {
  readonly userId: UserId;
} & SharedProps;
type AddressProps = {
  readonly id: AddressId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
} & SharedProps;
type UpdateAddressProps = {
  fullName?: Name;
  phone?: Phone;
  country?: Name;
  city?: Name;
  state?: Name;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
};
export class Address {
  private constructor(private props: AddressProps) {}
  static create(data: CreateAddressProps) {
    const now = new Date();
    return new Address({
      id: AddressId.create(),
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }
  static restore(data: AddressProps) {
    return new Address(data);
  }
  update(data: UpdateAddressProps) {
    if (data.fullName !== undefined) this.props.fullName = data.fullName;
    if (data.phone !== undefined) this.props.phone = data.phone;
    if (data.country !== undefined) this.props.country = data.country;
    if (data.city !== undefined) this.props.city = data.city;
    if (data.state !== undefined) this.props.state = data.state;
    if (data.postalCode !== undefined) this.props.postalCode = data.postalCode;
    if (data.addressLine1 !== undefined)
      this.props.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined)
      this.props.addressLine2 = data.addressLine2;

    this.props.updatedAt = new Date();
  }
  delete() {
    this.props.deletedAt = new Date();
  }
  get id(): AddressId {
    return this.props.id;
  }

  get fullName(): Name {
    return this.props.fullName;
  }

  get phone(): Phone {
    return this.props.phone;
  }

  get country(): Name {
    return this.props.country;
  }

  get city(): Name {
    return this.props.city;
  }

  get state(): Name {
    return this.props.state;
  }

  get postalCode(): string {
    return this.props.postalCode;
  }

  get addressLine1(): string {
    return this.props.addressLine1;
  }

  get addressLine2(): string | undefined {
    return this.props.addressLine2;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  toJSON(): AddressProps {
    return { ...this.props };
  }
}

const AddressType = {
  Billing: 'billing',
  Shipping: 'shipping',
} as const;
type AddressType = (typeof AddressType)[keyof typeof AddressType];

type OrderAddressProps = {
  readonly id: AddressId;
  orderId: OrderId;
  addressType: AddressType;
  createdAt: Date;
} & SharedProps;
type CreateOrderAddressProps = {
  orderId: OrderId;
  addressType: AddressType;
} & SharedProps;

export class OrderAddress {
  private constructor(private props: OrderAddressProps) {}

  static create(data: CreateOrderAddressProps): OrderAddress {
    return new OrderAddress({
      id: AddressId.create(),
      ...data,
      createdAt: new Date(),
    });
  }
  get id(): AddressId {
    return this.props.id;
  }

  get orderId(): OrderId {
    return this.props.orderId;
  }

  get addressType(): AddressType {
    return this.props.addressType;
  }

  get fullName(): Name {
    return this.props.fullName;
  }

  get phone(): Phone {
    return this.props.phone;
  }

  get country(): Name {
    return this.props.country;
  }

  get city(): Name {
    return this.props.city;
  }

  get state(): Name {
    return this.props.state;
  }

  get postalCode(): string {
    return this.props.postalCode;
  }

  get addressLine1(): string {
    return this.props.addressLine1;
  }

  get addressLine2(): string | undefined {
    return this.props.addressLine2;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): OrderAddressProps {
    return { ...this.props };
  }
}
