package com.listingservice.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidPlacedResponse {
    private BidResponse bid;
    private ListingResponse listing;
    private Boolean isHighestBid;
    private Double previousHighestBid;
    private String message;
}
