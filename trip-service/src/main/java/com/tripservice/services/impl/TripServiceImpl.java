package com.tripservice.services.impl;

import com.tripservice.constants.TripStatus;
import com.tripservice.dtos.internal.TripData;
import com.tripservice.dtos.request.TripUploadRequest;
import com.tripservice.dtos.response.CO2CalculationResponse;
import com.tripservice.dtos.response.TripDetailResponse;
import com.tripservice.dtos.response.TripResponse;
import com.tripservice.entities.Trip;
import com.tripservice.events.publisher.TripEventPublisher;
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
                .orElseThrow(() -> new RuntimeException("Trip not found"));

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
                .orElseThrow(() -> new RuntimeException("Trip not found: " + id));

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
                .orElseThrow(() -> new RuntimeException("Trip not found: " + tripId));

        return co2Service.calculateDetailed(
                trip.getDistanceKm(),
                trip.getVehicleType()
        );
    }

    @Override
    @Transactional
    public void submitForVerification(UUID tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found: " + tripId));

        if (!trip.getStatus().canSubmitForVerification()) {
            throw new RuntimeException(
                    "Cannot submit trip. Current status: " + trip.getStatus()
            );
        }

        trip.setStatus(TripStatus.SUBMITTED_FOR_VERIFICATION);
        trip.setVerificationStatus("PENDING");
        tripRepository.save(trip);

        log.info("Trip {} submitted for verification", tripId);
    }
}
