package com.listingservice.services.impl;

import com.listingservice.dtos.requests.PlaceBidRequest;
import com.listingservice.dtos.responses.BidPlacedResponse;
import com.listingservice.dtos.responses.BidResponse;
import com.listingservice.dtos.responses.ListingResponse;
import com.listingservice.entities.Bid;
import com.listingservice.entities.Listing;
import com.listingservice.enums.BidStatus;
import com.listingservice.enums.ListingType;
import com.listingservice.exceptions.BidNotFoundException;
import com.listingservice.exceptions.InvalidBidException;
import com.listingservice.exceptions.ListingNotFoundException;
import com.listingservice.exceptions.UnauthorizedActionException;
import com.listingservice.mappers.BidMapper;
import com.listingservice.mappers.ListingMapper;
import com.listingservice.repositories.BidRepository;
import com.listingservice.repositories.ListingRepository;
import com.listingservice.services.BidService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BidServiceImpl implements BidService {
    private final BidRepository bidRepository;
    private final ListingRepository listingRepository;
    private final BidMapper bidMapper;
    private final ListingMapper listingMapper;

    @Override
    public BidPlacedResponse placeBid(UUID listingId, PlaceBidRequest request) {
        log.info("Placing bid on listing: {} by bidder: {} with amount: {}",
                listingId, request.getBidderId(), request.getBidAmount());

        // 1. Validate listing exists
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException("Listing not found with id: " + listingId));

        // 2. Validate listing can accept bids
        validateListingCanAcceptBids(listing);

        // 3. Validate bidder is not the seller
        if (listing.getSellerId().equals(request.getBidderId())) {
            throw new InvalidBidException("Seller cannot bid on their own listing");
        }

        // 4. Get previous highest bid amount (before placing new bid)
        Optional<Double> previousHighestBidOpt = bidRepository.getHighestBidAmount(listingId);
        Double previousHighestBid = previousHighestBidOpt.orElse(null);

        // 5. Validate bid amount
        validateBidAmount(listing, request.getBidAmount(), previousHighestBid);

        // 6. Check if user already has a bid on this listing
        Optional<Bid> existingBidOpt = bidRepository.findUserBidOnListing(listingId, request.getBidderId());

        Bid bid;
        if (existingBidOpt.isPresent()) {
            // Update existing bid
            bid = existingBidOpt.get();

            // Can only update ACTIVE or OUTBID bids
            if (bid.getStatus() != BidStatus.ACTIVE && bid.getStatus() != BidStatus.OUTBID) {
                throw new InvalidBidException("Cannot update bid with status: " + bid.getStatus());
            }

            log.info("Updating existing bid {} with new amount", bid.getId());
            bid.setBidAmount(request.getBidAmount());
            bid.setStatus(BidStatus.ACTIVE);
            bid.setNotes(request.getNotes());
        } else {
            // Create new bid
            log.info("Creating new bid for listing {}", listingId);
            bid = bidMapper.toEntity(request, listing);
        }
        Bid savedBid = bidRepository.save(bid);

        // 8. Mark this bid as winning and mark other bids as OUTBID
        bidRepository.markOtherBidsAsOutbid(listingId, savedBid.getId(), Instant.now());
        savedBid.setIsWinning(true);
        savedBid = bidRepository.save(savedBid);

        // 9. Check if this is the highest bid
        Optional<Bid> highestBid = bidRepository.findHighestBidByListingId(listingId);
        boolean isHighestBid = highestBid.isPresent() &&
                highestBid.get().getId().equals(savedBid.getId());

        // 10. Prepare response
        BidResponse bidResponse = bidMapper.toResponse(savedBid, request.getBidderId());
        ListingResponse listingResponse = listingMapper.toResponse(listing);

        String message = isHighestBid
                ? "Bid placed successfully! You are currently the highest bidder."
                : "Bid placed successfully!";

        log.info("Bid placed successfully: {} with amount: {}", savedBid.getId(), savedBid.getBidAmount());

        return BidPlacedResponse.builder()
                .bid(bidResponse)
                .listing(listingResponse)
                .isHighestBid(isHighestBid)
                .previousHighestBid(previousHighestBid)
                .message(message)
                .build();
    }
    @Override
    @Transactional(readOnly = true)
    public BidResponse getBidById(UUID id) {
        log.info("Fetching bid by id: {}", id);

        Bid bid = bidRepository.findById(id)
                .orElseThrow(() -> new BidNotFoundException("Bid not found with id: " + id));

        return bidMapper.toResponse(bid);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BidResponse> getBidsByListing(UUID listingId, Pageable pageable) {
        log.info("Fetching bids for listing: {} with page: {}, size: {}",
                listingId, pageable.getPageNumber(), pageable.getPageSize());

        // Verify listing exists
        if (!listingRepository.existsById(listingId)) {
            throw new ListingNotFoundException("Listing not found with id: " + listingId);
        }

        return bidRepository.findByListingId(listingId, pageable)
                .map(bidMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BidResponse> getBidsByBidder(UUID bidderId, Pageable pageable) {
        log.info("Fetching bids by bidder: {} with page: {}, size: {}",
                bidderId, pageable.getPageNumber(), pageable.getPageSize());

        return bidRepository.findByBidderId(bidderId, pageable)
                .map(bid -> bidMapper.toResponse(bid, bidderId));
    }

    @Override
    @Transactional(readOnly = true)
    public BidResponse getUserBidOnListing(UUID listingId, UUID bidderId) {
        log.info("Fetching user bid for listing: {} and bidder: {}", listingId, bidderId);

        // Verify listing exists
        if (!listingRepository.existsById(listingId)) {
            throw new ListingNotFoundException("Listing not found with id: " + listingId);
        }

        Bid bid = bidRepository.findUserBidOnListing(listingId, bidderId)
                .orElseThrow(() -> new BidNotFoundException(
                        "No bid found for listing: " + listingId + " and bidder: " + bidderId));

        return bidMapper.toResponse(bid, bidderId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BidResponse> getActiveBidsByBidder(UUID bidderId) {
        log.info("Fetching active bids by bidder: {}", bidderId);

        List<Bid> activeBids = bidRepository.findActiveBidsByBidder(bidderId);

        return bidMapper.toResponseList(activeBids, bidderId);
    }

    @Override
    public void cancelBid(UUID bidId, UUID bidderId) {
        log.info("Attempting to cancel bid: {} by bidder: {}", bidId, bidderId);

        // 1. Find the bid
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new BidNotFoundException("Bid not found with id: " + bidId));

        // 2. Validate bidder owns this bid
        if (!bid.getBidderId().equals(bidderId)) {
            throw new UnauthorizedActionException("You are not authorized to cancel this bid");
        }

        // 3. Validate bid can be cancelled
        if (bid.getStatus() != BidStatus.ACTIVE && bid.getStatus() != BidStatus.OUTBID) {
            throw new InvalidBidException("Only ACTIVE or OUTBID bids can be cancelled. Current status: " + bid.getStatus());
        }

        // 4. Check if auction has ended
        Listing listing = bid.getListing();
        if (listing.isAuctionEnded()) {
            throw new InvalidBidException("Cannot cancel bid after auction has ended");
        }

        // 5. Cancel the bid using repository method
        bidRepository.cancelBid(bidId, Instant.now());

        // 6. If this was the winning bid, recalculate winner
        if (bid.getIsWinning()) {
            recalculateWinningBid(listing.getId());
        }

        log.info("Bid {} cancelled successfully by bidder {}", bidId, bidderId);
    }

    private void validateListingCanAcceptBids(Listing listing) {
        // Check if listing is auction type
        if (listing.getListingType() != ListingType.AUCTION) {
            throw new InvalidBidException("This listing is not an auction");
        }

        // Check if listing is active
        if (!listing.isActive()) {
            throw new InvalidBidException("Listing is not active");
        }

        // Check if auction can accept bids
        if (!listing.canPlaceBid()) {
            throw new InvalidBidException("This auction is not accepting bids");
        }

        // Check if auction has ended
        if (listing.isAuctionEnded()) {
            throw new InvalidBidException("Auction has ended");
        }
    }

    /**
     * Validate bid amount
     */
    private void validateBidAmount(Listing listing, Double bidAmount, Double currentHighestBid) {
        // Check minimum bid (starting bid)
        if (listing.getStartingBid() != null && bidAmount < listing.getStartingBid()) {
            throw new InvalidBidException(
                    String.format("Bid amount must be at least %.2f (starting bid)", listing.getStartingBid())
            );
        }

        // Check if bid is higher than current highest
        if (currentHighestBid != null && bidAmount <= currentHighestBid) {
            throw new InvalidBidException(
                    String.format("Bid amount must be higher than current highest bid: %.2f", currentHighestBid)
            );
        }
    }

    /**
     * Recalculate winning bid after a bid is cancelled
     */
    private void recalculateWinningBid(UUID listingId) {
        log.info("Recalculating winning bid for listing: {}", listingId);

        Optional<Bid> newHighestBid = bidRepository.findHighestBidByListingId(listingId);

        if (newHighestBid.isPresent()) {
            Bid highestBid = newHighestBid.get();

            // Mark all other bids as OUTBID
            bidRepository.markOtherBidsAsOutbid(listingId, highestBid.getId(), Instant.now());

            // Mark this bid as winning
            highestBid.setIsWinning(true);
            highestBid.setStatus(BidStatus.ACTIVE);
            bidRepository.save(highestBid);

            log.info("New winning bid set: {} with amount: {}",
                    highestBid.getId(), highestBid.getBidAmount());
        } else {
            log.info("No active bids remaining for listing: {}", listingId);
        }
    }
}
