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
public class TripEvent {
    private String eventType;
    private UUID tripId;
    private UUID userId;
    private Double carbonCredits;
    private Double distanceKm;
    private String tripDate;
    private String status;
    private Instant timestamp;
    
    public static TripEvent tripVerified(UUID tripId, UUID userId, Double carbonCredits, Double distanceKm, String tripDate) {
        return TripEvent.builder()
                .eventType("trip.verified")
                .tripId(tripId)
                .userId(userId)
                .carbonCredits(carbonCredits)
                .distanceKm(distanceKm)
                .tripDate(tripDate)
                .status("VERIFIED")
                .timestamp(Instant.now())
                .build();
    }
}
