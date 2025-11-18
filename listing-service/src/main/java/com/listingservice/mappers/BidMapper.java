package com.listingservice.mappers;

import com.listingservice.dtos.requests.PlaceBidRequest;
import com.listingservice.dtos.responses.BidResponse;
import com.listingservice.entities.Bid;
import com.listingservice.entities.Listing;
import com.listingservice.enums.BidStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@Slf4j
public class BidMapper {

    public Bid toEntity(PlaceBidRequest request, Listing listing) {
        log.debug("Converting PlaceBidRequest to Bid entity");

        return Bid.builder()
                .listing(listing)
                .bidderId(request.getBidderId())
                .bidAmount(request.getBidAmount())
                .status(BidStatus.ACTIVE)
                .isWinning(false)
                .notes(request.getNotes())
                .build();
    }

    public BidResponse toResponse(Bid bid) {
        return toResponse(bid, null);
    }

    public BidResponse toResponse(Bid bid, String currentUserId) {
        if (bid == null) {
            return null;
        }

        log.debug("Converting Bid entity {} to BidResponse", bid.getId());

        // Format time ago
        String timeAgo = formatTimeAgo(bid.getCreatedAt());

        // Check if this is current user's bid
        Boolean isCurrentUser = currentUserId != null &&
                currentUserId.equals(bid.getBidderId());

        return BidResponse.builder()
                .id(bid.getId())
                .listingId(bid.getListing() != null ? bid.getListing().getId() : null)
                .bidderId(bid.getBidderId())
                .bidderName(bid.getBidderName())
                .bidAmount(bid.getBidAmount())
                .status(bid.getStatus())
                .statusDisplay(bid.getStatus() != null ?
                        bid.getStatus().getDisplayName() : null)
                .isWinning(bid.getIsWinning())
                .createdAt(bid.getCreatedAt())
                .updatedAt(bid.getUpdatedAt())
                .notes(bid.getNotes())
                .isCurrentUser(isCurrentUser)
                .timeAgo(timeAgo)
                .build();
    }

    public List<BidResponse> toResponseList(List<Bid> bids) {
        return toResponseList(bids, null);
    }

    /**
     * Convert list of Bids to list of BidResponses with current user context
     */
    public List<BidResponse> toResponseList(List<Bid> bids, String currentUserId) {
        if (bids == null) {
            return List.of();
        }

        return bids.stream()
                .map(bid -> toResponse(bid, currentUserId))
                .collect(Collectors.toList());
    }

    // ==================== HELPER METHODS ====================

    /**
     * Format time ago (e.g., "2 hours ago", "5 minutes ago")
     */
    private String formatTimeAgo(Instant instant) {
        if (instant == null) {
            return "Unknown";
        }

        Duration duration = Duration.between(instant, Instant.now());

        long seconds = duration.getSeconds();

        if (seconds < 60) {
            return "Just now";
        } else if (seconds < 3600) {
            long minutes = seconds / 60;
            return minutes + (minutes == 1 ? " minute ago" : " minutes ago");
        } else if (seconds < 86400) {
            long hours = seconds / 3600;
            return hours + (hours == 1 ? " hour ago" : " hours ago");
        } else {
            long days = seconds / 86400;
            return days + (days == 1 ? " day ago" : " days ago");
        }
    }
}
