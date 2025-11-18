package com.listingservice.dtos.requests;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceBidRequest {
    @NotNull(message = "Bidder ID is required")
    private UUID bidderId;

    private String bidderName;

    @NotNull(message = "Bid amount is required")
    @DecimalMin(value = "0.1", message = "Bid amount must be at least 0.1")
    private Double bidAmount;

    private String notes;
}
