package com.tripservice.events;

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
public class VerificationApprovedEvent {
    private String eventType;
    private String verificationId;
    private String tripId;
    private String userId;
    private Double co2SavedKg;
    private Double creditsAwarded;
    private String verifierId;
    private String status;
    private Instant timestamp;
}
