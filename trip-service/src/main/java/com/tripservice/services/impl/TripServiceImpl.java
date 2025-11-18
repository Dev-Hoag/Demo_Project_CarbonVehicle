package com.tripservice.services.impl;

import com.tripservice.clients.CreditServiceClient;
import com.tripservice.constants.TripStatus;
import com.tripservice.dtos.internal.TripData;
import com.tripservice.dtos.request.AddCreditRequest;
import com.tripservice.dtos.request.TripUploadRequest;
import com.tripservice.dtos.response.*;
import com.tripservice.entities.Trip;
import com.tripservice.events.EventPublisher;
import com.tripservice.events.TripEvent;
import com.tripservice.exceptions.InvalidCalculationException;
import com.tripservice.exceptions.InvalidTripStateException;
import com.tripservice.exceptions.TripNotFoundException;
import com.tripservice.mappers.TripCustomMapper;
import com.tripservice.repositories.TripRepository;
import com.tripservice.services.CO2CalculationService;
import com.tripservice.services.TripService;
import com.tripservice.services.TripUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.fileupload.FileUploadException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripServiceImpl implements TripService {
    private final TripRepository tripRepository;
    private final CO2CalculationService co2Service;
    private final TripUploadService uploadService;
    private final TripCustomMapper tripCustomMapper;
    private final CreditServiceClient creditServiceClient;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public TripResponse uploadTrip(TripUploadRequest tripUploadRequest) throws FileUploadException {
        log.info("Uploading trip for user: {}", tripUploadRequest.getUserId());

        // 1. Parse file -> List<TripData>
        List<TripData> tripDataList = uploadService.parseFile(tripUploadRequest);

        // 2. Convert TripData -> Trip Entity
        List<Trip> trips = tripDataList.stream()
                .map(tripData -> tripCustomMapper.convertToEntity(tripData, tripUploadRequest.getUserId()))
                .toList();

        // 3. Calculate CO2 for each trip
        for(int i = 0, size = trips.size(); i < size; i++) {
            Trip trip = trips.get(i);
            TripData tripData = tripDataList.get(i);
            CO2CalculationResponse response = co2Service.calculateDetailed(
                    trip.getDistanceKm(),
                    tripData.getVehicleType()
            );

            double co2Reduced = response.getCo2SavedKg();

            trip.setCo2Reduced(co2Reduced);
            trip.setStatus(TripStatus.CALCULATED);
        }

        // 4. Save to database
        List<Trip> savedTrips = tripRepository.saveAll(trips);

        log.info("Successfully uploaded {} trips for user {}",
                savedTrips.size(), tripUploadRequest.getUserId());

        // 5. Return response
        return tripCustomMapper.convertToResponse(savedTrips.get(0));
    }

    @Override
    public TripDetailResponse getTripById(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new TripNotFoundException(id.toString()));

        return tripCustomMapper.convertToDetailResponse(trip);
    }

    @Override
    public Page<TripResponse> getMyTrips(UUID userId, Pageable pageable) {
        Page<Trip> trips = tripRepository.findByUserId(userId, pageable);
        return trips.map(tripCustomMapper::convertToResponse);
    }

    @Override
    @Transactional
    public void deleteTrip(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new TripNotFoundException(id.toString()));

        // Check if can delete
        if (trip.getStatus() != null && trip.getStatus().isFinal()) {
            throw new RuntimeException("Cannot delete trip with final status: " + trip.getStatus());
        }

        tripRepository.delete(trip);
        log.info("Deleted trip: {}", id);
    }

    @Override
    public CO2CalculationResponse calculateCO2(UUID tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new TripNotFoundException(tripId.toString()));

        return co2Service.calculateDetailed(
                trip.getDistanceKm(),
                trip.getVehicleType()
        );
    }

    @Override
    @Transactional
    public void submitForVerification(UUID tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new TripNotFoundException(tripId.toString()));

        if (!trip.getStatus().canSubmitForVerification()) {
            throw new InvalidTripStateException(
                    "Cannot submit trip. Current status: " + trip.getStatus()
            );
        }

        trip.setStatus(TripStatus.SUBMITTED_FOR_VERIFICATION);
        trip.setVerificationStatus("PENDING");
        Trip savedTrip = tripRepository.save(trip);

        // Publish trip.verified event to RabbitMQ for Verification Service
        try {
            TripEvent event = TripEvent.tripVerified(
                    savedTrip.getId(),
                    savedTrip.getUserId(),
                    savedTrip.getCo2Reduced() != null ? savedTrip.getCo2Reduced() : 0.0,
                    savedTrip.getDistanceKm(),
                    savedTrip.getCreatedAt().toString()
            );
            eventPublisher.publishTripVerified(event);
            log.info("📤 Published trip.verified event for trip: {} submitted for verification", tripId);
        } catch (Exception e) {
            log.error("❌ Failed to publish trip.verified event for trip: {}", tripId, e);
        }

        log.info("Trip {} submitted for verification", tripId);
    }

    @Override
    @Transactional
    public TripResponse completeTrip(UUID tripId) {
        log.info("Completing trip: {}", tripId);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new TripNotFoundException(tripId.toString()));

        if (trip.getStatus() == TripStatus.VERIFIED) {
            throw new InvalidTripStateException("Cannot complete trip. Current status: " + trip.getStatus());
        }

        if (trip.getStatus() == TripStatus.CANCELLED) {
            throw new InvalidTripStateException("Cannot complete trip. Current status: " + trip.getStatus());
        }

        // 3. Calculate CO2 reduced if not already calculated
        if (trip.getCo2Reduced() == null || trip.getCo2Reduced() == 0.0) {
            Double calculatedCo2 = calculateCO2Reduced(trip);
            trip.setCo2Reduced(calculatedCo2);
            log.info("Calculated CO2 reduced: {} kg for trip: {}", calculatedCo2, tripId);
        }

        trip.setStatus(TripStatus.VERIFIED);
        trip.setVerificationStatus("VERIFIED");
        trip.setUpdatedAt(Instant.now());

        // 5. Save updated trip
        Trip completedTrip = tripRepository.save(trip);
        log.info("Trip {} marked as COMPLETED with {} kg CO2 reduced",
                tripId, completedTrip.getCo2Reduced());

        try {
            AddCreditRequest creditRequest = AddCreditRequest.builder()
                    .userId(completedTrip.getUserId())
                    .amount(completedTrip.getCo2Reduced())
                    .relatedTripId(tripId)
                    .description(String.format("Earned from completing trip - %s km",
                            completedTrip.getDistanceKm()))
                    .build();

            ApiResponse<CreditResponse> creditResponse =
                    creditServiceClient.addCredit(creditRequest);

            if (creditResponse.getStatusCode() == 200) {
                log.info("Successfully added {} kg CO2 credits to user: {}",
                        completedTrip.getCo2Reduced(), completedTrip.getUserId());
                
                // Publish trip.verified event to RabbitMQ
                TripEvent event = TripEvent.tripVerified(
                        completedTrip.getId(),
                        completedTrip.getUserId(),
                        completedTrip.getCo2Reduced(),
                        completedTrip.getDistanceKm(),
                        completedTrip.getCreatedAt().toString()
                );
                eventPublisher.publishTripVerified(event);
                
            } else {
                log.error("Failed to add credits: {}", creditResponse.getMessage());
                // Note: Trip is still marked as completed even if credit addition fails
                // You can implement compensation logic here if needed
            }
        } catch (Exception e) {
            log.error("Error calling Credit Service to add credits: ", e);
            // Decide: Should we rollback trip completion or continue?
            // Current behavior: Trip is completed, but credits not added (manual intervention needed)
        }
        return tripCustomMapper.convertToResponse(completedTrip);
    }

    private Double calculateCO2Reduced(Trip trip) {
        if (trip.getDistanceKm() == null || trip.getDistanceKm() <= 0) {
            log.warn("Invalid distance for trip: {}", trip.getId());
            return 0.0;
        }

        // Emission factor: kg CO2 per km for average gasoline car
        final double GASOLINE_CAR_EMISSION_FACTOR = 0.12;

        // Calculate CO2 saved
        double co2Reduced = trip.getDistanceKm() * GASOLINE_CAR_EMISSION_FACTOR;

        // Round to 2 decimal places
        co2Reduced = Math.round(co2Reduced * 100.0) / 100.0;

        log.debug("CO2 calculation: {} km × {} kg/km = {} kg",
                trip.getDistanceKm(), GASOLINE_CAR_EMISSION_FACTOR, co2Reduced);

        return co2Reduced;
    }
}
