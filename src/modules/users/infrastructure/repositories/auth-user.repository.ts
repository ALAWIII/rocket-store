type AuthUserData = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export abstract class IAuthUserRepository {
  abstract updateName(data: { uid: string; name: string }): Promise<boolean>;
  abstract findById(id: string): Promise<AuthUserData | null>;
}
