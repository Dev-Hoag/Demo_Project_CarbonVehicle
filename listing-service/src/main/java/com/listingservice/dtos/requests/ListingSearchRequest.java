package com.listingservice.dtos.requests;

import com.listingservice.enums.ListingStatus;
import com.listingservice.enums.ListingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingSearchRequest {
    private String keyword;  // Search in title and description

    // Filters
    private UUID sellerId;
    private ListingType listingType;
    private ListingStatus status;

    // Price range
    private Double minPrice;
    private Double maxPrice;

    // CO2 amount range
    private Double minCo2Amount;
    private Double maxCo2Amount;

    // Only verified trips
    private Boolean verifiedOnly;

    // Sorting
    private String sortBy;  // price, created_at, co2_amount, ending_soon
    private String sortDirection; // ASC, DESC
}
