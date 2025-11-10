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
public class PurchaseRequest {
    @NotNull(message = "Buyer ID is required")
    private UUID buyerId;

    @NotNull(message = "Amount to purchase is required")
    @DecimalMin(value = "0.1", message = "Amount must be at least 0.1 kg")
    private Double amount;  // kg of CO2 to purchase

    private String notes;
}
