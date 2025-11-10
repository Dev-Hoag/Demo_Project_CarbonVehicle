package com.listingservice.dtos.responses;

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
public class TransactionResponse {
    private UUID id;
    private UUID listingId;

    private UUID buyerId;
    private String buyerName;
    private UUID sellerId;
    private String sellerName;

    private Double co2Amount;
    private Double pricePerKg;
    private Double totalPrice;
    private String transactionType;

    private String status;
    private String paymentStatus;

    private Instant createdAt;
    private String notes;

    private String formattedTotalPrice;
}
