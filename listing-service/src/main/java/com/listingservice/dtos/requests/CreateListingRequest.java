package com.listingservice.dtos.requests;

import com.listingservice.enums.ListingType;
import jakarta.validation.constraints.*;
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
public class CreateListingRequest {
    @NotNull(message = "Seller ID is required")
    private UUID sellerId;

    @NotBlank(message = "Title is required")
    @Size(min = 10, max = 200, message = "Title must be between 10 and 200 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @NotNull(message = "CO2 amount is required")
    @DecimalMin(value = "0.1", message = "CO2 amount must be at least 0.1 kg")
    @DecimalMax(value = "10000.0", message = "CO2 amount cannot exceed 10000 kg")
    private Double co2Amount;

    @NotNull(message = "Listing type is required")
    private ListingType listingType;

    @DecimalMin(value = "0.1", message = "Price must be at least 0.1")
    private Double pricePerKg;

    @DecimalMin(value = "0.1", message = "Starting bid must be at least 0.1")
    private Double startingBid;

    private Double reservePrice;

    private Instant auctionEndTime;

    private UUID tripId;

    private Integer durationHours;
}
