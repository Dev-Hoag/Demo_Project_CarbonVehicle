# User Service API Guide

Complete API documentation for User Service frontend integration.

## Base URL
```
http://localhost/api
```

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User Profile APIs](#user-profile-apis)
3. [KYC APIs](#kyc-apis)
4. [Password Management](#password-management)

---

## Authentication APIs

### 1. Register New User
```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "0123456789",
  "userType": "EV_OWNER"  // Options: EV_OWNER, BUYER, CVA
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful. Please check your email to verify.",
  "userId": 123
}
```

**Frontend Implementation:**
```typescript
// Already implemented in CCM-Frontend/src/api/auth.ts
const register = async (data: RegisterDto) => {
  const response = await apiClient.post('/api/auth/register', data);
  return response.data;
};
```

---

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "fullName": "John Doe",
    "userType": "EV_OWNER",
    "status": "ACTIVE",
    "isEmailVerified": true
  }
}
```

**Frontend Implementation:**
```typescript
// Already implemented in CCM-Frontend/src/api/auth.ts
const login = async (email: string, password: string) => {
  const response = await apiClient.post('/api/auth/login', { email, password });
  return response.data;
};
```

---

### 3. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

---

### 4. Get Current User Info
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "email": "user@example.com",
  "fullName": "John Doe",
  "userType": "EV_OWNER",
  "status": "ACTIVE",
  "isEmailVerified": true,
  "kycStatus": "PENDING",
  "createdAt": "2025-11-05T10:30:00.000Z"
}
```

---

### 5. Email Verification
```http
GET /api/auth/verify?token=<verification_token>
```

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

**Frontend Implementation:**
```typescript
// Should be added to auth.ts
const verifyEmail = async (token: string) => {
  const response = await apiClient.get('/api/auth/verify', {
    params: { token }
  });
  return response.data;
};
```

---

## User Profile APIs

### 1. Get My Profile
```http
GET /api/users/profile
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "email": "user@example.com",
  "userType": "EV_OWNER",
  "status": "ACTIVE",
  "kycStatus": "PENDING",
  "fullName": "John Doe",
  "phone": "0123456789",
  "address": "123 Main St, District 1",
  "city": "Ho Chi Minh",
  "dateOfBirth": "1990-01-01",
  "bio": "EV enthusiast",
  "vehicleType": "VinFast VF8",
  "vehicleModel": "VF8 Plus",
  "vehiclePlate": "51A-12345",
  "createdAt": "2025-11-05T10:30:00.000Z"
}
```

**Frontend Implementation:**
```typescript
// Already implemented in CCM-Frontend/src/api/user.ts
const getProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get('/api/users/profile');
  return response.data;
};
```

---

### 2. Update My Profile
```http
PUT /api/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "phone": "0987654321",
  "address": "456 New Street",
  "city": "Ho Chi Minh",
  "dateOfBirth": "1990-01-01",
  "bio": "Updated bio",
  "vehicleType": "VinFast VF9",
  "vehicleModel": "VF9 Eco",
  "vehiclePlate": "51B-67890"
}
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "email": "user@example.com",
  "fullName": "John Doe Updated",
  "phone": "0987654321",
  "...": "..."
}
```

**Frontend Implementation:**
```typescript
// Already implemented in CCM-Frontend/src/api/user.ts
const updateProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
  const response = await apiClient.put('/api/users/profile', data);
  return response.data;
};
```

---

### 3. Get User By ID (Public Info)
```http
GET /api/users/:id
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "fullName": "John Doe",
  "userType": "EV_OWNER",
  "city": "Ho Chi Minh",
  "bio": "EV enthusiast"
}
```

**Note:** Only returns public information (no email, phone, etc.)

---

## KYC APIs

### 1. Upload KYC Document
```http
POST /api/kyc/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request (Form Data):**
- `file`: Image or PDF file (max 5MB)
- `documentType`: One of: `ID_CARD`, `PASSPORT`, `DRIVER_LICENSE`, `VEHICLE_REGISTRATION`, `BUSINESS_LICENSE`
- `documentNumber`: Optional document number

**Response:** `201 Created`
```json
{
  "id": 456,
  "userId": 123,
  "documentType": "ID_CARD",
  "documentNumber": "001234567890",
  "fileUrl": "/uploads/kyc/kyc-1699123456789.jpg",
  "status": "PENDING",
  "uploadedAt": "2025-11-05T11:00:00.000Z"
}
```

**Frontend Implementation (MISSING - Need to add):**
```typescript
// Should be added to CCM-Frontend/src/api/kyc.ts
export interface KycDocument {
  id: number;
  userId: number;
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVER_LICENSE' | 'VEHICLE_REGISTRATION' | 'BUSINESS_LICENSE';
  documentNumber?: string;
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export const kycApi = {
  uploadDocument: async (file: File, documentType: string, documentNumber?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentNumber) {
      formData.append('documentNumber', documentNumber);
    }
    const response = await apiClient.post('/api/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getMyDocuments: async (): Promise<KycDocument[]> => {
    const response = await apiClient.get('/api/kyc/documents');
    return response.data;
  },

  getKycStatus: async (): Promise<{
    userId: number;
    kycStatus: string;
    documents: KycDocument[];
  }> => {
    const response = await apiClient.get('/api/kyc/status');
    return response.data;
  },

  deleteDocument: async (docId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/kyc/documents/${docId}`);
    return response.data;
  },
};
```

---

### 2. Get My KYC Documents
```http
GET /api/kyc/documents
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
[
  {
    "id": 456,
    "userId": 123,
    "documentType": "ID_CARD",
    "documentNumber": "001234567890",
    "fileUrl": "/uploads/kyc/kyc-1699123456789.jpg",
    "status": "APPROVED",
    "uploadedAt": "2025-11-05T11:00:00.000Z",
    "verifiedAt": "2025-11-05T12:00:00.000Z"
  }
]
```

---

### 3. Get KYC Status
```http
GET /api/kyc/status
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "userId": 123,
  "kycStatus": "PENDING",
  "documents": [
    {
      "id": 456,
      "documentType": "ID_CARD",
      "status": "PENDING",
      "uploadedAt": "2025-11-05T11:00:00.000Z"
    }
  ]
}
```

---

### 4. Delete KYC Document
```http
DELETE /api/kyc/documents/:docId
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "message": "Document deleted successfully"
}
```

---

## Password Management

### 1. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If the email exists, a reset link has been sent"
}
```

**Frontend Implementation (MISSING - Need to add):**
```typescript
// Should be added to auth.ts
const forgotPassword = async (email: string) => {
  const response = await apiClient.post('/api/auth/forgot-password', { email });
  return response.data;
};
```

---

### 2. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

**Frontend Implementation (MISSING - Need to add):**
```typescript
// Should be added to auth.ts
const resetPassword = async (token: string, password: string) => {
  const response = await apiClient.post('/api/auth/reset-password', {
    token,
    password
  });
  return response.data;
};
```

---

## Missing Features for Frontend

### 1. KYC Management (HIGH PRIORITY)
**Status:** ❌ Not implemented

**Required Files:**
- `CCM-Frontend/src/api/kyc.ts` - API client for KYC endpoints
- `CCM-Frontend/src/pages/KYC.tsx` - KYC document upload and management page

**Features Needed:**
- Upload KYC documents (ID card, passport, driver's license)
- View uploaded documents
- Check KYC verification status
- Delete pending documents
- Display approval/rejection status

---

### 2. Email Verification Flow
**Status:** ⚠️ Partially implemented (backend ready, frontend incomplete)

**Required:**
- `CCM-Frontend/src/pages/VerifyEmail.tsx` - Email verification page that accepts token from URL
- Add route in router for `/verify-email?token=xxx`
- Show verification success/error message

---

### 3. Password Reset Flow
**Status:** ❌ Not implemented

**Required Files:**
- `CCM-Frontend/src/pages/ForgotPassword.tsx` - Request reset link page
- `CCM-Frontend/src/pages/ResetPassword.tsx` - Reset password with token page
- Add API functions to `auth.ts`

---

### 4. Profile Picture Upload
**Status:** ⚠️ API exists but might not be implemented in User Service

**Note:** Frontend has `uploadProfilePicture` function, but need to verify backend endpoint exists.

---

## Summary

### ✅ Already Implemented in Frontend:
- User registration
- Login/Logout
- Get user profile
- Update profile
- Get user by ID

### ❌ Missing in Frontend (Backend Ready):
1. **KYC Document Management** (High Priority)
   - Upload documents
   - View KYC status
   - Manage documents

2. **Email Verification UI**
   - Verification page
   - Success/error handling

3. **Password Reset Flow**
   - Forgot password page
   - Reset password page

4. **Profile Enhancements**
   - Vehicle information fields (for EV_OWNER)
   - Company information fields (for BUYER)
   - Certification fields (for CVA)

### 🔧 Recommendations:
1. Create KYC management page as top priority
2. Add email verification page for new users
3. Implement password reset flow
4. Add user type-specific profile fields
5. Consider adding profile picture upload if backend supports it
