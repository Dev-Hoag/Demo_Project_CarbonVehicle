# 🎯 Auction Feature Implementation Guide

## 📋 Overview

Feature đấu giá (Auction) cho phép EV Owner bán tín chỉ carbon theo hình thức đấu giá thay vì giá cố định. Buyers cạnh tranh đặt giá, người đặt giá cao nhất sẽ thắng khi hết thời gian.

---

## ✅ Database Schema - ĐÃ CÓ SẴN!

File: `listing-service/src/main/java/com/listingservice/entities/Listing.java`

```java
// Các fields cho auction đã có sẵn:
private ListingType listingType;      // FIXED_PRICE | AUCTION
private Double startingBid;           // Giá khởi điểm
private Double reservePrice;          // Giá sàn (minimum acceptable)
private Instant auctionStartTime;     // Thời gian bắt đầu
private Instant auctionEndTime;       // Thời gian kết thúc
private UUID winnerId;                // Winner của auction
```

**Cần thêm Bid entity**:
```java
@Entity
public class Bid {
    @Id
    @GeneratedValue
    private UUID id;
    
    @Column(name = "listing_id", nullable = false)
    private UUID listingId;
    
    @Column(name = "bidder_id", nullable = false)
    private UUID bidderId;
    
    @Column(name = "bid_amount", nullable = false)
    private Double bidAmount;
    
    @Column(name = "bid_time", nullable = false)
    private Instant bidTime;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private BidStatus status; // ACTIVE, OUTBID, WON, LOST
}
```

---

## 🔄 Auction Flow

### **1. EV Owner tạo Auction Listing**

```
POST /api/listings/auction
{
  "title": "100kg CO₂ Credits - Verified Trip",
  "description": "High quality carbon credits from EV trips",
  "co2Amount": 100,
  "listingType": "AUCTION",
  "startingBid": 4500,        // VND per kg
  "reservePrice": 5000,       // Không bán nếu giá < 5000
  "auctionDurationHours": 72  // 3 days
}

Response:
{
  "id": "listing-uuid",
  "auctionStartTime": "2025-11-17T15:00:00Z",
  "auctionEndTime": "2025-11-20T15:00:00Z",
  "status": "ACTIVE"
}
```

**Backend Logic**:
```java
@PostMapping("/auction")
public ResponseEntity<Listing> createAuction(@RequestBody AuctionRequest req) {
    Listing listing = Listing.builder()
        .sellerId(getCurrentUserId())
        .listingType(ListingType.AUCTION)
        .startingBid(req.getStartingBid())
        .reservePrice(req.getReservePrice())
        .auctionStartTime(Instant.now())
        .auctionEndTime(Instant.now().plus(req.getDurationHours(), ChronoUnit.HOURS))
        .status(ListingStatus.ACTIVE)
        .build();
    
    return ResponseEntity.ok(listingRepository.save(listing));
}
```

---

### **2. Buyers xem Auction Listings**

```
GET /api/listings?type=AUCTION&status=ACTIVE

Response:
[
  {
    "id": "listing-uuid",
    "title": "100kg CO₂ Credits",
    "currentBid": 4800,           // Highest bid hiện tại
    "numberOfBids": 5,
    "timeRemaining": "2d 5h 30m",
    "auctionEndTime": "2025-11-20T15:00:00Z",
    "status": "ACTIVE"
  }
]
```

**Frontend Display**:
```tsx
// Marketplace.tsx - Auction Card
<Card variant="outlined" sx={{ border: '2px solid #ff9800' }}>
  <CardContent>
    <Chip label="🔨 AUCTION" color="warning" />
    <Typography variant="h6">{listing.title}</Typography>
    
    <Box>
      <Typography color="primary" variant="h5">
        Current Bid: {currentBid.toLocaleString('vi-VN')} VND/kg
      </Typography>
      <Typography variant="body2">
        {numberOfBids} bids | Ends in {timeRemaining}
      </Typography>
    </Box>
    
    <Button variant="contained" onClick={handlePlaceBid}>
      Place Bid
    </Button>
  </CardContent>
</Card>
```

---

### **3. Buyers đặt giá (Place Bid)**

```
POST /api/listings/{listingId}/bid
{
  "bidAmount": 4900  // VND per kg
}

Response:
{
  "bidId": "bid-uuid",
  "bidAmount": 4900,
  "status": "ACTIVE",
  "isCurrentHighestBid": true,
  "message": "Bid placed successfully! You are currently the highest bidder."
}
```

**Backend Logic**:
```java
@PostMapping("/{listingId}/bid")
public ResponseEntity<BidResponse> placeBid(
    @PathVariable UUID listingId,
    @RequestBody BidRequest request
) {
    Listing listing = listingRepository.findById(listingId)
        .orElseThrow(() -> new NotFoundException("Listing not found"));
    
    // Validation
    if (listing.getStatus() != ListingStatus.ACTIVE) {
        throw new BadRequestException("Auction is not active");
    }
    
    if (Instant.now().isAfter(listing.getAuctionEndTime())) {
        throw new BadRequestException("Auction has ended");
    }
    
    // Get current highest bid
    Bid currentHighest = bidRepository
        .findTopByListingIdOrderByBidAmountDesc(listingId)
        .orElse(null);
    
    Double minimumBid = currentHighest != null 
        ? currentHighest.getBidAmount() + 100  // Min increment 100 VND
        : listing.getStartingBid();
    
    if (request.getBidAmount() < minimumBid) {
        throw new BadRequestException(
            "Bid must be at least " + minimumBid + " VND"
        );
    }
    
    // Mark previous highest bid as OUTBID
    if (currentHighest != null) {
        currentHighest.setStatus(BidStatus.OUTBID);
        bidRepository.save(currentHighest);
        
        // Send notification to previous bidder
        notificationService.sendOutbidNotification(
            currentHighest.getBidderId(),
            listingId
        );
    }
    
    // Create new bid
    Bid newBid = Bid.builder()
        .listingId(listingId)
        .bidderId(getCurrentUserId())
        .bidAmount(request.getBidAmount())
        .bidTime(Instant.now())
        .status(BidStatus.ACTIVE)
        .build();
    
    bidRepository.save(newBid);
    
    return ResponseEntity.ok(BidResponse.builder()
        .bidId(newBid.getId())
        .isCurrentHighestBid(true)
        .message("Bid placed successfully!")
        .build());
}
```

---

### **4. Hệ thống tự động close Auction**

**Cron Job** (chạy mỗi phút):
```java
@Scheduled(cron = "0 * * * * *")  // Every minute
public void closeExpiredAuctions() {
    List<Listing> expiredAuctions = listingRepository
        .findByListingTypeAndStatusAndAuctionEndTimeBefore(
            ListingType.AUCTION,
            ListingStatus.ACTIVE,
            Instant.now()
        );
    
    for (Listing auction : expiredAuctions) {
        closeAuction(auction);
    }
}

private void closeAuction(Listing auction) {
    // Get highest bid
    Optional<Bid> highestBid = bidRepository
        .findTopByListingIdOrderByBidAmountDesc(auction.getId());
    
    if (highestBid.isEmpty()) {
        // No bids - mark as CANCELLED
        auction.setStatus(ListingStatus.CANCELLED);
        listingRepository.save(auction);
        
        notificationService.sendAuctionNoBidsNotification(
            auction.getSellerId(),
            auction.getId()
        );
        return;
    }
    
    Bid winningBid = highestBid.get();
    
    // Check reserve price
    if (winningBid.getBidAmount() < auction.getReservePrice()) {
        // Bid too low - cancel auction
        auction.setStatus(ListingStatus.CANCELLED);
        winningBid.setStatus(BidStatus.LOST);
        
        notificationService.sendReservePriceNotMetNotification(
            auction.getSellerId(),
            auction.getId()
        );
    } else {
        // Winner found!
        auction.setWinnerId(winningBid.getBidderId());
        auction.setStatus(ListingStatus.PENDING_PAYMENT);
        winningBid.setStatus(BidStatus.WON);
        
        // Mark other bids as LOST
        bidRepository.findAllByListingId(auction.getId())
            .stream()
            .filter(b -> !b.getId().equals(winningBid.getId()))
            .forEach(b -> {
                b.setStatus(BidStatus.LOST);
                bidRepository.save(b);
            });
        
        // Send notifications
        notificationService.sendAuctionWonNotification(
            winningBid.getBidderId(),
            auction.getId()
        );
        
        notificationService.sendAuctionSoldNotification(
            auction.getSellerId(),
            auction.getId(),
            winningBid.getBidAmount()
        );
    }
    
    listingRepository.save(auction);
    bidRepository.save(winningBid);
}
```

---

### **5. Winner thanh toán**

```
Flow tương tự purchase thông thường:

Winner click "Pay Now"
   ↓
Redirect to VNPay with finalPrice = winningBid * co2Amount
   ↓
Payment success → Create Transaction
   ↓
Transfer credits → Update wallet
   ↓
Auto-generate Certificate
   ↓
Listing status = COMPLETED
```

**Backend**:
```java
@PostMapping("/auctions/{listingId}/checkout")
public ResponseEntity<PaymentResponse> checkoutAuction(@PathVariable UUID listingId) {
    Listing auction = listingRepository.findById(listingId)
        .orElseThrow(() -> new NotFoundException("Auction not found"));
    
    // Verify winner
    if (!auction.getWinnerId().equals(getCurrentUserId())) {
        throw new ForbiddenException("Only the winner can checkout");
    }
    
    if (auction.getStatus() != ListingStatus.PENDING_PAYMENT) {
        throw new BadRequestException("Auction not in payment state");
    }
    
    // Get winning bid amount
    Bid winningBid = bidRepository
        .findTopByListingIdOrderByBidAmountDesc(listingId)
        .orElseThrow();
    
    // Create transaction
    Transaction transaction = transactionService.createAuctionTransaction(
        auction,
        winningBid.getBidAmount()
    );
    
    // Generate VNPay payment URL
    String paymentUrl = vnpayService.createPaymentUrl(
        transaction.getId(),
        winningBid.getBidAmount() * auction.getCo2Amount(),
        "Auction payment for " + auction.getTitle()
    );
    
    return ResponseEntity.ok(PaymentResponse.builder()
        .paymentUrl(paymentUrl)
        .build());
}
```

---

## 📱 Frontend Components

### **1. Auction Listing Card**
```tsx
// components/AuctionCard.tsx
export const AuctionCard: React.FC<{ listing: AuctionListing }> = ({ listing }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(listing.auctionEndTime);
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Ended');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [listing.auctionEndTime]);
  
  return (
    <Card sx={{ border: '2px solid #ff9800' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip label="🔨 AUCTION" color="warning" size="small" />
          <Typography variant="caption" color="error">
            ⏰ {timeRemaining}
          </Typography>
        </Box>
        
        <Typography variant="h6" sx={{ mt: 1 }}>
          {listing.title}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current Bid
          </Typography>
          <Typography variant="h5" color="primary" fontWeight={600}>
            {listing.currentBid?.toLocaleString('vi-VN') || listing.startingBid.toLocaleString('vi-VN')} VND/kg
          </Typography>
          <Typography variant="caption">
            {listing.numberOfBids} bids
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => handlePlaceBid(listing.id)}
        >
          Place Bid
        </Button>
      </CardContent>
    </Card>
  );
};
```

### **2. Bid Dialog**
```tsx
// components/BidDialog.tsx
export const BidDialog: React.FC<Props> = ({ open, onClose, listing }) => {
  const [bidAmount, setBidAmount] = useState(listing.minimumBid);
  
  const handlePlaceBid = async () => {
    try {
      await listingApi.placeBid(listing.id, bidAmount);
      toast.success('Bid placed successfully!');
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Place Your Bid</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Current highest bid: {listing.currentBid?.toLocaleString('vi-VN')} VND/kg
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Minimum bid: {listing.minimumBid.toLocaleString('vi-VN')} VND/kg
        </Typography>
        
        <TextField
          fullWidth
          label="Your Bid (VND/kg)"
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          sx={{ mt: 2 }}
          inputProps={{ min: listing.minimumBid, step: 100 }}
        />
        
        <Typography variant="h6" sx={{ mt: 2 }}>
          Total: {(bidAmount * listing.co2Amount).toLocaleString('vi-VN')} VND
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handlePlaceBid}>
          Place Bid
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### **3. My Bids Page**
```tsx
// pages/MyBids.tsx
export const MyBidsPage: React.FC = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  
  useEffect(() => {
    loadMyBids();
  }, []);
  
  const loadMyBids = async () => {
    const response = await bidApi.getMyBids();
    setBids(response.data);
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Bids
      </Typography>
      
      <Tabs>
        <Tab label="Active Bids" />
        <Tab label="Won" />
        <Tab label="Lost" />
        <Tab label="Outbid" />
      </Tabs>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Auction</TableCell>
            <TableCell>My Bid</TableCell>
            <TableCell>Current High</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Time Left</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bids.map(bid => (
            <TableRow key={bid.id}>
              <TableCell>{bid.listingTitle}</TableCell>
              <TableCell>{bid.bidAmount.toLocaleString('vi-VN')}</TableCell>
              <TableCell>{bid.currentHighestBid.toLocaleString('vi-VN')}</TableCell>
              <TableCell>
                <Chip 
                  label={bid.status} 
                  color={bid.status === 'ACTIVE' ? 'success' : 'default'} 
                />
              </TableCell>
              <TableCell>{bid.timeRemaining}</TableCell>
              <TableCell>
                {bid.status === 'WON' && (
                  <Button variant="contained" size="small">
                    Pay Now
                  </Button>
                )}
                {bid.status === 'OUTBID' && (
                  <Button size="small">
                    Bid Again
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
```

---

## 🔔 Notification System

### **RabbitMQ Events**:
```typescript
// Events to publish
- bid.placed         // Khi có bid mới
- bid.outbid         // Khi bị người khác bid cao hơn
- auction.won        // Khi thắng đấu giá
- auction.lost       // Khi thua đấu giá
- auction.ended      // Khi auction kết thúc
```

### **Email Templates**:
```
1. Outbid Notification:
   Subject: "You've been outbid on [Listing Title]"
   Body: "Someone placed a higher bid. Current bid: XXX VND"
   
2. Auction Won:
   Subject: "Congratulations! You won the auction"
   Body: "Please complete payment within 24 hours"
   
3. Auction Sold (to seller):
   Subject: "Your auction ended successfully"
   Body: "Final price: XXX VND. Waiting for buyer payment"
```

---

## ⚙️ Configuration

### **application.properties** (Listing Service):
```properties
# Auction settings
auction.min.bid.increment=100
auction.default.duration.hours=72
auction.payment.deadline.hours=24
auction.cron.close.schedule=0 * * * * *
```

---

## 🎯 Ai duyệt Auction?

### **Câu trả lời: TỰ ĐỘNG!**

| Giai đoạn | Ai xử lý | Cách thức |
|-----------|----------|-----------|
| **Tạo auction** | EV Owner | Manual - tạo listing |
| **Đặt giá (bid)** | Buyers | Manual - place bid |
| **Xác định winner** | **Hệ thống** | **Auto - cron job** |
| **Close auction** | **Hệ thống** | **Auto - khi hết thời gian** |
| **Thanh toán** | Winner | Manual - VNPay |
| **Transfer credits** | **Hệ thống** | **Auto - sau payment success** |
| **Tạo certificate** | **Hệ thống** | **Auto - RabbitMQ event** |

**KHÔNG CÓ AI DUYỆT THỦ CÔNG!** Toàn bộ auction workflow là tự động.

---

## 📊 Database Tables Summary

```sql
-- Listing table (đã có sẵn)
ALTER TABLE listings ADD COLUMN listing_type VARCHAR(20);
ALTER TABLE listings ADD COLUMN starting_bid DECIMAL(10,2);
ALTER TABLE listings ADD COLUMN reserve_price DECIMAL(10,2);
ALTER TABLE listings ADD COLUMN auction_start_time TIMESTAMP;
ALTER TABLE listings ADD COLUMN auction_end_time TIMESTAMP;
ALTER TABLE listings ADD COLUMN winner_id UUID;

-- Bid table (cần tạo mới)
CREATE TABLE bids (
    id UUID PRIMARY KEY,
    listing_id UUID NOT NULL,
    bidder_id UUID NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    bid_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id)
);

CREATE INDEX idx_bids_listing ON bids(listing_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_bids_amount ON bids(listing_id, bid_amount DESC);
```

---

## 🚀 Implementation Priority

### **Phase 1: MVP** (3 days)
- ✅ Listing entity có sẵn auction fields
- ☐ Create Bid entity
- ☐ API: Create auction listing
- ☐ API: Place bid
- ☐ API: Get auction details with current bid
- ☐ Cron job: Close expired auctions
- ☐ Frontend: Auction listing card
- ☐ Frontend: Bid dialog

### **Phase 2: Enhancement** (2 days)
- ☐ My Bids page
- ☐ Real-time bid updates (WebSocket)
- ☐ Email notifications
- ☐ Bid history view
- ☐ Auto-bid feature (optional)

### **Phase 3: Polish** (1 day)
- ☐ Auction analytics
- ☐ Popular auctions section
- ☐ Search/filter auctions
- ☐ Mobile optimization

---

## 🎉 Kết luận

**Auction feature KHÔNG CẦN DUYỆT THỦ CÔNG:**
- ✅ Hệ thống tự động close auction khi hết thời gian
- ✅ Tự động xác định winner = highest bidder
- ✅ Tự động chuyển sang payment nếu đạt reserve price
- ✅ Tự động cancel nếu không có bid hoặc không đạt reserve price

**Flow hoàn toàn tự động** giống như eBay, Shopee auction - không cần CVA hay Admin can thiệp!

Bạn muốn implement auction feature này không? Estimate: **5-6 days** cho full implementation! 🚀
