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

type UpdateUserProps = Partial<
  Pick<UserProps, 'firstName' | 'lastName' | 'roleId' | 'phone'>
>;
export class User {
  private constructor(private data: UserProps) {}
  static restore(props: UserProps) {
    return new User(props);
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
  toJSON() {
    return { ...this.data };
  }
}
