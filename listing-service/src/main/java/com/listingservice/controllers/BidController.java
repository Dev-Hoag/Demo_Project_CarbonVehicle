package com.listingservice.controllers;

import com.listingservice.dtos.requests.PlaceBidRequest;
import com.listingservice.dtos.responses.ApiResponse;
import com.listingservice.dtos.responses.BidPlacedResponse;
import com.listingservice.dtos.responses.BidResponse;
import com.listingservice.services.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/bids")
@RequiredArgsConstructor
@Slf4j
public class BidController {
    private final BidService bidService;

    @PostMapping("/listings/{listingId}")
    public ResponseEntity<ApiResponse<BidPlacedResponse>> placeBid(
            @PathVariable UUID listingId,
            @Valid @RequestBody PlaceBidRequest request) {
        log.info("Placing bid on listing: {} by bidder: {} with amount: {}",
                listingId, request.getBidderId(), request.getBidAmount());

        BidPlacedResponse response = bidService.placeBid(listingId, request);
        var result = ApiResponse.<BidPlacedResponse>builder()
                .statusCode(200)
                .message(response.getMessage())
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BidResponse>> getBidById(@PathVariable UUID id) {
        log.info("Fetching bid with id: {}", id);

        BidResponse response = bidService.getBidById(id);
        var result = ApiResponse.<BidResponse>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/listings/{listingId}")
    public ResponseEntity<ApiResponse<Page<BidResponse>>> getBidsByListing(
            @PathVariable UUID listingId,
            @PageableDefault(size = 20, sort = "bidAmount", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Fetching bids for listing: {}", listingId);

        Page<BidResponse> response = bidService.getBidsByListing(listingId, pageable);
        var result = ApiResponse.<Page<BidResponse>>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/bidder/{bidderId}")
    public ResponseEntity<ApiResponse<Page<BidResponse>>> getBidsByBidder(
            @PathVariable UUID bidderId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Fetching bids by bidder: {}", bidderId);

        Page<BidResponse> response = bidService.getBidsByBidder(bidderId, pageable);
        var result = ApiResponse.<Page<BidResponse>>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/listings/{listingId}/bidder/{bidderId}")
    public ResponseEntity<ApiResponse<BidResponse>> getUserBidOnListing(
            @PathVariable UUID listingId,
            @PathVariable UUID bidderId) {
        log.info("Fetching user bid for listing: {} and bidder: {}", listingId, bidderId);

        BidResponse response = bidService.getUserBidOnListing(listingId, bidderId);
        var result = ApiResponse.<BidResponse>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/bidder/{bidderId}/active")
    public ResponseEntity<ApiResponse<List<BidResponse>>> getActiveBidsByBidder(
            @PathVariable UUID bidderId) {
        log.info("Fetching active bids by bidder: {}", bidderId);

        List<BidResponse> response = bidService.getActiveBidsByBidder(bidderId);
        var result = ApiResponse.<List<BidResponse>>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @DeleteMapping("/{bidId}")
    public ResponseEntity<ApiResponse<String>> cancelBid(
            @PathVariable UUID bidId,
            @RequestParam UUID bidderId) {
        log.info("Cancelling bid: {} by bidder: {}", bidId, bidderId);

        bidService.cancelBid(bidId, bidderId);
        var result = ApiResponse.<String>builder()
                .statusCode(200)
                .message("OK")
                .data("Successfully cancelled bid")
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }
}
