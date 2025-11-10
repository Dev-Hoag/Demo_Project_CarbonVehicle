package com.listingservice.controllers;

import com.listingservice.dtos.requests.CreateListingRequest;
import com.listingservice.dtos.requests.UpdateListingRequest;
import com.listingservice.dtos.responses.ApiResponse;
import com.listingservice.dtos.responses.ListingDetailResponse;
import com.listingservice.dtos.responses.ListingResponse;
import com.listingservice.services.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/listings")
@RequiredArgsConstructor
@Slf4j
public class ListingController {
    private final ListingService listingService;

    @PostMapping
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(
            @Valid @RequestBody CreateListingRequest request) {
        log.info("Creating new listing with title: {} by seller: {}",
                request.getTitle(), request.getSellerId());

        ListingResponse response = listingService.createListing(request);
        var result = ApiResponse.<ListingResponse>builder()
                .statusCode(200)
                .message("Successfully created listing with title: " + request.getTitle())
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> getListingById(@PathVariable UUID id) {
        log.info("Fetching listing with id: {}", id);

        ListingResponse response = listingService.getListingById(id);
        var result = ApiResponse.<ListingResponse>builder()
                .statusCode(200)
                .message("Successfully fetched listing with id: " + id)
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> updateListing(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateListingRequest request) {
        log.info("Updating listing: {} by seller: {}", id, request.getSellerId());

        ListingResponse response = listingService.updateListing(id, request);
        var result = ApiResponse.<ListingResponse>builder()
                .statusCode(200)
                .message("Successfully updated listing with id: " + id)
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }


}
