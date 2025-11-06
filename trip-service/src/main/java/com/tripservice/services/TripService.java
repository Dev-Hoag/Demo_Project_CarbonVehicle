package com.tripservice.services;


import com.tripservice.dtos.request.TripUploadRequest;
import com.tripservice.dtos.response.CO2CalculationResponse;
import com.tripservice.dtos.response.TripDetailResponse;
import com.tripservice.dtos.response.TripResponse;
import org.apache.commons.fileupload.FileUploadException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface TripService {
    TripResponse uploadTrip(TripUploadRequest request) throws FileUploadException;
    Page<TripResponse> getMyTrips(UUID userId, Pageable pageable);
    TripDetailResponse getTripById(UUID id);
    void deleteTrip(UUID id);
    CO2CalculationResponse calculateCO2(UUID tripId);
    void submitForVerification(UUID tripId);
}
