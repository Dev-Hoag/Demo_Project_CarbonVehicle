import apiClient from './client';

// ========== Interfaces ==========

export interface ManagedListing {
  id: number;
  externalListingId: string;
  ownerId: string;
  creditsAmount: number;
  pricePerCredit: number;
  listingType: 'FIXED_PRICE' | 'AUCTION';
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'SUSPENDED';
  suspensionReason?: string;
  flagType?: string;
  flagReason?: string;
  createdAt: string;
  syncedAt: string;
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
  getById: (id: number) =>
    apiClient.get(`/api/admin/listings/${id}`),

  // Suspend listing (UC10.3)
  suspend: (id: number, data: SuspendListingRequest) =>
    apiClient.post(`/api/admin/listings/${id}/suspend`, data),

  // Activate listing (UC10.3)
  activate: (id: number, data: ActivateListingRequest) =>
    apiClient.post(`/api/admin/listings/${id}/activate`, data),

  // Flag listing (UC10.1)
  flag: (id: number, data: FlagListingRequest) =>
    apiClient.post(`/api/admin/listings/${id}/flag`, data),

  // Unflag listing (UC10.1)
  unflag: (id: number, data: UnflagListingRequest) =>
    apiClient.post(`/api/admin/listings/${id}/unflag`, data),
};
