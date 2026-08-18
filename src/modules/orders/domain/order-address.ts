import { AddressId, OrderId } from 'src/modules/shared/value-objects/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Name } from 'src/modules/shared/value-objects/name';
import { Phone } from 'src/modules/shared/value-objects/phone';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Err, Ok, Result } from 'ts-results-es';

export const AddressType = {
  Billing: 'billing',
  Shipping: 'shipping',
} as const;
export type AddressType = (typeof AddressType)[keyof typeof AddressType];

type OrderAddressProps = {
  readonly id: AddressId;
  readonly orderId: OrderId;
  addressType: AddressType;
  fullName: Name;
  phone: Phone;
  country: Name;
  city: Name;
  state: Name;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  createdAt: Date;
};

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
type CreateOrderAddressProps = Omit<OrderAddressPrimitives, 'id' | 'createdAt'>;
export class OrderAddress {
  private constructor(private props: OrderAddressProps) {}

  static create(
    data: CreateOrderAddressProps,
  ): Result<OrderAddress, ValueObjectError> {
    const newAdrs = {
      id: AddressId.create().toString(),
      createdAt: new Date(),
      ...data,
    };
    return OrderAddress.fromPrimitives(newAdrs);
  }

  static fromPrimitives(
    data: OrderAddressPrimitives,
  ): Result<OrderAddress, ValueObjectError> {
    const dataValidate = unwrapResultObject({
      id: AddressId.create(data.id),
      orderId: OrderId.create(data.orderId),
      fullName: Name.create(data.fullName),
      phone: Phone.create(data.phone),
      country: Name.create(data.country),
      city: Name.create(data.city),
      state: Name.create(data.state),
    });
    if (dataValidate.isErr()) return Err(dataValidate.error);
    return Ok(
      new OrderAddress({
        addressType: data.addressType,
        postalCode: data.postalCode,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        createdAt: data.createdAt,
        ...dataValidate.value,
      }),
    );
  }

  toJSON(): OrderAddressPrimitives {
    return {
      id: this.props.id.toString(),
      orderId: this.props.orderId.toString(),
      addressType: this.props.addressType,
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
}
