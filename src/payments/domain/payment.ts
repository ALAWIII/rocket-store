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

type PaymentProps = {
  id: PaymentId;
  orderId: OrderId;
  amountInMinorUnit: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

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
class Payment {}
class PaymentTransaction {}
class PaymentProvider {}
