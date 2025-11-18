package com.listingservice.controllers;

import com.listingservice.dtos.requests.PlaceBidRequest;
import com.listingservice.dtos.responses.BidResponse;
import com.listingservice.entities.Bid;
import com.listingservice.services.AuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/auctions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuctionController {
    private final AuctionService auctionService;

    @PostMapping("/listings/{listingId}/bid")
    public ResponseEntity<BidResponse> placeBid(
            @PathVariable UUID listingId,
            @RequestBody PlaceBidRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader
    ) {
        log.info("Place bid request: listingId={}, bidAmount={}, userId={}", 
            listingId, request.getBidAmount(), userIdHeader);

        // Extract user ID from header (or use request if provided)
        String bidderId = userIdHeader != null ? userIdHeader : request.getBidderId();
        String bidderName = userNameHeader != null ? userNameHeader : request.getBidderName();

        Bid bid = auctionService.placeBid(listingId, bidderId, bidderName, request.getBidAmount());

        BidResponse response = BidResponse.builder()
                .id(bid.getId())
                .listingId(listingId)
                .bidderId(bid.getBidderId())
                .bidderName(bid.getBidderName())
                .bidAmount(bid.getBidAmount())
                .status(bid.getStatus())
                .isWinning(bid.getIsWinning())
                .createdAt(bid.getCreatedAt())
                .message("Bid placed successfully! You are currently the highest bidder.")
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/listings/{listingId}/bids")
    public ResponseEntity<List<BidResponse>> getBidHistory(@PathVariable UUID listingId) {
        log.info("Get bid history request: listingId={}", listingId);

        List<Bid> bids = auctionService.getBidHistory(listingId);

        List<BidResponse> responses = bids.stream()
                .map(bid -> BidResponse.builder()
                        .id(bid.getId())
                        .listingId(listingId)
                        .bidderId(bid.getBidderId())
                        .bidderName(bid.getBidderName())
                        .bidAmount(bid.getBidAmount())
                        .status(bid.getStatus())
                        .isWinning(bid.getIsWinning())
                        .createdAt(bid.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/listings/{listingId}/bid-count")
    public ResponseEntity<Long> getBidCount(@PathVariable UUID listingId) {
        long count = auctionService.getBidCount(listingId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/listings/{listingId}/current-bid")
    public ResponseEntity<BidResponse> getCurrentHighestBid(@PathVariable UUID listingId) {
        return auctionService.getCurrentHighestBid(listingId)
                .map(bid -> ResponseEntity.ok(BidResponse.builder()
                        .id(bid.getId())
                        .listingId(listingId)
                        .bidderId(bid.getBidderId())
                        .bidderName(bid.getBidderName())
                        .bidAmount(bid.getBidAmount())
                        .status(bid.getStatus())
                        .isWinning(bid.getIsWinning())
                        .createdAt(bid.getCreatedAt())
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-bids")
    public ResponseEntity<List<BidResponse>> getMyBids(
            @RequestHeader(value = "X-User-Id", required = true) String userIdHeader
    ) {
        log.info("Get my bids request: userId={}", userIdHeader);

        List<Bid> bids = auctionService.getMyBids(userIdHeader);

        List<BidResponse> responses = bids.stream()
                .map(bid -> BidResponse.builder()
                        .id(bid.getId())
                        .listingId(bid.getListing().getId())
                        .bidderId(bid.getBidderId())
                        .bidderName(bid.getBidderName())
                        .bidAmount(bid.getBidAmount())
                        .status(bid.getStatus())
                        .isWinning(bid.getIsWinning())
                        .createdAt(bid.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/close-expired")
    public ResponseEntity<String> closeExpiredAuctions() {
        log.info("Manual trigger to close expired auctions");
        auctionService.closeExpiredAuctions();
        return ResponseEntity.ok("Expired auctions processed");
    }
}
