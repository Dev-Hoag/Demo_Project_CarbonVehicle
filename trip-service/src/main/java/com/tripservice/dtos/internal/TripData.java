package com.tripservice.dtos.internal;

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
public class TripData {
    private UUID vehicleId;
    private Instant startTime;
    private Instant endTime;
    private Double distanceKm;
    private String vehicleType;

    private String gpsCoordinates;       // JSON string
    private Double averageSpeed;         // km/h
    private Double batteryUsed;          // kWh
    private String startLocation;
    private String endLocation;

    private String uploadSource;
}
