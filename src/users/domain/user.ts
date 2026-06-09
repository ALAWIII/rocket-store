type UserData = {
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
class User {
  constructor(private userdata: UserData) {}
  setEmail(email: string) {
    this.userdata.email = email;
  }
  setPassword(password: string) {
    this.userdata.passwordHash = password;
  }
  setPhone(phone: string) {
    this.userdata.phone = phone;
  }
  setUpdatedAt(d: Date) {
    this.userdata.updatedAt = d;
  }
  setRoleId(r: string) {
    this.userdata.roleId = r;
  }
}
