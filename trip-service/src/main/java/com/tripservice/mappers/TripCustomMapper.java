package com.tripservice.mappers;

import com.tripservice.constants.TripStatus;
import com.tripservice.dtos.internal.TripData;
import com.tripservice.dtos.response.TripDetailResponse;
import com.tripservice.dtos.response.TripResponse;
import com.tripservice.entities.Trip;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TripCustomMapper {
    public Trip convertToEntity(TripData tripData, UUID userId) {
        return Trip.builder()
                .userId(userId)
                .vehicleId(tripData.getVehicleId())
                .vehicleType(tripData.getVehicleType())
                .startTime(tripData.getStartTime())
                .endTime(tripData.getEndTime())
                .distanceKm(tripData.getDistanceKm())
                .averageSpeed(tripData.getAverageSpeed())
                .batteryUsed(tripData.getBatteryUsed())
                .startLocation(tripData.getStartLocation())
                .endLocation(tripData.getEndLocation())
                .gpsCoordinates(tripData.getGpsCoordinates())
                .status(TripStatus.PENDING)
                .verificationStatus("NOT_SUBMITTED")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    public TripResponse convertToResponse(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .userId(trip.getUserId())
                .vehicleId(trip.getVehicleId())
                .startTime(trip.getStartTime())
                .endTime(trip.getEndTime())
                .distanceKm(trip.getDistanceKm())
                .co2Reduced(trip.getCo2Reduced())
                .status(trip.getStatus())
                .verificationStatus(trip.getVerificationStatus())
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .build();
    }

    /**
     * Convert Trip Entity → TripDetailResponse (detailed)
     */
    public TripDetailResponse convertToDetailResponse(Trip trip) {
        // Calculate duration
        Duration duration = Duration.between(trip.getStartTime(), trip.getEndTime());
        long durationMinutes = duration.toMinutes();
        double durationHours = durationMinutes / 60.0;

        // Calculate average speed
        double averageSpeed = durationHours > 0
                ? trip.getDistanceKm() / durationHours
                : 0.0;

        // Format CO2
        String co2Unit = (trip.getCo2Reduced() != null && trip.getCo2Reduced() >= 1000)
                ? "ton"
                : "kg";

        double co2Display = (trip.getCo2Reduced() != null && trip.getCo2Reduced() >= 1000)
                ? trip.getCo2Reduced() / 1000.0
                : trip.getCo2Reduced();

        String formattedCO2 = trip.getCo2Reduced() != null
                ? String.format("%.2f %s", co2Display, co2Unit)
                : "N/A";

        return TripDetailResponse.builder()
                .id(trip.getId())
                .userId(trip.getUserId())
                .vehicleId(trip.getVehicleId())
                .startTime(trip.getStartTime())
                .endTime(trip.getEndTime())
                .durationMinutes(durationMinutes)
                .distanceKm(trip.getDistanceKm())
                .averageSpeed(Math.round(averageSpeed * 100.0) / 100.0)  // Round to 2 decimals
                .co2Reduced(trip.getCo2Reduced())
                .co2Unit(co2Unit)
                .formattedCO2(formattedCO2)
                .status(trip.getStatus())
                .statusDisplay(trip.getStatus() != null ? trip.getStatus().getDisplayName() : null)
                .verificationStatus(trip.getVerificationStatus())
                .vehicleType(trip.getVehicleType())
                .startLocation(trip.getStartLocation())
                .endLocation(trip.getEndLocation())
                .gpsCoordinates(trip.getGpsCoordinates())
                .batteryUsed(trip.getBatteryUsed())
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .canSubmit(trip.getStatus() != null && trip.getStatus().canSubmitForVerification())
                .isFinal(trip.getStatus() != null && trip.getStatus().isFinal())
                .build();
    }
    /**
     * Convert List<Trip> → List<TripResponse>
     */
    public List<TripResponse> convertToResponseList(List<Trip> trips) {
        return trips.stream()
                .map(this::convertToResponse)
                .toList();
    }
}
