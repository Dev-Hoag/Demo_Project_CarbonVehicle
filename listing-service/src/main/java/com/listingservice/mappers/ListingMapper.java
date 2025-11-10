package com.listingservice.mappers;

import com.listingservice.dtos.requests.CreateListingRequest;
import com.listingservice.dtos.responses.BidResponse;
import com.listingservice.dtos.responses.ListingDetailResponse;
import com.listingservice.dtos.responses.ListingResponse;
import com.listingservice.entities.Bid;
import com.listingservice.entities.Listing;
import com.listingservice.enums.ListingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ListingMapper {
    private final BidMapper bidMapper;

    public Listing toEntity(CreateListingRequest request) {
        log.debug("Converting CreateListingRequest to Listing entity");

        Listing listing = Listing.builder()
                .sellerId(request.getSellerId())
                .title(request.getTitle())
                .description(request.getDescription())
                .co2Amount(request.getCo2Amount())
                .availableAmount(request.getCo2Amount())
                .listingType(request.getListingType())
                .status(ListingStatus.ACTIVE)
                .tripId(request.getTripId())
                .tripVerified(false)
                .viewCount(0L)
                .build();

        // Set pricing based on listing type
        switch (request.getListingType()) {
            case FIXED_PRICE:
                listing.setPricePerKg(request.getPricePerKg());
                break;

            case AUCTION:
                listing.setStartingBid(request.getStartingBid());
                listing.setReservePrice(request.getReservePrice());

                // Set auction times
                listing.setAuctionStartTime(Instant.now());

                if (request.getAuctionEndTime() != null) {
                    listing.setAuctionEndTime(request.getAuctionEndTime());
                } else if (request.getDurationHours() != null) {
                    listing.setAuctionEndTime(
                            Instant.now().plus(Duration.ofHours(request.getDurationHours()))
                    );
                } else {
                    // Default 24 hours
                    listing.setAuctionEndTime(Instant.now().plus(Duration.ofHours(24)));
                }
                break;
        }

        return listing;
    }

    public ListingResponse toResponse(Listing listing) {
        return toResponse(listing, 0);  // Default bidCount = 0
    }

    /**
     * Convert Listing entity to ListingResponse with bid count
     */
    public ListingResponse toResponse(Listing listing, Integer bidCount) {
        if (listing == null) {
            return null;
        }

        log.debug("Converting Listing entity {} to ListingResponse", listing.getId());

        // Calculate time remaining for auctions
        Long timeRemainingSeconds = null;
        String timeRemainingFormatted = null;
        Boolean isAuctionEnded = false;
        Boolean isAuctionStarted = false;

        if (listing.getListingType() != null &&
                listing.getListingType().name().equals("AUCTION") &&
                listing.getAuctionEndTime() != null) {

            Instant now = Instant.now();
            isAuctionStarted = listing.getAuctionStartTime() != null &&
                    now.isAfter(listing.getAuctionStartTime());
            isAuctionEnded = now.isAfter(listing.getAuctionEndTime());

            if (!isAuctionEnded) {
                Duration duration = Duration.between(now, listing.getAuctionEndTime());
                timeRemainingSeconds = duration.getSeconds();
                timeRemainingFormatted = formatDuration(duration);
            }
        }

        // Calculate total price for fixed price listings
        Double totalPrice = null;
        if (listing.getPricePerKg() != null && listing.getCo2Amount() != null) {
            totalPrice = listing.getPricePerKg() * listing.getCo2Amount();
        }

        return ListingResponse.builder()
                .id(listing.getId())
                .sellerId(listing.getSellerId())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .co2Amount(listing.getCo2Amount())
                .availableAmount(listing.getAvailableAmount())
                .listingType(listing.getListingType())
                .listingTypeDisplay(listing.getListingType() != null ?
                        listing.getListingType().getDisplayName() : null)
                .status(listing.getStatus())
                .statusDisplay(listing.getStatus() != null ?
                        listing.getStatus().getDisplayName() : null)
                .pricePerKg(listing.getPricePerKg())
                .startingBid(listing.getStartingBid())
                .currentBid(null)  // Will be set from highest bid if needed
                .reservePrice(listing.getReservePrice())
                .totalPrice(totalPrice)
                .auctionStartTime(listing.getAuctionStartTime())
                .auctionEndTime(listing.getAuctionEndTime())
                .winnerId(listing.getWinnerId())
                .timeRemainingSeconds(timeRemainingSeconds)
                .timeRemainingFormatted(timeRemainingFormatted)
                .isAuctionEnded(isAuctionEnded)
                .isAuctionStarted(isAuctionStarted)
                .tripId(listing.getTripId())
                .tripVerified(listing.getTripVerified())
                .viewCount(listing.getViewCount())
                .bidCount(bidCount)
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .expiresAt(listing.getExpiresAt())
                .soldAt(listing.getSoldAt())
                .canBid(listing.canPlaceBid())
                .canBuy(canBuy(listing))
                .isActive(listing.isActive())
                .isExpired(isExpired(listing))
                .isSold(listing.getStatus() == ListingStatus.SOLD)
                .build();
    }

    /**
     * Convert Listing to detailed response with bids
     */
    public ListingDetailResponse toDetailResponse(Listing listing, List<Bid> allBids) {
        if (listing == null) {
            return null;
        }

        log.debug("Converting Listing {} to ListingDetailResponse", listing.getId());

        // Filter bids for this listing
        List<Bid> listingBids = allBids != null ?
                allBids.stream()
                        .filter(bid -> bid.getListing() != null &&
                                bid.getListing().getId().equals(listing.getId()))
                        .collect(Collectors.toList()) :
                List.of();

        // Get recent bids (top 10)
        List<Bid> recentBids = listingBids.stream()
                .limit(10)
                .collect(Collectors.toList());

        // Convert listing with bid count
        ListingResponse listingResponse = toResponse(listing, listingBids.size());

        // Set current bid if available
        if (!listingBids.isEmpty()) {
            Double highestBidAmount = listingBids.stream()
                    .mapToDouble(Bid::getBidAmount)
                    .max()
                    .orElse(0.0);
            listingResponse.setCurrentBid(highestBidAmount);
        }

        // Convert bids
        List<BidResponse> bidResponses = recentBids.stream()
                .map(bidMapper::toResponse)
                .collect(Collectors.toList());

        // Find highest bid
        BidResponse highestBid = bidResponses.isEmpty() ? null : bidResponses.get(0);

        // Calculate statistics
        Integer totalBids = listingBids.size();
        Double averageBidAmount = calculateAverageBidAmount(listingBids);
        Integer uniqueBidders = calculateUniqueBidders(listingBids);

        return ListingDetailResponse.builder()
                .listing(listingResponse)
                .recentBids(bidResponses)
                .highestBid(highestBid)
                .totalBids(totalBids)
                .averageBidAmount(averageBidAmount)
                .uniqueBidders(uniqueBidders)
                .build();
    }

    /**
     * Convert list of Listings to list of ListingResponses
     */
    public List<ListingResponse> toResponseList(List<Listing> listings) {
        if (listings == null) {
            return List.of();
        }

        return listings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ==================== HELPER METHODS ====================

    /**
     * Format duration to human-readable string
     */
    private String formatDuration(Duration duration) {
        if (duration == null || duration.isNegative()) {
            return "Ended";
        }

        long days = duration.toDays();
        long hours = duration.toHoursPart();
        long minutes = duration.toMinutesPart();

        if (days > 0) {
            return String.format("%dd %dh", days, hours);
        } else if (hours > 0) {
            return String.format("%dh %dm", hours, minutes);
        } else {
            return String.format("%dm", minutes);
        }
    }

    /**
     * Check if listing can be bought
     */
    private boolean canBuy(Listing listing) {
        return listing.getStatus() == ListingStatus.ACTIVE &&
                listing.getListingType() != null &&
                listing.getListingType().name().equals("FIXED_PRICE") &&
                listing.getAvailableAmount() != null &&
                listing.getAvailableAmount() > 0;
    }

    /**
     * Check if listing is expired
     */
    private boolean isExpired(Listing listing) {
        return listing.getStatus() == ListingStatus.EXPIRED ||
                (listing.getExpiresAt() != null && Instant.now().isAfter(listing.getExpiresAt()));
    }

    /**
     * Calculate average bid amount from list of bids
     */
    private Double calculateAverageBidAmount(List<Bid> bids) {
        if (bids == null || bids.isEmpty()) {
            return null;
        }

        return bids.stream()
                .mapToDouble(Bid::getBidAmount)
                .average()
                .orElse(0.0);
    }

    /**
     * Calculate unique bidders from list of bids
     */
    private Integer calculateUniqueBidders(List<Bid> bids) {
        if (bids == null || bids.isEmpty()) {
            return 0;
        }

        return (int) bids.stream()
                .map(Bid::getBidderId)
                .distinct()
                .count();
    }
}
