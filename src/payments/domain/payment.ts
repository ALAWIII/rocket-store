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
}

type PaymentTransactionProps = {
  id: PaymentTransactionId;
  paymentId: PaymentId;
  providerId: PaymentProviderId;
  gatewayTransactionId: string;
  gatewayCustomerId?: string | null;
  amountInMinorUnit: number;
  status: PaymentStatus;
  cardLast4?: string | null; // The last 4 digits of the customer's card
  cardBrand?: string | null; // The card type/brand (e.g. "visa", "mastercard", "amex").
  receiptUrl?: string | null; // A URL to the payment receipt from the gateway
  rawPayload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentProviderProps = {
  id: PaymentProviderId;
  slug: string;
  displayName: string;
  isActive: boolean;
  config: Record<string, unknown>;
  handlerClass: string;
  createdAt: Date;
  updatedAt: Date;
};
class PaymentTransaction {}
class PaymentProvider {}
