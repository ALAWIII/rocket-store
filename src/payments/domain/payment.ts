import { OrderId, PaymentId } from 'src/shared/domain/ids';
export const PaymentMethod = {
  COD: 'COD',
  ELECTRONIC: 'ELECTRONIC',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

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
