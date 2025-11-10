package com.listingservice.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionEndedResponse {
    private UUID listingId;
    private UUID winnerId;
    private String winnerName;
    private Double winningBid;
    private Integer totalBids;
    private Boolean hasWinner;
    private String message;
}
