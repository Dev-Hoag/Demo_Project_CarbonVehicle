package com.listingservice.services;

import com.listingservice.entities.Bid;
import com.listingservice.entities.Listing;
import com.listingservice.enums.BidStatus;
import com.listingservice.enums.ListingStatus;
import com.listingservice.enums.ListingType;
import com.listingservice.exceptions.ListingNotFoundException;
import com.listingservice.exceptions.InvalidBidException;
import com.listingservice.exceptions.UnauthorizedActionException;
import com.listingservice.repositories.BidRepository;
import com.listingservice.repositories.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionService {
    private final ListingRepository listingRepository;
    private final BidRepository bidRepository;
    
    private static final double MIN_BID_INCREMENT = 100.0; // 100 VND

    @Transactional
    public Bid placeBid(UUID listingId, UUID bidderId, String bidderName, Double bidAmount) {
        // Find listing
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException("Listing not found"));

        // Validate auction
        if (listing.getListingType() != ListingType.AUCTION) {
            throw new InvalidBidException("This listing is not an auction");
        }

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new InvalidBidException("Auction is not active");
        }

        if (Instant.now().isAfter(listing.getAuctionEndTime())) {
            throw new InvalidBidException("Auction has ended");
        }

        if (Instant.now().isBefore(listing.getAuctionStartTime())) {
            throw new InvalidBidException("Auction has not started yet");
        }

        // Check if seller trying to bid on own listing
        if (listing.getSellerId().equals(bidderId)) {
            throw new UnauthorizedActionException("Cannot bid on your own listing");
        }

        // Get current highest bid
        Optional<Bid> currentHighestBidOpt = bidRepository
                .findByListingIdOrderByBidAmountDesc(listingId)
                .stream()
                .findFirst();

        double minimumBid;
        if (currentHighestBidOpt.isPresent()) {
            Bid currentHighestBid = currentHighestBidOpt.get();
            minimumBid = currentHighestBid.getBidAmount() + MIN_BID_INCREMENT;
            
            // Validate new bid amount
            if (bidAmount < minimumBid) {
                throw new InvalidBidException(
                    String.format("Bid must be at least %.2f VND (current bid + %.2f VND)", 
                        minimumBid, MIN_BID_INCREMENT)
                );
            }

            // Mark previous highest bid as OUTBID
            if (currentHighestBid.getStatus() == BidStatus.ACTIVE) {
                currentHighestBid.setStatus(BidStatus.OUTBID);
                currentHighestBid.setIsWinning(false);
                currentHighestBid.setUpdatedAt(Instant.now());
                bidRepository.save(currentHighestBid);
                
                log.info("Marked bid {} as OUTBID", currentHighestBid.getId());
                
                // TODO: Send notification to outbid user
            }
        } else {
            // First bid - must meet starting bid
            minimumBid = listing.getStartingBid();
            if (bidAmount < minimumBid) {
                throw new InvalidBidException(
                    String.format("Bid must be at least %.2f VND (starting bid)", minimumBid)
                );
            }
        }

        // Create new bid
        Bid newBid = Bid.builder()
                .listing(listing)
                .bidderId(bidderId)
                .bidderName(bidderName)
                .bidAmount(bidAmount)
                .status(BidStatus.ACTIVE)
                .isWinning(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Bid savedBid = bidRepository.save(newBid);
        log.info("New bid placed: ID={}, Amount={}, ListingID={}", 
            savedBid.getId(), bidAmount, listingId);

        return savedBid;
    }

    @Transactional
    @Scheduled(cron = "0 * * * * *") // Run every minute
    public void closeExpiredAuctions() {
        log.info("Running scheduled task to close expired auctions...");
        
        List<Listing> expiredAuctions = listingRepository.findExpiredAuctions(Instant.now());
        
        log.info("Found {} expired auctions to close", expiredAuctions.size());
        
        for (Listing auction : expiredAuctions) {
            try {
                closeAuction(auction);
            } catch (Exception e) {
                log.error("Error closing auction {}: {}", auction.getId(), e.getMessage(), e);
            }
        }
    }

    @Transactional
    public void closeAuction(Listing auction) {
        log.info("Closing auction: ID={}", auction.getId());

        // Get highest bid
        Optional<Bid> highestBidOpt = bidRepository
                .findByListingIdOrderByBidAmountDesc(auction.getId())
                .stream()
                .findFirst();

        if (highestBidOpt.isEmpty()) {
            // No bids - cancel auction
            auction.setStatus(ListingStatus.CANCELLED);
            listingRepository.save(auction);
            
            log.info("Auction {} cancelled - no bids received", auction.getId());
            // TODO: Send notification to seller
            return;
        }

        Bid winningBid = highestBidOpt.get();

        // Check reserve price if set
        if (auction.getReservePrice() != null && winningBid.getBidAmount() < auction.getReservePrice()) {
            // Reserve price not met - cancel auction
            auction.setStatus(ListingStatus.CANCELLED);
            winningBid.setStatus(BidStatus.LOST);
            winningBid.setIsWinning(false);
            winningBid.setUpdatedAt(Instant.now());
            
            listingRepository.save(auction);
            bidRepository.save(winningBid);
            
            log.info("Auction {} cancelled - reserve price not met. Highest bid: {}, Reserve: {}", 
                auction.getId(), winningBid.getBidAmount(), auction.getReservePrice());
            
            // TODO: Send notification about reserve price not met
            return;
        }

        // Auction won!
        auction.setWinnerId(winningBid.getBidderId());
        auction.setStatus(ListingStatus.PENDING_PAYMENT);
        auction.setUpdatedAt(Instant.now());
        
        winningBid.setStatus(BidStatus.WON);
        winningBid.setIsWinning(true);
        winningBid.setUpdatedAt(Instant.now());
        
        // Mark all other bids as LOST
        List<Bid> allBids = bidRepository.findByListingIdOrderByBidAmountDesc(auction.getId());
        for (Bid bid : allBids) {
            if (!bid.getId().equals(winningBid.getId()) && bid.getStatus() != BidStatus.LOST) {
                bid.setStatus(BidStatus.LOST);
                bid.setIsWinning(false);
                bid.setUpdatedAt(Instant.now());
                bidRepository.save(bid);
            }
        }
        
        listingRepository.save(auction);
        bidRepository.save(winningBid);
        
        log.info("Auction {} closed successfully. Winner: {}, Amount: {}", 
            auction.getId(), winningBid.getBidderId(), winningBid.getBidAmount());
        
        // TODO: Send notification to winner and seller
    }

    public List<Bid> getBidHistory(UUID listingId) {
        return bidRepository.findByListingIdOrderByBidAmountDesc(listingId);
    }

    public long getBidCount(UUID listingId) {
        return bidRepository.countByListingId(listingId);
    }

    public Optional<Bid> getCurrentHighestBid(UUID listingId) {
        return bidRepository.findByListingIdOrderByBidAmountDesc(listingId)
                .stream()
                .findFirst();
    }

    public List<Bid> getMyBids(UUID bidderId) {
        return bidRepository.findByBidderId(bidderId, org.springframework.data.domain.Pageable.unpaged())
                .getContent();
    }
}
