import apiClient from './client';

// ========== Interfaces ==========

export interface Listing {
  id: string;
  title: string;
  description: string;
  co2Amount: number;
  pricePerKg: number;
  totalPrice: number;
  status: 'ACTIVE' | 'PENDING' | 'SOLD' | 'CANCELLED' | 'PENDING_PAYMENT' | 'EXPIRED';
  listingType: 'FIXED_PRICE' | 'AUCTION';
  sellerId: string;
  tripId?: string;
  // Auction-specific fields
  startingBid?: number;
  reservePrice?: number;
  auctionStartTime?: string;
  auctionEndTime?: string;
  winnerId?: string;
  winningBidAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  co2Amount: number;
  pricePerKg: number;
  sellerId: string;
  listingType: 'FIXED_PRICE' | 'AUCTION';
  tripId?: string;
  startingBid?: number;
  reservePrice?: number;
  auctionEndTime?: string;
  durationHours?: number;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  pricePerKg?: number;
  status?: string;
  sellerId: string;
}

export interface Bid {
  id: string;
  listingId: string;
  bidderId: string;
  bidAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBidRequest {
  bidderId: string;
  bidAmount: number;
}

export interface PurchaseRequest {
  buyerId: string;
  amount: number;
}

export interface Transaction {
  [x: string]: ReactNode;
  [x: string]: ReactNode;
  [x: string]: ReactNode;
  [x: string]: ReactNode;
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number; // CO2 amount in kg
  pricePerKg: number;
  totalPrice: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  transactionType: 'DIRECT_PURCHASE' | 'BID_ACCEPTED';
  notes?: string;
  createdAt: string;
}

// ========== Listing API ==========

export const listingApi = {
  // Get all listings (paginated)
  getAll: (params?: { page?: number; size?: number; sort?: string }) =>
    apiClient.get('/api/listings', { params }),

  // Get listing by ID
  getById: (id: string) =>
    apiClient.get(`/api/listings/${id}`),

  // Create new listing
  create: (data: CreateListingRequest) =>
    apiClient.post('/api/listings', data),

  // Update listing
  update: (id: string, data: UpdateListingRequest) =>
    apiClient.put(`/api/listings/${id}`, data),

  // Purchase listing
  purchase: (listingId: string, data: PurchaseRequest) =>
    apiClient.post(`/api/transactions/listings/${listingId}/purchase`, data),

  // Place bid
  placeBid: (listingId: string, data: CreateBidRequest) =>
    apiClient.post(`/api/bids/listings/${listingId}`, data),
};

// ========== Bid API ==========

export const bidApi = {
  // Create bid for listing
  create: (listingId: string, data: CreateBidRequest) =>
    apiClient.post(`/api/bids/listings/${listingId}`, data),

  // Get bid by ID
  getById: (id: string) =>
    apiClient.get(`/api/bids/${id}`),

  // Get all bids for a listing
  getByListing: (listingId: string, params?: { page?: number; size?: number }) =>
    apiClient.get(`/api/bids/listings/${listingId}`, { params }),

  // Get all bids by bidder
  getByBidder: (bidderId: string, params?: { page?: number; size?: number }) =>
    apiClient.get(`/api/bids/bidder/${bidderId}`, { params }),

  // Get active bids for bidder
  getActiveBids: (bidderId: string, params?: { page?: number; size?: number }) =>
    apiClient.get(`/api/bids/bidder/${bidderId}/active`, { params }),

  // Delete/withdraw bid
  delete: (bidId: string) =>
    apiClient.delete(`/api/bids/${bidId}`),
};

// ========== Transaction API ==========

export const transactionApi = {
  // Purchase listing directly
  purchase: (listingId: string, data: { buyerId: string; notes?: string }) =>
    apiClient.post(`/api/transactions/listings/${listingId}/purchase`, data),

  // Get transaction by ID
  getById: (id: string) =>
    apiClient.get(`/api/transactions/${id}`),

  // Get buyer transactions
  getByBuyer: (buyerId: string, params?: { page?: number; size?: number }) =>
    apiClient.get(`/api/transactions/buyer/${buyerId}`, { params }),

  // Get seller transactions
  getBySeller: (sellerId: string, params?: { page?: number; size?: number }) =>
    apiClient.get(`/api/transactions/seller/${sellerId}`, { params }),

  // Get transactions by status
  getByStatus: (status: string, params?: { page?: number; size?: number }) =>
    apiClient.get(`/api/transactions/status/${status}`, { params }),

  // Get recent transactions
  getRecent: (limit: number = 10) =>
    apiClient.get('/api/transactions/recent', { params: { limit } }),

  // Get seller revenue
  getSellerRevenue: (sellerId: string, params?: { startDate?: string; endDate?: string }) =>
    apiClient.get(`/api/transactions/seller/${sellerId}/revenue`, { params }),

  // Get buyer spending
  getBuyerSpending: (buyerId: string, params?: { startDate?: string; endDate?: string }) =>
    apiClient.get(`/api/transactions/buyer/${buyerId}/spending`, { params }),

  // Get buyer CO2 purchased
  getBuyerCO2: (buyerId: string, params?: { startDate?: string; endDate?: string }) =>
    apiClient.get(`/api/transactions/buyer/${buyerId}/co2-purchased`, { params }),

  // Get seller CO2 sold
  getSellerCO2: (sellerId: string, params?: { startDate?: string; endDate?: string }) =>
    apiClient.get(`/api/transactions/seller/${sellerId}/co2-sold`, { params }),
};

// ========== Auction API ==========

export const auctionApi = {
  // Place a bid on an auction listing
  placeBid: (listingId: string, bidAmount: number, bidderId: string) =>
    apiClient.post(`/api/auctions/listings/${listingId}/bid`, {
      bidderId,
      bidAmount,
    }),

  // Get bid history for a listing
  getBidHistory: (listingId: string) =>
    apiClient.get(`/api/auctions/listings/${listingId}/bids`),

  // Get bid count for a listing
  getBidCount: (listingId: string) =>
    apiClient.get(`/api/auctions/listings/${listingId}/bid-count`),

  // Get current highest bid for a listing
  getCurrentBid: (listingId: string) =>
    apiClient.get(`/api/auctions/listings/${listingId}/current-bid`),

  // Get my bids
  getMyBids: () =>
    apiClient.get('/api/auctions/my-bids'),
};
