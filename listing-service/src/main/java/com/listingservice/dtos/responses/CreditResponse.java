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
public class CreditResponse {
    private UUID id;
    private UUID userId;
    private Double balance;
    private Double totalEarned;
    private Double totalSpent;
    private Instant createdAt;
    private Instant updatedAt;
}
