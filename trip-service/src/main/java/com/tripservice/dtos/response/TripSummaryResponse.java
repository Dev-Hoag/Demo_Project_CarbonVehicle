package com.tripservice.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripSummaryResponse {
    private Long totalTrips;
    private Double totalDistanceKm;
    private Double totalCO2Reduced;
    private Long verifiedTrips;
    private Long pendingTrips;
}
