package com.listingservice.dtos.responses;

import com.listingservice.enums.BidStatus;
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
public class BidResponse {
    private UUID id;
    private UUID listingId;

    private UUID bidderId;
    private String bidderName;

    private Double bidAmount;
    private BidStatus status;
    private String statusDisplay;
    private Boolean isWinning;

    private Instant createdAt;
    private Instant updatedAt;
    private String notes;

    private Boolean isCurrentUser;  // Is this bid from current user?
    private String timeAgo;
    private String message;  // Response message for bid placement
}
