package com.tripservice.dtos.response;

import com.tripservice.constants.TripStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TripResponse {
    private UUID id;
    private UUID userId;
    private Instant startTime;
    private Instant endTime;
    private Double distanceKm;
    private Double co2Reduced;
    private TripStatus status;
    private String verificationStatus;
}
