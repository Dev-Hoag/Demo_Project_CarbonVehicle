package com.listingservice.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingSummaryResponse {
    private Long totalListings;
    private Long activeListings;
    private Long soldListings;
    private Long expiredListings;

    // Type breakdown
    private Long fixedPriceListings;
    private Long auctionListings;

    // CO2 stats
    private Double totalCo2Listed;
    private Double totalCo2Sold;
    private Double totalCo2Available;

    // Price stats
    private Double averagePricePerKg;
    private Double lowestPricePerKg;
    private Double highestPricePerKg;

    // Transaction stats
    private Long totalTransactions;
    private Double totalRevenue;

    // Auction stats (if applicable)
    private Long activeAuctions;
    private Integer totalBids;
    private Double averageBidsPerAuction;
}
