package com.listingservice.dtos.responses;

import com.listingservice.enums.ListingStatus;
import com.listingservice.enums.ListingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingResponse {
    private UUID id;
    private UUID sellerId;
    private String sellerName;

    private String title;
    private String description;
    private Double co2Amount;
    private Double availableAmount;

    private ListingType listingType;
    private String listingTypeDisplay;
    private ListingStatus status;
    private String statusDisplay;

    private Double pricePerKg;
    private Double startingBid;
    private Double currentBid;
    private Double reservePrice;
    private Double totalPrice;

    private Instant auctionStartTime;
    private Instant auctionEndTime;
    private UUID winnerId;
    private String winnerName;
    private Long timeRemainingSeconds;
    private String timeRemainingFormatted;  // "2h 30m"
    private Boolean isAuctionEnded;
    private Boolean isAuctionStarted;

    private UUID tripId;
    private Boolean tripVerified;

    private Long viewCount;
    private Integer bidCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant expiresAt;
    private Instant soldAt;

    private Boolean canBid;
    private Boolean canBuy;
    private Boolean isActive;
    private Boolean isExpired;
    private Boolean isSold;
}
