package com.creditservice.dtos.response;

import com.creditservice.enums.TransactionType;
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
public class CreditTransactionResponse {
    private UUID id;
    private UUID userId;
    private TransactionType transactionType;
    private String transactionTypeDisplay;
    private Double amount;
    private Double balanceBefore;
    private Double balanceAfter;
    private UUID relatedUserId;
    private UUID relatedTripId;
    private UUID relatedListingId;
    private String description;
    private Instant createdAt;

    // Computed fields
    private String timeAgo;
    private String formattedAmount;
}
