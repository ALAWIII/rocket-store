import { Email } from 'src/shared/value-objects/email';
import { Name } from 'src/shared/value-objects/name';
import { Phone } from 'src/shared/value-objects/phone';
import { v7 } from 'uuid';

type CreateUserProps = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string;
};

type UserProps = {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;
  email: Email;
  passwordHash: string;
  firstName: Name;
  lastName: Name;
  roleId: string;
  phone?: Phone;
};
type UpdateUserProps = {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  phone?: string;
};
class User {
  private constructor(private data: UserProps) {}
  static create(props: CreateUserProps): User {
    const now = new Date();
    const email = Email.create(props.email);
    const fName = Name.create(props.firstName);
    const lName = Name.create(props.lastName);
    const phone =
      props.phone === undefined ? undefined : Phone.create(props.phone);
    return new User({
      id: v7(),
      passwordHash: props.passwordHash,
      roleId: props.roleId,
      email: email,
      lastName: lName,
      firstName: fName,
      phone: phone,
      createdAt: now,
      updatedAt: now,
    });
  }
  static restore(props: UserProps) {
    return new User(props);
  }
  update(props: UpdateUserProps) {
    if (props.email !== undefined) this.changeEmail(props.email);
    if (props.passwordHash !== undefined)
      this.changePasswordHash(props.passwordHash);
    if (props.firstName !== undefined) this.changeFirstName(props.firstName);
    if (props.lastName !== undefined) this.changeLastName(props.lastName);
    if (props.roleId !== undefined) this.changeRole(props.roleId);
    if (props.phone !== undefined) this.changePhone(props.phone);
    this.touch();
  }
  private changeEmail(email: string) {
    this.data.email = Email.create(email);
  }
  private changeFirstName(fname: string) {
    this.data.firstName = Name.create(fname);
  }
  private changeLastName(lastName: string) {
    this.data.lastName = Name.create(lastName);
  }
  private changePasswordHash(passwordHash: string) {
    this.data.passwordHash = passwordHash;
  }

  private changePhone(phone: string) {
    this.data.phone = Phone.create(phone);
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
