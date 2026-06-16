import {
  OrderId,
  PaymentId,
  PaymentProviderId,
  PaymentTransactionId,
} from 'src/shared/domain/ids';
const PaymentMethod = {
  COD: 'COD',
  ELECTRONIC: 'ELECTRONIC',
} as const;
type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
type CreatePaymentProps = {
  orderId: OrderId;
  amountInMinorUnit: number;
  currency: string;
  method: PaymentMethod;
};
type PaymentProps = {
  id: PaymentId;
  status: PaymentStatus;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
} & CreatePaymentProps;

export class Payment {
  private constructor(private props: PaymentProps) {}
  static create(data: CreatePaymentProps): Payment {
    const now = new Date();
    return new Payment({
      id: PaymentId.create(),
      ...data,
      createdAt: now,
      updatedAt: now,
      status: PaymentStatus.PENDING,
    });
  }
  static restore(data: PaymentProps): Payment {
    return new Payment(data);
  }
  markAsPaid(at: Date = new Date()) {
    if (this.props.status === PaymentStatus.PAID) return;
    this.props.status = PaymentStatus.PAID;
    this.props.paidAt = at;
    this.touch();
  }

  markAsFailed() {
    if (this.props.status === PaymentStatus.PAID) {
      throw new Error('Paid payment cannot be marked failed');
    }
    this.props.status = PaymentStatus.FAILED;
    this.touch();
  }

  cancel() {
    if (this.props.status === PaymentStatus.PAID) {
      throw new Error('Paid payment cannot be cancelled');
    }
    this.props.status = PaymentStatus.CANCELLED;
    this.touch();
  }
  private touch() {
    this.props.updatedAt = new Date();
  }
  toJSON(): PaymentProps {
    return { ...this.props };
  }
}
type PaymentProviderProps = {
  id: PaymentProviderId;
  slug: string; // A unique, lowercase identifier for the provider — e.g. 'stripe', 'myfatoorah', 'paypal'.
  displayName: string; // A human-readable name shown in admin UI / customer-facing selection — e.g. 'Stripe', 'MyFatoorah Payment Gateway'
  isActive: boolean; // A boolean toggle that enables/disables the provider without deleting the record.
  config: Record<string, unknown>; // Stores sensitive provider credentials as JSON (jsonb in Postgres)
  handlerClass: string; // A string name of the handler class that implements IPaymentHandler for this provider.
  createdAt: Date;
  updatedAt: Date;
};
type CreatePaymentProviderProps = {
  slug: string;
  displayName: string;
  config?: Record<string, unknown>;
  handlerClass: string;
  isActive?: boolean;
};

export class PaymentProvider {
  private constructor(private props: PaymentProviderProps) {}

  static create(data: CreatePaymentProviderProps): PaymentProvider {
    const now = new Date();

    const slug = this.normalizeSlug(data.slug);
    const displayName = this.normalizeDisplayName(data.displayName);
    const handlerClass = this.normalizeHandlerClass(data.handlerClass);
    const config = data.config ?? {};

    this.validateSlug(slug);
    this.validateDisplayName(displayName);
    this.validateHandlerClass(handlerClass);
    this.validateConfig(config);

    return new PaymentProvider({
      id: PaymentProviderId.create(),
      slug,
      displayName,
      isActive: data.isActive ?? true,
      config,
      handlerClass,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(data: PaymentProviderProps): PaymentProvider {
    this.validateSlug(data.slug);
    this.validateDisplayName(data.displayName);
    this.validateHandlerClass(data.handlerClass);
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

  rename(displayName: string) {
    const normalized = PaymentProvider.normalizeDisplayName(displayName);
    PaymentProvider.validateDisplayName(normalized);

    this.props.displayName = normalized;
    this.touch();
  }

  changeSlug(slug: string) {
    const normalized = PaymentProvider.normalizeSlug(slug);
    PaymentProvider.validateSlug(normalized);

    this.props.slug = normalized;
    this.touch();
  }

  changeHandlerClass(handlerClass: string) {
    const normalized = PaymentProvider.normalizeHandlerClass(handlerClass);
    PaymentProvider.validateHandlerClass(normalized);

    this.props.handlerClass = normalized;
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

  usesHandler(handlerClass: string): boolean {
    return (
      this.props.handlerClass ===
      PaymentProvider.normalizeHandlerClass(handlerClass)
    );
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

  private static normalizeDisplayName(value: string): string {
    return value.trim();
  }

  private static normalizeHandlerClass(value: string): string {
    return value.trim();
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

  private static validateDisplayName(value: string) {
    if (!value) throw new Error('displayName is required');
    if (value.length < 2 || value.length > 100) {
      throw new Error(
        'displayName length must be between 2 and 100 characters',
      );
    }
  }

  private static validateHandlerClass(value: string) {
    if (!value) throw new Error('handlerClass is required');
    if (value.length < 2 || value.length > 120) {
      throw new Error(
        'handlerClass length must be between 2 and 120 characters',
      );
    }
    if (!/^[A-Z][A-Za-z0-9]*$/.test(value)) {
      throw new Error(
        'handlerClass must be a valid class-like name such as StripePaymentGateway',
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

type CreatePaymentTransactionProps = {
  paymentId: PaymentId;
  providerId: PaymentProviderId;
  gatewayTransactionId: string;
  gatewayCustomerId?: string | null;
  amountInMinorUnit: number;
  rawPayload: Record<string, unknown>;
  cardLast4?: string | null; // The last 4 digits of the customer's card
  cardBrand?: string | null; // The card type/brand (e.g. "visa", "mastercard", "amex").
  receiptUrl?: string | null; // A URL to the payment receipt from the gateway
};
type PaymentTransactionProps = {
  id: PaymentTransactionId;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
} & CreatePaymentTransactionProps;

export class PaymentTransaction {
  private constructor(private props: PaymentTransactionProps) {}

  static create(data: CreatePaymentTransactionProps): PaymentTransaction {
    const now = new Date();

    this.validateAmount(data.amountInMinorUnit);
    this.validateGatewayTransactionId(data.gatewayTransactionId);
    this.validateCardLast4(data.cardLast4);

    return new PaymentTransaction({
      id: PaymentTransactionId.create(),
      paymentId: data.paymentId,
      providerId: data.providerId,
      gatewayTransactionId: data.gatewayTransactionId.trim(),
      gatewayCustomerId: data.gatewayCustomerId?.trim() || null,
      amountInMinorUnit: data.amountInMinorUnit,
      status: PaymentStatus.PENDING,
      cardLast4: data.cardLast4 ?? null,
      cardBrand: data.cardBrand?.trim().toLowerCase() || null,
      receiptUrl: data.receiptUrl?.trim() || null,
      rawPayload: data.rawPayload,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(data: PaymentTransactionProps): PaymentTransaction {
    this.validateAmount(data.amountInMinorUnit);
    this.validateGatewayTransactionId(data.gatewayTransactionId);
    this.validateCardLast4(data.cardLast4);

    return new PaymentTransaction(data);
  }

  markAsPaid(rawPayload?: Record<string, unknown>) {
    if (this.props.status === PaymentStatus.CANCELLED) {
      throw new Error('Cancelled transaction cannot be marked as paid');
    }
    this.props.status = PaymentStatus.PAID;
    if (rawPayload) this.props.rawPayload = rawPayload;
    this.touch();
  }

  markAsFailed(rawPayload?: Record<string, unknown>) {
    if (this.props.status === PaymentStatus.PAID) {
      throw new Error('Paid transaction cannot be marked as failed');
    }
    this.props.status = PaymentStatus.FAILED;
    if (rawPayload) this.props.rawPayload = rawPayload;
    this.touch();
  }

  cancel(rawPayload?: Record<string, unknown>) {
    if (this.props.status === PaymentStatus.PAID) {
      throw new Error('Paid transaction cannot be cancelled');
    }
    this.props.status = PaymentStatus.CANCELLED;
    if (rawPayload) this.props.rawPayload = rawPayload;
    this.touch();
  }

  updateGatewayMeta(data: {
    gatewayCustomerId?: string | null;
    cardLast4?: string | null;
    cardBrand?: string | null;
    receiptUrl?: string | null;
    rawPayload?: Record<string, unknown>;
  }) {
    PaymentTransaction.validateCardLast4(data.cardLast4);

    if (data.gatewayCustomerId !== undefined) {
      this.props.gatewayCustomerId = data.gatewayCustomerId?.trim() || null;
    }
    if (data.cardLast4 !== undefined) {
      this.props.cardLast4 = data.cardLast4 ?? null;
    }
    if (data.cardBrand !== undefined) {
      this.props.cardBrand = data.cardBrand?.trim().toLowerCase() || null;
    }
    if (data.receiptUrl !== undefined) {
      this.props.receiptUrl = data.receiptUrl?.trim() || null;
    }
    if (data.rawPayload !== undefined) {
      this.props.rawPayload = data.rawPayload;
    }

    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  private static validateAmount(amountInMinorUnit: number) {
    if (!Number.isInteger(amountInMinorUnit) || amountInMinorUnit <= 0) {
      throw new Error('amountInMinorUnit must be a positive integer');
    }
  }

  private static validateGatewayTransactionId(value: string) {
    if (!value || !value.trim()) {
      throw new Error('gatewayTransactionId is required');
    }
  }

  private static validateCardLast4(value?: string | null) {
    if (value == null) return;
    if (!/^\\d{4}$/.test(value)) {
      throw new Error('cardLast4 must be exactly 4 digits');
    }
  }
  toJSON(): PaymentTransactionProps {
    return { ...this.props };
  }
}
