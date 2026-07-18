import { AddressId, OrderId, UserId } from 'src/modules/shared/domain/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Name } from 'src/modules/shared/value-objects/name';
import { Phone } from 'src/modules/shared/value-objects/phone';
import { InvalidValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Err, Ok, Result } from 'ts-results-es';

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
//===============================================
type AddressPrimitives = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};
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
  static fromPrimitives(
    data: AddressPrimitives,
  ): Result<Address, InvalidValueObjectError> {
    const dataValidate = unwrapResultObject({
      fullName: Name.create(data.fullName),
      phone: Phone.create(data.phone),
      country: Name.create(data.country),
      city: Name.create(data.city),
      state: Name.create(data.state),
    });
    if (dataValidate.isErr()) return Err(dataValidate.error);
    return Ok(
      new Address({
        id: AddressId.create(data.id),
        userId: UserId.create(data.userId),
        postalCode: data.postalCode,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
        ...dataValidate.value,
      }),
    );
  }

  toPrimitives(): AddressPrimitives {
    return {
      id: this.props.id.toString(),
      userId: this.props.userId.toString(),
      fullName: this.props.fullName.value,
      phone: this.props.phone.value,
      country: this.props.country.value,
      city: this.props.city.value,
      state: this.props.state.value,
      postalCode: this.props.postalCode,
      addressLine1: this.props.addressLine1,
      addressLine2: this.props.addressLine2,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
//======================================================================
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
export type OrderAddressPrimitives = {
  id: string;
  fullName: string;
  orderId: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  addressType: AddressType;
  addressLine1: string;
  addressLine2?: string;
  createdAt: Date;
};
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
  static fromPrimitives(
    data: OrderAddressPrimitives,
  ): Result<OrderAddress, InvalidValueObjectError> {
    const dataValidate = unwrapResultObject({
      fullName: Name.create(data.fullName),
      phone: Phone.create(data.phone),
      country: Name.create(data.country),
      city: Name.create(data.city),
      state: Name.create(data.state),
    });
    if (dataValidate.isErr()) return Err(dataValidate.error);
    return Ok(
      new OrderAddress({
        id: AddressId.create(data.id),
        orderId: OrderId.create(data.orderId),
        addressType: data.addressType,
        postalCode: data.postalCode,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        createdAt: data.createdAt,
        ...dataValidate.value,
      }),
    );
  }

  toPrimitives(): OrderAddressPrimitives {
    return {
      id: this.props.id.toString(),
      orderId: this.orderId.toString(),
      addressType: this.addressType,
      fullName: this.props.fullName.value,
      phone: this.props.phone.value,
      country: this.props.country.value,
      city: this.props.city.value,
      state: this.props.state.value,
      postalCode: this.props.postalCode,
      addressLine1: this.props.addressLine1,
      addressLine2: this.props.addressLine2,
      createdAt: this.props.createdAt,
    };
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
