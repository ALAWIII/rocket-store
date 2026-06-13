type UserProps = {
  readonly id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roleId: string;
  readonly createdAt: Date;
  updatedAt: Date;
  phone?: string;
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
  constructor(private data: UserProps) {}
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
    this.data.email = email;
  }
  private changeFirstName(fname: string) {
    this.data.firstName = fname;
  }
  private changeLastName(lastName: string) {
    this.data.lastName = lastName;
  }
  private changePasswordHash(passwordHash: string) {
    this.data.passwordHash = passwordHash;
  }

  private changePhone(phone?: string) {
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
