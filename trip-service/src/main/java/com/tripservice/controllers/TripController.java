package com.tripservice.controllers;

import com.tripservice.dtos.request.TripUploadRequest;
import com.tripservice.dtos.response.*;
import com.tripservice.entities.Trip;
import com.tripservice.repositories.TripRepository;
import com.tripservice.services.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.fileupload.FileUploadException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/v1/trips")
@RequiredArgsConstructor
@Slf4j
public class TripController {
    private final TripService tripService;
    private final TripRepository tripRepository;

    /**
     * Upload trip data from CSV/JSON file
     *
     * @param userId - User ID
     * @param vehicleId - Vehicle ID
     * @param file - CSV or JSON file containing trip data
     * @param format - File format (CSV or JSON)
     * @return TripResponse with uploaded trip info
     */

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TripResponse>> upload(
            @RequestParam("userId")
            UUID userId,

            @RequestParam("vehicleId")
            UUID vehicleId,

            @RequestParam("file")
            MultipartFile file,

            @RequestParam("format")
            String format) throws FileUploadException {
        log.info("Received upload request - userId: {}, vehicleId: {}, file: {}, format: {}",
                userId, vehicleId, file.getOriginalFilename(), format);

        // Build TripUploadRequest DTO
        TripUploadRequest request = TripUploadRequest.builder()
                .userId(userId)
                .vehicleId(vehicleId)
                .file(file)
                .format(format)
                .build();

        // Upload Trip
        TripResponse response = tripService.uploadTrip(request);
        var result =ApiResponse.<TripResponse>builder()
                .statusCode(200)
                .message("Upload successful")
                .data(response)
                .build();

        log.info("Trip uploaded successfully: {}", result.getData().getId());

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    /**
     * Get all trips for a user (paginated)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TripResponse>>> getMyTrips(
            @RequestParam("userId")
            UUID userId,

            @RequestParam(value = "page", defaultValue = "0")
            int page,

            @RequestParam(value = "size", defaultValue = "10")
            int size,

            @RequestParam(value = "sort", defaultValue = "createdAt,DESC")
            String sort
    ){
        log.info("Getting trips for user: {}, page: {}, size: {}", userId, page, size);
        
        // Parse sort parameter (format: "property,direction" or just "property")
        String[] sortParts = sort.split(",");
        String sortBy = sortParts[0];
        Sort.Direction sortDirection = sortParts.length > 1 
            ? Sort.Direction.fromString(sortParts[1].trim()) 
            : Sort.Direction.DESC;
            
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<TripResponse> trips = tripService.getMyTrips(userId, pageable);

        var result = ApiResponse.<Page<TripResponse>>builder()
                .statusCode(200)
                .message("Get trips successful")
                .data(trips)
                .build();

        log.info("Found {} trips for user {}", trips.getTotalElements(), userId);

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    /**
     * Get trip by ID (detailed)
     */

    @GetMapping("/{tripId}")
    public ResponseEntity<ApiResponse<TripDetailResponse>> getTrip(@PathVariable("tripId") UUID tripId) {
        log.info("Getting trip details for: {}", tripId);
        TripDetailResponse response = tripService.getTripById(tripId);
        var result = ApiResponse.<TripDetailResponse>builder()
                .statusCode(200)
                .message("Get trip details successful")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    /**
     * Get trip verification status
     */
    @GetMapping("/{tripId}/status")
    public ResponseEntity<ApiResponse<TripStatusResponse>> getTripStatus(@PathVariable("tripId") UUID tripId) {
        log.info("Getting status for trip: {}", tripId);
        Trip trip = tripRepository.findById(tripId).orElseThrow(() -> new RuntimeException("Trip not found" + tripId));
        TripStatusResponse response = TripStatusResponse.builder()
                .tripId(trip.getId())
                .status(trip.getStatus())
                .statusDisplay(trip.getStatus() != null ? trip.getStatus().getDisplayName() : null)
                .statusDescription(trip.getStatus() != null ? trip.getStatus().getDescription() : null)
                .verificationStatus(trip.getVerificationStatus())
                .rejectionReason(trip.getRejectionReason())
                .canSubmit(trip.getStatus() != null && trip.getStatus().canSubmitForVerification())
                .isFinal(trip.getStatus() != null && trip.getStatus().isFinal())
                .verifiedAt(trip.getVerifiedAt())
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .build();

        var result = ApiResponse.<TripStatusResponse>builder()
                .statusCode(200)
                .message("Get trip status successful")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    /**
     * Recalculate CO2 for a trip
     */
    @PostMapping("/{tripId}/calculate")
    public ResponseEntity<ApiResponse<CO2CalculationResponse>> recalculateCO2(@PathVariable("tripId") UUID tripId) {
        log.info("Recalculating CO2 for trip: {}", tripId);

        CO2CalculationResponse response = tripService.calculateCO2(tripId);

        var result = ApiResponse.<CO2CalculationResponse>builder()
                .statusCode(200)
                .message("Recalculating CO2 for trip " + tripId)
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    /**
     * Submit trip for CVA verification
     */

    @PostMapping("/{tripId}/submit-verification")
    public ResponseEntity<ApiResponse<String>> submitVerification(@PathVariable("tripId") UUID tripId) {
        log.info("Submitting trip {} for verification", tripId);

        tripService.submitForVerification(tripId);

        var result = ApiResponse.<String>builder()
                .statusCode(200)
                .message("Submitting trip " + tripId)
                .data("Trip submitted for verification successfully")
                .build();
        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    /**
     * Delete a trip
     */
    @DeleteMapping("/{tripId}")
    public ResponseEntity<ApiResponse<String>> deleteTrip(@PathVariable("tripId") UUID tripId) {
        log.info("Deleting trip: {}", tripId);

        tripService.deleteTrip(tripId);
        var result = ApiResponse.<String>builder()
                .statusCode(200)
                .message("Deleting trip " + tripId)
                .data("Trip deleted successfully")
                .build();
        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    /**
     * Get trip summary/statistics for a user
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<TripSummaryResponse>> getTripSummary(@RequestParam("userId") UUID userId){
        log.info("Getting trip summary for user: {}", userId);

        // Query all trips
        Page<Trip> trips = tripRepository.findByUserId(
                userId,
                PageRequest.of(0, Integer.MAX_VALUE)
        );

        // Calculate summary
        TripSummaryResponse summary = TripSummaryResponse.builder()
                .totalTrips(trips.getTotalElements())
                .totalDistanceKm(trips.stream()
                        .mapToDouble(t -> t.getDistanceKm() != null ? t.getDistanceKm() : 0.0)
                        .sum())
                .totalCO2Reduced(trips.stream()
                        .mapToDouble(t -> t.getCo2Reduced() != null ? t.getCo2Reduced() : 0.0)
                        .sum())
                .verifiedTrips(trips.stream()
                        .filter(t -> "VERIFIED".equals(t.getStatus().name()))
                        .count())
                .pendingTrips(trips.stream()
                        .filter(t -> "CALCULATED".equals(t.getStatus().name()))
                        .count())
                .build();

        var result = ApiResponse.<TripSummaryResponse>builder()
                .statusCode(200)
                .message("Get trip summary successful")
                .data(summary)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<TripResponse>> completeTrip(@PathVariable UUID id) {
        log.info("Request to complete trip: {}", id);

        TripResponse response = tripService.completeTrip(id);

        var result = ApiResponse.<TripResponse>builder()
                .statusCode(200)
                .message("Completing trip " + id)
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }
}
