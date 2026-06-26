// shipment.entity.ts

import {
  AddressId,
  OrderId,
  ShipmentId,
  ShippingProviderId,
} from 'src/modules/shared/domain/ids';
import { ShipmentMethod } from './shipping-method';
import { ShipmentStatus } from './shipping-status';

type ShipmentProps = {
  id: ShipmentId;
  orderId: OrderId;
  providerId: ShippingProviderId | null;
  orderAddressId: AddressId;
  method: ShipmentMethod;
  status: ShipmentStatus;
  shippingFeeInMinorUnit: number;
  trackingNumber: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateShipmentProps = Pick<
  ShipmentProps,
  | 'orderId'
  | 'orderAddressId'
  | 'method'
  | 'shippingFeeInMinorUnit'
  | 'providerId'
>;

export class Shipment {
  private constructor(private props: ShipmentProps) {}

  static create(data: CreateShipmentProps): Shipment {
    Shipment.validateFee(data.shippingFeeInMinorUnit);

    const now = new Date();

    return new Shipment({
      id: ShipmentId.create(),
      orderId: data.orderId,
      orderAddressId: data.orderAddressId,
      method: data.method,
      status: ShipmentStatus.PENDING,
      shippingFeeInMinorUnit: data.shippingFeeInMinorUnit,
      providerId: data.providerId ?? null,
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(data: ShipmentProps): Shipment {
    Shipment.validateFee(data.shippingFeeInMinorUnit);
    return new Shipment(data);
  }

  prepare(): void {
    if (this.props.status !== ShipmentStatus.PENDING) {
      throw new Error('Only PENDING shipment can be set to PREPARING');
    }
    this.props.status = ShipmentStatus.PREPARING;
    this.touch();
  }

  ship(trackingNumber?: string): void {
    if (this.props.status !== ShipmentStatus.PREPARING) {
      throw new Error('Only PREPARING shipment can be shipped');
    }
    this.props.status = ShipmentStatus.SHIPPED;
    this.props.trackingNumber = trackingNumber?.trim() ?? null;
    this.props.shippedAt = new Date();
    this.touch();
  }

  deliver(): void {
    if (this.props.status !== ShipmentStatus.SHIPPED) {
      throw new Error('Only SHIPPED shipment can be delivered');
    }
    this.props.status = ShipmentStatus.DELIVERED;
    this.props.deliveredAt = new Date();
    this.touch();
  }

  cancel(): void {
    if (
      this.props.status === ShipmentStatus.DELIVERED ||
      this.props.status === ShipmentStatus.CANCELLED
    ) {
      throw new Error(
        'Cannot cancel a DELIVERED or already CANCELLED shipment',
      );
    }
    this.props.status = ShipmentStatus.CANCELLED;
    this.touch();
  }

  assignProvider(providerId: ShippingProviderId): void {
    this.props.providerId = providerId;
    this.touch();
  }

  updateTrackingNumber(trackingNumber: string): void {
    const normalized = trackingNumber.trim();
    if (!normalized) throw new Error('trackingNumber cannot be empty');
    this.props.trackingNumber = normalized;
    this.touch();
  }

  get isDelivered(): boolean {
    return this.props.status === ShipmentStatus.DELIVERED;
  }

  get isCancelled(): boolean {
    return this.props.status === ShipmentStatus.CANCELLED;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static validateFee(fee: number): void {
    if (!Number.isInteger(fee) || fee < 0) {
      throw new Error('shippingFeeInMinorUnit must be a non-negative integer');
    }
  }
  toJSON(): ShipmentProps {
    return { ...this.props };
  }
}
