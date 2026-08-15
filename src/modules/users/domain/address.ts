import { AddressId, OrderId, UserId } from 'src/modules/shared/domain/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Name } from 'src/modules/shared/value-objects/name';
import { Phone } from 'src/modules/shared/value-objects/phone';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
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
type CreateAddressProps = Omit<
  AddressPrimitives,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;
export class Address {
  private constructor(private props: AddressProps) {}

  static create(data: CreateAddressProps) {
    const now = new Date();
    const adrsData = {
      ...data,
      id: AddressId.create().toString(),
      createdAt: now,
      updatedAt: now,
    };
    const newAdrs = Address.fromPrimitives(adrsData);

    return newAdrs;
  }

  static fromPrimitives(
    data: AddressPrimitives,
  ): Result<Address, ValueObjectError> {
    const dataValidate = unwrapResultObject({
      fullName: Name.create(data.fullName, 100),
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

  toJSON(): AddressPrimitives {
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
