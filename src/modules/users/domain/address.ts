import { AddressId, OrderId, UserId } from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';
import { Phone } from 'src/modules/shared/value-objects/phone';

type AddressProps = {
  readonly id: AddressId;
  readonly userId: UserId;
  fullName: Name;
  phone: Phone;
  country: Name;
  city: Name;
  state: Name;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

type CreateAddressProps = Omit<
  AddressProps,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;
type SharedProps = Omit<CreateAddressProps, 'userId'>;

type UpdateAddressProps = Partial<SharedProps>;

export const AddressType = {
  Billing: 'billing',
  Shipping: 'shipping',
} as const;

export type AddressType = (typeof AddressType)[keyof typeof AddressType];

type OrderAddressProps = {
  readonly id: AddressId;
  readonly orderId: OrderId;
  addressType: AddressType;
  createdAt: Date;
} & SharedProps;

type CreateOrderAddressProps = Omit<OrderAddressProps, 'id' | 'createdAt'>;

abstract class AddressBase<T extends SharedProps> {
  protected constructor(protected props: T) {}

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

  toJSON(): T {
    return { ...this.props };
  }
}

export class Address extends AddressBase<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
  }

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
    Object.assign(this.props, removeUndefined(data));
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
  }

  get id(): AddressId {
    return this.props.id;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }
}

export class OrderAddress extends AddressBase<OrderAddressProps> {
  private constructor(props: OrderAddressProps) {
    super(props);
  }

  static create(data: CreateOrderAddressProps): OrderAddress {
    return new OrderAddress({
      id: AddressId.create(),
      ...data,
      createdAt: new Date(),
    });
  }

  static restore(data: OrderAddressProps): OrderAddress {
    return new OrderAddress(data);
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

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
