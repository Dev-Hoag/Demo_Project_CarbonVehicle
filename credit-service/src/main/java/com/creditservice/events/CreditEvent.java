package com.creditservice.events;

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
public class CreditEvent {
    private String eventType;
    private UUID userId;
    private Double amount;
    private String source;
    private UUID relatedTripId;
    private String description;
    private Instant timestamp;
    
    public static CreditEvent creditIssued(UUID userId, Double amount, String source, UUID relatedTripId, String description) {
        return CreditEvent.builder()
                .eventType("credit.issued")
                .userId(userId)
                .amount(amount)
                .source(source)
                .relatedTripId(relatedTripId)
                .description(description)
                .timestamp(Instant.now())
                .build();
    }
}
