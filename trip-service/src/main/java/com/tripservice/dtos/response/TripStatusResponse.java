package com.tripservice.dtos.response;

import com.tripservice.constants.TripStatus;
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
public class TripStatusResponse {
    private UUID tripId;
    private TripStatus status;
    private String statusDisplay;
    private String statusDescription;
    private String verificationStatus;
    private String rejectionReason;
    private Boolean canSubmit;
    private Boolean isFinal;
    private Instant verifiedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
