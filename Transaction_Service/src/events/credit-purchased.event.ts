export class CreditPurchasedEvent {
  eventType: string = 'credit.purchased';
  transactionId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  creditAmount: number;
  totalPrice: number;
  pricePerKg: number;
  purchasedAt: Date;
  tripId?: string;

  constructor(partial: Partial<CreditPurchasedEvent>) {
    Object.assign(this, partial);
  }
}
