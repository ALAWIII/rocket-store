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

export class Name {
  private constructor(private readonly _value: string) {}

  static create(value: string): Name {
    const v = value.trim();

    if (!v) throw new Error('Name is required');
    if (v.length < 2 || v.length > 50) {
      throw new Error('Name must be between 2 and 50 characters');
    }

    const regex = /^[a-zA-ZÀ-ÿ]+([ '-][a-zA-ZÀ-ÿ]+)*$/;
    if (!regex.test(v)) throw new Error('Invalid name');

    return new Name(v);
  }

  get value(): string {
    return this._value;
  }
}

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    const v = value.trim().toLowerCase();

    if (!v) throw new Error('Email is required');
    if (v.length > 254) throw new Error('Email is too long');

    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!regex.test(v)) throw new Error('Invalid email');

    return new Email(v);
  }

  get value(): string {
    return this._value;
  }
}

export class Phone {
  private constructor(private readonly _value: string) {}

  static create(value: string): Phone {
    const v = value.trim();

    const regex = /^\+[1-9]\d{3,14}$/;
    if (!regex.test(v)) throw new Error('Invalid phone number');

    return new Phone(v);
  }

  get value(): string {
    return this._value;
  }
}
