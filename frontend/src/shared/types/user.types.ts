// User Types
export enum UserType {
  EV_OWNER = 'EV_OWNER',
  BUYER = 'BUYER',
  CVA = 'CVA',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: number;
  email: string;
  userType: UserType;
  status: UserStatus;
  kycStatus: KycStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: number;
  fullName: string;
  phone?: string;
  address?: string;
  city?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  userType: UserType;
  fullName: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  bio?: string;
  dateOfBirth?: string;
}

// KYC Types
export enum DocumentType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface KycDocument {
  id: number;
  userId: number;
  documentType: DocumentType;
  documentNumber: string;
  fileUrl: string;
  status: DocumentStatus;
  verifiedBy?: number;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitKycRequest {
  documentType: DocumentType;
  documentNumber: string;
  file: File;
}
