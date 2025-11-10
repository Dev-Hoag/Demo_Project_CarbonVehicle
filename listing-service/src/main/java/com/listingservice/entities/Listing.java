package com.listingservice.entities;

import com.listingservice.enums.ListingStatus;
import com.listingservice.enums.ListingType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Listing {
    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "co2_amount", nullable = false)
    private Double co2Amount;  // kg of CO2 credits

    @Column(name = "available_amount", nullable = false)
    private Double availableAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "listing_type", nullable = false, length = 20)
    private ListingType listingType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ListingStatus status;

    @Column(name = "price_per_kg")
    private Double pricePerKg; // Dành cho loại niêm yết giá cố định

    @Column(name = "starting_bid")
    private Double startingBid; // Dành cho loại niêm yết đấu giá

    @Column(name = "reserve_price")
    private Double reservePrice; // Giá sàn chấp nhận được

    @Column(name = "auction_start_time")
    private Instant auctionStartTime;

    @Column(name = "auction_end_time")
    private Instant auctionEndTime;

    @Column(name = "winner_id")
    private UUID winnerId;

    @Column(name = "trip_id")
    private UUID tripId;

    @Column(name = "trip_verified", nullable = false)
    private Boolean tripVerified = false;

    @Column(name = "view_count")
    private Long viewCount = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "sold_at")
    private Instant soldAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();

        if (status == null) {
            status = ListingStatus.ACTIVE;
        }

        if (availableAmount == null) {
            availableAmount = co2Amount;
        }

        if (viewCount == null) {
            viewCount = 0L;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public boolean isActive() {
        return status == ListingStatus.ACTIVE &&
                (expiresAt == null || Instant.now().isBefore(expiresAt));
    }

    public boolean isAuctionEnded() {
        return listingType == ListingType.AUCTION &&
                auctionEndTime != null &&
                Instant.now().isAfter(auctionEndTime);
    }

    public boolean canPlaceBid() {
        return listingType == ListingType.AUCTION &&
                status == ListingStatus.ACTIVE &&
                !isAuctionEnded();
    }

    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }
}
