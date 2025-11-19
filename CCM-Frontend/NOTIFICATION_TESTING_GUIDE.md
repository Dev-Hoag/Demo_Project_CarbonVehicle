# 🔔 Notification System - Complete Setup Guide

## ✅ Firebase Push Notifications Status

### **Backend** (100% Complete)
- ✅ Firebase Admin SDK initialized
- ✅ RabbitMQ event consumers listening
- ✅ 9 event types configured
- ✅ Multi-channel support (PUSH, IN_APP, EMAIL, SMS)
- ✅ Device token management
- ✅ WebSocket gateway for realtime notifications

### **Frontend** (100% Complete)
- ✅ Firebase Client SDK integrated
- ✅ Service worker registered
- ✅ FCM token obtained and saved
- ✅ Permission handling
- ✅ Foreground message handler
- ✅ Background message handler

---

## 🎯 How to Trigger Notifications

### 1. **Trip Verification** ✈️
**Action**: Verify a trip (CVA verifies user's trip)

**Steps:**
1. User submits a trip
2. CVA verifies the trip
3. **Event**: `trip.verified` published
4. **Notification**: "🎉 Your trip has been verified! You earned X CO2 credits."

**Test:**
- Go to CVA dashboard
- Verify any pending trip
- User will receive push notification

---

### 2. **Credit Listing Created** 🏷️
**Action**: User creates a credit listing

**Steps:**
1. User goes to "My Credits"
2. Creates a listing to sell credits
3. **Event**: `listing.created` published
4. **Notification**: "📝 Your listing has been created successfully!"

**Test:**
- Go to Credits page
- Create a new listing
- Check notification

---

### 3. **Listing Sold** 💰
**Action**: Someone buys a credit listing

**Steps:**
1. Buyer purchases a listing
2. Transaction completes
3. **Event**: `listing.sold` published
4. **Notification**: "🎉 Your listing has been sold! +$XXX"

**Test:**
- Create listing with User A
- Buy listing with User B
- User A receives notification

---

### 4. **Payment Completed** 💳
**Action**: User completes a payment (deposit/withdrawal)

**Steps:**
1. User deposits money via VNPay
2. Payment gateway confirms
3. **Event**: `payment.completed` published
4. **Notification**: "✅ Payment successful! Your wallet has been credited."

**Test:**
- Go to Wallet page
- Make a deposit
- Complete VNPay payment
- Check notification

---

### 5. **Credit Issued** 🎖️
**Action**: System issues credits to user

**Steps:**
1. Trip verified → Credits calculated
2. Credits issued to user's account
3. **Event**: `credit.issued` published
4. **Notification**: "🌿 You received X carbon credits!"

**Test:**
- Complete trip verification flow
- Credits automatically issued
- Notification sent

---

### 6. **Withdrawal Approved** 💵
**Action**: Admin approves withdrawal request

**Steps:**
1. User requests withdrawal
2. Admin approves in Admin Dashboard
3. **Event**: `withdrawal.approved` published
4. **Notification**: "✅ Your withdrawal of $XXX has been approved!"

**Test:**
- Request withdrawal as user
- Approve as admin
- Check user notification

---

### 7. **Withdrawal Rejected** ❌
**Action**: Admin rejects withdrawal request

**Steps:**
1. User requests withdrawal
2. Admin rejects in Admin Dashboard
3. **Event**: `withdrawal.rejected` published
4. **Notification**: "❌ Your withdrawal request has been rejected. Reason: ..."

**Test:**
- Request withdrawal as user
- Reject as admin
- Check user notification

---

### 8. **User Registered** 👤
**Action**: New user signs up

**Steps:**
1. User completes registration
2. Account created
3. **Event**: `user.registered` published
4. **Notification**: "👋 Welcome to Carbon Credit Market!"

**Test:**
- Register new account
- Check notification on first login

---

### 9. **Certificate Generated** 📜
**Action**: Certificate issued for credits

**Steps:**
1. User verifies credits
2. Certificate generated
3. **Event**: `certificate.generated` published
4. **Notification**: "📜 Certificate #XXX has been generated!"

**Test:**
- Request certificate verification
- Certificate generated
- Notification sent

---

## 📱 Testing Push Notifications

### **Quick Test Scenarios**

#### **Scenario 1: Trip Verification (Easiest)**
1. Login as regular user
2. Create a trip
3. Login as CVA
4. Verify the trip
5. ✅ User receives: "Trip verified" notification

#### **Scenario 2: Withdrawal Approval**
1. Login as user
2. Request withdrawal
3. Login as admin
4. Approve withdrawal
5. ✅ User receives: "Withdrawal approved" notification

#### **Scenario 3: Payment Deposit**
1. Login as user
2. Go to Wallet → Deposit
3. Complete VNPay payment
4. ✅ User receives: "Payment completed" notification

---

## 🔍 Debugging Notifications

### **Check if FCM Token is Saved**
```sql
SELECT * FROM notification_service_db.device_tokens 
WHERE device_type = 'WEB' 
ORDER BY created_at DESC 
LIMIT 5;
```

### **Check Backend Logs**
```bash
docker logs notification_service_app --tail 100 --follow
```

Look for:
- `📨 Received event: <event_name>`
- `✅ Notification sent for event: <event_name> to user: <userId>`

### **Check RabbitMQ**
```bash
docker exec ccm_rabbitmq rabbitmqctl list_queues
```

Should see queues like:
- `notification_service_trip.verified`
- `notification_service_payment.completed`
- etc.

---

## 🎨 Notification Display

### **Foreground (App Open)**
- Toast notification (top-right)
- Auto-dismiss after 5 seconds
- Shows title + body

### **Background (App Closed)**
- Native browser notification
- Click to open app
- Persistent until dismissed

### **In-App Notification Bell**
- Red badge with count
- Dropdown list
- Mark as read
- Realtime updates via WebSocket

---

## 🚀 Production Checklist

- ✅ Firebase project created
- ✅ Web app registered
- ✅ Service account JSON configured (backend)
- ✅ VAPID key configured (frontend)
- ✅ All 9 event consumers running
- ✅ RabbitMQ exchange `ccm.events` created
- ✅ Device tokens being saved
- ✅ WebSocket gateway running (port 3010)
- ✅ Nginx proxy configured for `/api/notifications`

---

## 📊 Monitoring

### **Check Notification Stats**
```sql
-- Total notifications sent
SELECT COUNT(*) FROM notification_service_db.notifications;

-- Notifications by type
SELECT type, COUNT(*) 
FROM notification_service_db.notifications 
GROUP BY type;

-- Unread notifications
SELECT COUNT(*) 
FROM notification_service_db.notifications 
WHERE is_read = FALSE;

-- Active devices
SELECT COUNT(*) 
FROM notification_service_db.device_tokens 
WHERE is_active = TRUE;
```

---

## 🎉 Ready to Use!

Your notification system is fully operational! Users will automatically receive push notifications for all important events in the Carbon Credit Marketplace.

**Next Steps:**
1. Test each scenario above
2. Monitor backend logs
3. Check user feedback
4. Adjust notification templates if needed

Happy notifying! 🔔✨
