import { PaymentProviderId } from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';

type PaymentProviderProps = {
  id: PaymentProviderId;
  slug: string; // A unique, lowercase identifier for the provider — e.g. 'stripe', 'myfatoorah', 'paypal'.
  displayName: Name; // A human-readable name shown in admin UI / customer-facing selection — e.g. 'Stripe', 'MyFatoorah Payment Gateway'
  isActive: boolean; // A boolean toggle that enables/disables the provider without deleting the record.
  config: Record<string, unknown>; // Stores sensitive provider credentials as JSON (jsonb in Postgres)
  createdAt: Date;
  updatedAt: Date;
};
type CreatePaymentProviderProps = Partial<
  Pick<PaymentProviderProps, 'config' | 'isActive'>
> &
  Pick<PaymentProviderProps, 'slug' | 'displayName'>;
export class PaymentProvider {
  private constructor(private props: PaymentProviderProps) {}

  static create(data: CreatePaymentProviderProps): PaymentProvider {
    const now = new Date();

    const slug = this.normalizeSlug(data.slug);
    const config = data.config ?? {};

    this.validateSlug(slug);

    this.validateConfig(config);

    return new PaymentProvider({
      id: PaymentProviderId.create(),
      slug,
      displayName: data.displayName,
      isActive: data.isActive ?? true,
      config,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(data: PaymentProviderProps): PaymentProvider {
    this.validateSlug(data.slug);
    this.validateConfig(data.config);

    return new PaymentProvider(data);
  }

  activate() {
    if (this.props.isActive) return;
    this.props.isActive = true;
    this.touch();
  }

  deactivate() {
    if (!this.props.isActive) return;
    this.props.isActive = false;
    this.touch();
  }

  rename(displayName: Name) {
    this.props.displayName = displayName;
    this.touch();
  }

  changeSlug(slug: string) {
    const normalized = PaymentProvider.normalizeSlug(slug);
    PaymentProvider.validateSlug(normalized);

    this.props.slug = normalized;
    this.touch();
  }

  replaceConfig(config: Record<string, unknown>) {
    PaymentProvider.validateConfig(config);

    this.props.config = { ...config };
    this.touch();
  }

  mergeConfig(partial: Record<string, unknown>) {
    PaymentProvider.validateConfig(partial);

    this.props.config = {
      ...this.props.config,
      ...partial,
    };
    this.touch();
  }

  hasSlug(slug: string): boolean {
    return this.props.slug === PaymentProvider.normalizeSlug(slug);
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  private static normalizeSlug(value: string): string {
    return value.trim().toLowerCase();
  }

  private static validateSlug(value: string) {
    if (!value) throw new Error('slug is required');
    if (value.length < 2 || value.length > 50) {
      throw new Error('slug length must be between 2 and 50 characters');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      throw new Error(
        'slug must contain only lowercase letters, numbers, and hyphens',
      );
    }
  }

  private static validateConfig(value: Record<string, unknown>) {
    if (value == null || Array.isArray(value) || typeof value !== 'object') {
      throw new Error('config must be a plain object');
    }
  }
  toJSON(): PaymentProviderProps {
    return { ...this.props };
  }
}
