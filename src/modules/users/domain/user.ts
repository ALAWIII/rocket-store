import { UserId } from 'src/modules/shared/domain/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Email } from 'src/modules/shared/value-objects/email';
import { Name } from 'src/modules/shared/value-objects/name';
import { Phone } from 'src/modules/shared/value-objects/phone';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Err, Ok, Result } from 'ts-results-es';

type UserProps = {
  readonly id: UserId;
  email: Email;
  name: Name;
  givenName?: Name | null;
  familyName?: Name | null;
  roleId: string;
  image?: string;
  phone?: Phone;
  updatedAt: Date;
  readonly createdAt: Date;
};
type UserPrimitives = {
  id: string;
  email: string;
  name: string;
  givenName?: string | null;
  familyName?: string | null;
  roleId: string;
  image?: string;
  phone?: string;
  updatedAt: Date;
  createdAt: Date;
};

export class User {
  private constructor(private data: UserProps) {}
  static restore(props: UserProps) {
    return new User(props);
  }
  static fromPrimitives(data: UserPrimitives): Result<User, ValueObjectError> {
    const optional = <T, R>(
      value: T | null | undefined,
      create: (value: T) => R,
    ) => (value == null ? Ok(undefined) : create(value));
    const dataValidated = unwrapResultObject({
      email: Email.create(data.email),
      name: Name.create(data.name),
      givenName: optional(data.givenName, (value) => Name.create(value)),
      familyName: optional(data.familyName, (value) => Name.create(value)),
      phone: optional(data.phone, (value) => Phone.create(value)),
    });
    if (dataValidated.isErr()) return Err(dataValidated.error);

    return Ok(
      new User({
        id: UserId.create(data.id),
        ...dataValidated.value,
        image: data.image,
        roleId: data.roleId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }),
    );
  }

  toJSON(): UserPrimitives {
    return {
      id: this.data.id.toString(),
      name: this.data.name.value,
      email: this.data.email.value,
      givenName: this.data.givenName?.value,
      familyName: this.data.familyName?.value,
      roleId: this.data.roleId,
      image: this.data.image,
      phone: this.data.phone?.value,
      updatedAt: this.data.updatedAt,
      createdAt: this.data.createdAt,
    };
  }
}
