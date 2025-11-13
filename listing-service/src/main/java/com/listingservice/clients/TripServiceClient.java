package com.listingservice.clients;

import com.listingservice.dtos.responses.ApiResponse;
import com.listingservice.dtos.responses.TripResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "trip-service",
        url = "${services.trip-service.url}"
)
public interface TripServiceClient {
    @GetMapping("/v1/trips/{id}")
    ApiResponse<TripResponse> getTripById(@PathVariable("id") UUID id);
}
