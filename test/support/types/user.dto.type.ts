export type UserTestDto = {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  emailVerified?: boolean;
  image?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  givenName?: null | string; //the givenName, familyName and roleId fields appears when firing a request second time to signup endpoint.
  familyName?: null | string;
};
