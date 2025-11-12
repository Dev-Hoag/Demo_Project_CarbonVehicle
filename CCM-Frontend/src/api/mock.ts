// Mock services for endpoints that don't have backend implementation yet
// These will return simulated data until the real backend is built

export interface CarbonCredit {
  id: number;
  projectName: string;
  creditAmount: number;
  pricePerCredit: number;
  totalPrice: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  expiryDate: string;
  createdAt: string;
}

export interface Listing {
  id: number;
  sellerId: number;
  sellerName: string;
  creditId: number;
  creditAmount: number;
  pricePerCredit: number;
  totalPrice: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  description: string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  listingId: number;
  buyerId: number;
  sellerId: number;
  creditAmount: number;
  totalPrice: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  transactionDate: string;
}

// Delay to simulate network latency
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data generators
const generateMockCarbonCredits = (count: number = 10): CarbonCredit[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    projectName: `Solar Farm Project ${i + 1}`,
    creditAmount: Math.floor(Math.random() * 1000) + 100,
    pricePerCredit: Math.floor(Math.random() * 50) + 10,
    totalPrice: 0,
    verificationStatus: ['PENDING', 'VERIFIED', 'REJECTED'][Math.floor(Math.random() * 3)] as any,
    expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
  })).map(c => ({ ...c, totalPrice: c.creditAmount * c.pricePerCredit }));
};

const generateMockListings = (count: number = 10): Listing[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    sellerId: Math.floor(Math.random() * 100) + 1,
    sellerName: `Seller ${Math.floor(Math.random() * 100) + 1}`,
    creditId: Math.floor(Math.random() * 100) + 1,
    creditAmount: Math.floor(Math.random() * 500) + 50,
    pricePerCredit: Math.floor(Math.random() * 50) + 10,
    totalPrice: 0,
    status: ['ACTIVE', 'SOLD', 'CANCELLED'][Math.floor(Math.random() * 3)] as any,
    description: `High-quality carbon credits from verified renewable energy project ${i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  })).map(l => ({ ...l, totalPrice: l.creditAmount * l.pricePerCredit }));
};

const generateMockTransactions = (count: number = 10): Transaction[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    listingId: Math.floor(Math.random() * 100) + 1,
    buyerId: Math.floor(Math.random() * 100) + 1,
    sellerId: Math.floor(Math.random() * 100) + 1,
    creditAmount: Math.floor(Math.random() * 500) + 50,
    totalPrice: Math.floor(Math.random() * 10000) + 1000,
    status: ['PENDING', 'COMPLETED', 'CANCELLED'][Math.floor(Math.random() * 3)] as any,
    transactionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

// Mock API for Carbon Credits
export const mockCarbonCreditApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    await delay();
    const allCredits = generateMockCarbonCredits(50);
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: allCredits.slice(start, end),
      total: allCredits.length,
      page,
      limit,
    };
  },

  getById: async (id: number) => {
    await delay();
    const credits = generateMockCarbonCredits(50);
    return credits.find(c => c.id === id) || credits[0];
  },

  create: async (data: Partial<CarbonCredit>) => {
    await delay();
    return {
      id: Math.floor(Math.random() * 1000),
      ...data,
      createdAt: new Date().toISOString(),
    } as CarbonCredit;
  },

  verify: async (id: number) => {
    await delay();
    return { id, verificationStatus: 'VERIFIED' };
  },
};

// Mock API for Listings
export const mockListingApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    await delay();
    let allListings = generateMockListings(50);
    
    if (params?.status) {
      allListings = allListings.filter(l => l.status === params.status);
    }
    
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: allListings.slice(start, end),
      total: allListings.length,
      page,
      limit,
    };
  },

  getById: async (id: number) => {
    await delay();
    const listings = generateMockListings(50);
    return listings.find(l => l.id === id) || listings[0];
  },

  create: async (data: Partial<Listing>) => {
    await delay();
    return {
      id: Math.floor(Math.random() * 1000),
      ...data,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    } as Listing;
  },

  update: async (id: number, data: Partial<Listing>) => {
    await delay();
    return {
      id,
      ...data,
    } as Listing;
  },

  cancel: async (id: number) => {
    await delay();
    return { id, status: 'CANCELLED' };
  },
};

// Mock API for Transactions
export const mockTransactionApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    await delay();
    let allTransactions = generateMockTransactions(50);
    
    if (params?.status) {
      allTransactions = allTransactions.filter(t => t.status === params.status);
    }
    
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: allTransactions.slice(start, end),
      total: allTransactions.length,
      page,
      limit,
    };
  },

  getById: async (id: number) => {
    await delay();
    const transactions = generateMockTransactions(50);
    return transactions.find(t => t.id === id) || transactions[0];
  },

  create: async (data: Partial<Transaction>) => {
    await delay();
    return {
      id: Math.floor(Math.random() * 1000),
      ...data,
      status: 'PENDING',
      transactionDate: new Date().toISOString(),
    } as Transaction;
  },

  complete: async (id: number) => {
    await delay();
    return { id, status: 'COMPLETED' };
  },

  cancel: async (id: number) => {
    await delay();
    return { id, status: 'CANCELLED' };
  },
};

// Check if mock services should be enabled
export const shouldUseMockServices = () => {
  return import.meta.env.VITE_ENABLE_MOCK_SERVICES === 'true';
};
