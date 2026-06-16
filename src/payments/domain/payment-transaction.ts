import {
  PaymentId,
  PaymentProviderId,
  PaymentTransactionId,
} from 'src/shared/domain/ids';
import { PaymentStatus } from './payment';

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
