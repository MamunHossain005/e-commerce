export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CustomerInfo {
  email: string;
  phone: string;
}

export interface PaymentDetails {
  transactionId?: string;
  validationId?: string;
  amount?: number;
  cardType?: string;
  storeAmount?: number;
  cardNo?: string;
  bankTransactionId?: string;
  status?: string;
  transactionDate?: Date | string;
}

export interface RefundDetails {
  refundId?: string;
  refundAmount?: number;
  refundedAt?: Date | string;
  refundMethod?: string;
  refundNotes?: string;
}

export type PaymentStatus = "Pending" | "Completed" | "Failed" | "Cancelled" | "Refunded";
export type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancel";
export type CancelledBy = "customer" | "admin" | "system";
export type RefundStatus = "pending" | "initiated" | "completed" | "failed" | "not_applicable";

export interface Order {
  _id: string;
  user: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  customerInfo: CustomerInfo;
  paymentMethod: string;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: Date | string;
  isDelivered: boolean;
  deliveredAt?: Date | string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  orderNotes?: string;
  paymentDetails?: PaymentDetails;
  isCancelled: boolean;
  cancelledAt?: Date | string;
  cancellationReason?: string;
  cancelledBy: CancelledBy;
  refundStatus: RefundStatus;
  refundDetails?: RefundDetails;
  createdAt: Date | string; 
  updatedAt: Date | string; 
  canBeCancelled?: boolean;
}