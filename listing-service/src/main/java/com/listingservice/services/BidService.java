package com.listingservice.services;

import com.listingservice.dtos.requests.PlaceBidRequest;
import com.listingservice.dtos.responses.BidPlacedResponse;
import com.listingservice.dtos.responses.BidResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface BidService {
    BidPlacedResponse placeBid(UUID listingId, PlaceBidRequest request);

    BidResponse getBidById(UUID id);

    Page<BidResponse> getBidsByListing(UUID listingId, Pageable pageable);

    Page<BidResponse> getBidsByBidder(UUID bidderId, Pageable pageable);

    BidResponse getUserBidOnListing(UUID listingId, UUID bidderId);

    List<BidResponse> getActiveBidsByBidder(UUID bidderId);

    void cancelBid(UUID bidId, UUID bidderId);
}
