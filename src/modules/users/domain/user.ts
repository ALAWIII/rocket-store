import { UserId } from 'src/modules/shared/domain/ids';
import { Email } from 'src/modules/shared/value-objects/email';
import { Name } from 'src/modules/shared/value-objects/name';
import { Phone } from 'src/modules/shared/value-objects/phone';

type UserProps = {
  readonly id: UserId;
  readonly authId: UserId;
  email: Email;
  firstName: Name;
  lastName: Name;
  roleId: string;
  phone?: Phone;
  updatedAt: Date;
  readonly createdAt: Date;
};
type UserPrimitives = {
  id: string;
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string;
  updatedAt: Date;
  createdAt: Date;
};

type UpdateUserProps = Partial<
  Pick<UserProps, 'firstName' | 'lastName' | 'roleId' | 'phone'>
>;
export class User {
  private constructor(private data: UserProps) {}
  static restore(props: UserProps) {
    return new User(props);
  }
  static fromPrimitives(data: UserPrimitives) {
    return new User({
      id: UserId.create(data.id),
      authId: UserId.create(data.authId),
      email: Email.create(data.email),
      firstName: Name.create(data.firstName),
      lastName: Name.create(data.lastName),
      roleId: data.roleId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      phone: data.phone !== undefined ? Phone.create(data.phone) : undefined,
    });
  }
  update(props: UpdateUserProps) {
    if (props.firstName !== undefined) this.changeFirstName(props.firstName);
    if (props.lastName !== undefined) this.changeLastName(props.lastName);
    if (props.roleId !== undefined) this.changeRole(props.roleId);
    if (props.phone !== undefined) this.changePhone(props.phone);
    this.touch();
  }

  private changeFirstName(fname: Name) {
    this.data.firstName = fname;
  }
  private changeLastName(lastName: Name) {
    this.data.lastName = lastName;
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
      authId: this.data.authId.toString(),
      email: this.data.email.value,
      firstName: this.data.firstName.value,
      lastName: this.data.lastName.value,
      roleId: this.data.roleId,
      phone: this.data.phone?.value,
      updatedAt: this.data.updatedAt,
      createdAt: this.data.createdAt,
    };
  }
}
