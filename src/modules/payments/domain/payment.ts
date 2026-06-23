import { OrderId, PaymentId } from 'src/modules/shared/domain/ids';
import { PaymentStatus } from './payment-status';
import { PaymentMethod } from './payment-method';

type PaymentProps = {
  id: PaymentId;
  status: PaymentStatus;
  paidAt?: Date | null;
  orderId: OrderId;
  amountInMinorUnit: number;
  currency: string;
  method: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
};
type CreatePaymentProps = Pick<
  PaymentProps,
  'orderId' | 'amountInMinorUnit' | 'currency' | 'method'
>;
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
