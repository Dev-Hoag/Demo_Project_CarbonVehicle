# 🚀 Quick Start Guide - CCM Frontend

## Start the Application

```powershell
# Navigate to frontend directory
cd c:\Study\BuildAppOOP\CreditCarbonMarket\CCM-Frontend

# Start development server
npm run dev
```

Access at: **http://localhost:5174/** (or 5173 if available)

## Test the Application

### 1. Register New User
1. Go to: http://localhost:5174/register
2. Fill in the form:
   - **Email**: test@example.com
   - **Password**: Test123456
   - **Full Name**: Test User
   - **Phone**: 1234567890
   - **User Type**: Select (BUYER, EV_OWNER, or CVA)
3. Click **Sign Up**
4. Check console for success message

### 2. Login
1. Go to: http://localhost:5174/login
2. Enter your credentials
3. Click **Sign In**
4. You'll be redirected to Dashboard

### 3. Explore Features

#### Dashboard
- View your wallet balance
- See payment statistics
- Check recent activity

#### Wallet
- Check balance
- Click **Deposit** to add funds
- Click **Withdraw** to withdraw funds
- View transaction history

#### Payments
- Click **New Payment** to initiate payment
- View payment history
- Check payment details
- Cancel pending payments

#### Listings (Mock Data)
- Browse carbon credit listings
- Filter by status (Active/Sold/Cancelled)
- Search by seller or description
- **EV_OWNER**: Create new listing
- **BUYER**: Buy credits

#### Transactions (Mock Data)
- View all transactions
- Filter by status
- Search by ID
- View transaction details

#### Profile
- View your profile information
- Click **Edit Profile** to update
- Update name, phone, address
- Save changes

### 4. Logout
- Click your avatar (top right)
- Select **Logout**

## 🔑 Test Credentials

If you need to test quickly, use these:

```
Email: test@example.com
Password: Test123456
```

*(You'll need to register first if the user doesn't exist)*

## 🎨 Pages Overview

| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | User authentication |
| Register | `/register` | New user registration |
| Dashboard | `/dashboard` | Main overview |
| Wallet | `/wallet` | Manage funds |
| Payments | `/payments` | Payment management |
| Listings | `/listings` | Carbon credits (mock) |
| Transactions | `/transactions` | History (mock) |
| Profile | `/profile` | User profile |

## 🔧 Backend Requirements

Make sure these services are running:

```powershell
# Gateway should be running on port 80
http://localhost:80

# Check services
http://localhost:3000  # Admin Service
http://localhost:3001  # User Service
http://localhost:3002  # Payment Service
http://localhost:3008  # Wallet Service
```

## 🐛 Troubleshooting

### Frontend won't start
```powershell
# Delete node_modules and reinstall
rm -r -fo node_modules
npm install
npm run dev
```

### Port already in use
- Frontend will automatically try next available port (5173 → 5174 → 5175)
- Or kill the process using the port

### API calls fail
1. Check backend gateway is running: http://localhost:80
2. Open browser DevTools → Network tab
3. Check CORS errors
4. Verify JWT token in localStorage

### Login fails
1. Check User Service is running on port 3001
2. Verify email/password are correct
3. Make sure user is registered

### Data not loading
1. Check if services are responding
2. Open browser console for errors
3. Check Network tab for failed requests

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari

## 🎯 Features to Test

### Authentication
- [x] Register new account
- [x] Login with credentials
- [x] Stay logged in (token refresh)
- [x] Logout

### Wallet
- [x] View balance
- [x] Deposit funds
- [x] Withdraw funds
- [x] View transactions

### Payments
- [x] Create payment
- [x] View history
- [x] Cancel payment
- [x] Payment details

### Listings (Mock)
- [x] Browse listings
- [x] Filter & search
- [x] Create listing (EV_OWNER)
- [x] Buy credits (BUYER)

### Transactions (Mock)
- [x] View history
- [x] Filter by status
- [x] Transaction stats

### Profile
- [x] View profile
- [x] Edit information
- [x] Update details

## 🎉 Success Indicators

✅ No console errors  
✅ Pages load quickly  
✅ Forms submit successfully  
✅ Toast notifications appear  
✅ Data displays correctly  
✅ Navigation works smoothly  

---

**Happy Testing! 🚀**
