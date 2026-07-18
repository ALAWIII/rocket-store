import { UserId } from 'src/modules/shared/domain/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Email } from 'src/modules/shared/value-objects/email';
import { Name } from 'src/modules/shared/value-objects/name';
import { Phone } from 'src/modules/shared/value-objects/phone';
import { InvalidValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Err, Ok, Result } from 'ts-results-es';

type UserProps = {
  readonly id: UserId;
  email: Email;
  name: Name;
  givenName: Name;
  familyName: Name;
  roleId: string;
  phone?: Phone;
  updatedAt: Date;
  readonly createdAt: Date;
};
type UserPrimitives = {
  id: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  roleId: string;
  phone?: string;
  updatedAt: Date;
  createdAt: Date;
};

type UpdateUserProps = Partial<
  Pick<UserProps, 'name' | 'givenName' | 'familyName' | 'roleId' | 'phone'>
>;
export class User {
  private constructor(private data: UserProps) {}
  static restore(props: UserProps) {
    return new User(props);
  }
  static fromPrimitives(
    data: UserPrimitives,
  ): Result<User, InvalidValueObjectError> {
    const dataValidate = unwrapResultObject({
      email: Email.create(data.email),
      name: Name.create(data.name),
      givenName: Name.create(data.givenName),
      familyName: Name.create(data.familyName),
      phone:
        data.phone !== undefined ? Phone.create(data.phone) : Ok(undefined),
    });
    if (dataValidate.isErr()) return Err(dataValidate.error);

    return Ok(
      new User({
        id: UserId.create(data.id),
        ...dataValidate.value,
        roleId: data.roleId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }),
    );
  }
  update(props: UpdateUserProps) {
    if (props.givenName !== undefined) this.changeFirstName(props.givenName);
    if (props.familyName !== undefined) this.changeLastName(props.familyName);
    if (props.roleId !== undefined) this.changeRole(props.roleId);
    if (props.phone !== undefined) this.changePhone(props.phone);
    this.touch();
  }

  private changeFirstName(fname: Name) {
    this.data.givenName = fname;
  }
  private changeLastName(lastName: Name) {
    this.data.familyName = lastName;
  }

  private changePhone(phone: Phone) {
    this.data.phone = phone;
  }

  private changeRole(roleId: string) {
    this.data.roleId = roleId;
  }

  private touch() {
    this.data.updatedAt = new Date();
  }
  toJSON(): UserPrimitives {
    return {
      id: this.data.id.toString(),
      name: this.data.name.value,
      email: this.data.email.value,
      givenName: this.data.givenName.value,
      familyName: this.data.familyName.value,
      roleId: this.data.roleId,
      phone: this.data.phone?.value,
      updatedAt: this.data.updatedAt,
      createdAt: this.data.createdAt,
    };
  }
}
