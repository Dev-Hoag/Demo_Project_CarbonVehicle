import apiClient from './client';

// ========== Interfaces ==========

export interface ManagedListing {
  id: string;
  externalListingId: string;
  ownerId: string;
  amount: number;  // Backend returns 'amount' (kg CO2)
  pricePerKg: number;  // Backend returns 'pricePerKg' (VND per kg)
  listingType: 'FIXED_PRICE' | 'AUCTION';
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'SUSPENDED' | 'PENDING' | 'PENDING_PAYMENT' | 'EXPIRED' | 'DRAFT';
  suspensionReason?: string;
  flag?: string;
  flagReason?: string;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ListingFilters {
  status?: 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'SUSPENDED';
  listingType?: 'FIXED_PRICE' | 'AUCTION';
  ownerId?: string;
}

export interface SuspendListingRequest {
  reason: string;
}

export interface ActivateListingRequest {
  reason: string;
}

export interface FlagListingRequest {
  flagType: string;
  reason: string;
}

export interface UnflagListingRequest {
  reason: string;
}

// ========== Admin Listings API ==========

export const adminListingsApi = {
  // Get all listings with filters
  getAll: (page: number = 1, limit: number = 20, filters?: ListingFilters) => {
    // Remove undefined/empty filter values
    const cleanFilters: any = {};
    if (filters?.status) cleanFilters.status = filters.status;
    if (filters?.listingType) cleanFilters.listingType = filters.listingType;
    if (filters?.ownerId) cleanFilters.ownerId = filters.ownerId;

    const params = {
      page,
      limit,
      ...cleanFilters,
    };
    return apiClient.get('/api/admin/listings', { params });
  },

  // Get listing by ID
  getById: (id: string) =>
    apiClient.get(`/api/admin/listings/${id}`),

  // Suspend listing (UC10.3) - NOT IMPLEMENTED YET
  suspend: (id: string, data: SuspendListingRequest) =>
    apiClient.post(`/api/admin/listings/${id}/suspend`, data),

  // Activate listing (UC10.3) - NOT IMPLEMENTED YET
  activate: (id: string, data: ActivateListingRequest) =>
    apiClient.post(`/api/admin/listings/${id}/activate`, data),

  // Flag listing (UC10.1) - NOT IMPLEMENTED YET
  flag: (id: string, data: FlagListingRequest) =>
    apiClient.post(`/api/admin/listings/${id}/flag`, data),

  // Unflag listing (UC10.1) - NOT IMPLEMENTED YET
  unflag: (id: string, data: UnflagListingRequest) =>
    apiClient.post(`/api/admin/listings/${id}/unflag`, data),
};
