package com.listingservice.dtos.requests;

import com.listingservice.enums.ListingStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class UpdateListingRequest {
    @NotNull(message = "Seller ID is required")
    private UUID sellerId;

    @Size(min = 10, max = 200, message = "Title must be between 10 and 200 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @DecimalMin(value = "0.1", message = "Price must be at least 0.1")
    private Double pricePerKg;

    private ListingStatus status;

    private Instant expiresAt;
}
