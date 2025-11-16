package com.listingservice.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingDetailResponse {
    private ListingResponse listing;
    private List<BidResponse> recentBids;  // Top 10 recent bids
    private BidResponse highestBid;
    private BidResponse userBid;

    private Integer totalBids;
    private Double averageBidAmount;
    private Integer uniqueBidders;
}
