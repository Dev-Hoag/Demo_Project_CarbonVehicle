package com.listingservice.services;

import com.listingservice.dtos.requests.CreateListingRequest;
import com.listingservice.dtos.requests.ListingSearchRequest;
import com.listingservice.dtos.requests.UpdateListingRequest;
import com.listingservice.dtos.responses.ListingDetailResponse;
import com.listingservice.dtos.responses.ListingResponse;
import com.listingservice.dtos.responses.ListingSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ListingService {
    ListingResponse createListing(CreateListingRequest request);

    ListingResponse getListingById(UUID id);

    ListingDetailResponse getListingDetails(UUID id);

    ListingResponse updateListing(UUID id, UpdateListingRequest request);

    void deleteListing(UUID id, UUID userId);

    Page<ListingResponse> getAllListings(Pageable pageable);

    Page<ListingResponse> searchListings(ListingSearchRequest request, Pageable pageable);
}
