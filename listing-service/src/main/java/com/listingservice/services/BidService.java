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

    Page<BidResponse> getBidsByBidder(String bidderId, Pageable pageable);

    BidResponse getUserBidOnListing(UUID listingId, String bidderId);

    List<BidResponse> getActiveBidsByBidder(String bidderId);

    void cancelBid(UUID bidId, String bidderId);
}
