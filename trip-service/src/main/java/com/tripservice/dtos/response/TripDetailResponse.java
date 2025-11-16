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
public class TripDetailResponse {
    // Basic info
    private UUID id;
    private UUID userId;
    private UUID vehicleId;

    // Trip details
    private Instant startTime;
    private Instant endTime;
    private Long durationMinutes;

    private Double distanceKm;
    private Double averageSpeed;

    // CO2 info
    private Double co2Reduced;
    private String co2Unit;              // "kg" or "ton"
    private String formattedCO2;         // "10.5 kg"

    // Status
    private TripStatus status;
    private String statusDisplay;        // "Calculated"
    private String verificationStatus;

    // Additional info
    private String startLocation;
    private String endLocation;
    private String gpsCoordinates;
    private Double batteryUsed;
    private String vehicleType;

    // Metadata
    private Instant createdAt;
    private Instant updatedAt;

    // Helper flags
    private Boolean canSubmit;           // Can submit for verification?
    private Boolean isFinal;             // Is status final?
}
