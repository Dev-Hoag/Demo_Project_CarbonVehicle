package com.listingservice.services.impl;

import com.listingservice.dtos.requests.CreateListingRequest;
import com.listingservice.dtos.requests.ListingSearchRequest;
import com.listingservice.dtos.requests.UpdateListingRequest;
import com.listingservice.dtos.responses.ListingDetailResponse;
import com.listingservice.dtos.responses.ListingResponse;
import com.listingservice.entities.Bid;
import com.listingservice.entities.Listing;
import com.listingservice.enums.ListingStatus;
import com.listingservice.enums.ListingType;
import com.listingservice.exceptions.InvalidListingException;
import com.listingservice.exceptions.InvalidListingStateException;
import com.listingservice.exceptions.ListingNotFoundException;
import com.listingservice.exceptions.UnauthorizedActionException;
import com.listingservice.mappers.ListingMapper;
import com.listingservice.repositories.BidRepository;
import com.listingservice.repositories.ListingRepository;
import com.listingservice.services.ListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingServiceImpl implements ListingService {
    private final ListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final ListingMapper listingMapper;

    @Override
    @Transactional
    public ListingResponse createListing(CreateListingRequest request) {
        log.info("Creating new listing: {}", request.getTitle());

        // Validate request
        validateCreateListingRequest(request);

        // Convert to entity
        Listing listing = listingMapper.toEntity(request);

        // Save
        Listing savedListing = listingRepository.save(listing);

        log.info("Listing created successfully with ID: {}", savedListing.getId());

        return listingMapper.toResponse(savedListing, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public ListingResponse getListingById(UUID id) {
        log.debug("Getting listing by ID: {}", id);

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ListingNotFoundException(id));

        // Get bid count
        Integer bidCount = bidRepository.countByListingId(id);

        return listingMapper.toResponse(listing, bidCount);
    }

    @Override
    @Transactional
    public ListingDetailResponse getListingDetails(UUID id) {
        log.debug("Getting listing details for ID: {}", id);

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ListingNotFoundException(id));

        // Increment view count
        listing.incrementViewCount();
        listingRepository.save(listing);

        // Get all bids for this listing
        List<Bid> bids = bidRepository.findByListingIdOrderByBidAmountDesc(id);

        return listingMapper.toDetailResponse(listing, bids);
    }

    @Override
    @Transactional
    public ListingResponse updateListing(UUID id, UpdateListingRequest request) {
        log.info("Updating listing: {} by seller: {}", id, request.getSellerId());

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ListingNotFoundException(id));

        // Check authorization
        if (!listing.getSellerId().equals(request.getSellerId())) {
            throw new UnauthorizedActionException("update listing");
        }

        // Check if listing can be updated
        if (listing.getStatus().isFinal()) {
            throw new InvalidListingStateException("update", listing.getStatus());
        }

        // Update fields
        if (request.getTitle() != null) {
            listing.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            listing.setDescription(request.getDescription());
        }
        if (request.getPricePerKg() != null &&
                listing.getListingType() == ListingType.FIXED_PRICE) {
            listing.setPricePerKg(request.getPricePerKg());
        }
        if (request.getStatus() != null) {
            listing.setStatus(request.getStatus());
        }
        if (request.getExpiresAt() != null) {
            listing.setExpiresAt(request.getExpiresAt());
        }

        Listing updatedListing = listingRepository.save(listing);

        Integer bidCount = bidRepository.countByListingId(id);

        log.info("Listing updated successfully: {}", id);

        return listingMapper.toResponse(updatedListing, bidCount);
    }

    @Override
    @Transactional
    public void deleteListing(UUID id, UUID userId) {
        log.info("Deleting listing: {} by user: {}", id, userId);

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ListingNotFoundException(id));

        // Check authorization
        if (!listing.getSellerId().equals(userId)) {
            throw new UnauthorizedActionException("delete listing");
        }

        // Check if listing can be deleted
        if (listing.getStatus() == ListingStatus.SOLD) {
            throw new InvalidListingStateException(
                    "Cannot delete sold listing", listing.getStatus());
        }

        // Check if listing has active bids
        Integer bidCount = bidRepository.countByListingId(id);
        if (bidCount > 0 && listing.getListingType() == ListingType.AUCTION) {
            throw new InvalidListingStateException(
                    "Cannot delete auction with active bids", listing.getStatus());
        }

        listingRepository.delete(listing);

        log.info("Listing deleted successfully: {}", id);
    }

    // ==================== LIST & SEARCH ====================

    @Override
    @Transactional(readOnly = true)
    public Page<ListingResponse> getAllListings(Pageable pageable) {
        log.debug("Getting all listings, page: {}", pageable.getPageNumber());

        Page<Listing> listings = listingRepository.findAll(pageable);

        return listings.map(listing -> {
            Integer bidCount = bidRepository.countByListingId(listing.getId());
            return listingMapper.toResponse(listing, bidCount);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ListingResponse> searchListings(ListingSearchRequest request, Pageable pageable) {
        log.debug("Searching listings with filters: {}", request);

        Specification<Listing> spec = buildSearchSpecification(request);

        Page<Listing> listings = listingRepository.findAll(spec, pageable);

        return listings.map(listing -> {
            Integer bidCount = bidRepository.countByListingId(listing.getId());
            return listingMapper.toResponse(listing, bidCount);
        });
    }

    // ==================== HELPER METHODS ====================

    /**
     * Validate create listing request
     */
    private void validateCreateListingRequest(CreateListingRequest request) {
        if (request.getListingType() == ListingType.FIXED_PRICE) {
            if (request.getPricePerKg() == null) {
                throw new InvalidListingException(
                        "Price per kg is required for fixed price listings");
            }
        } else if (request.getListingType() == ListingType.AUCTION) {
            if (request.getStartingBid() == null) {
                throw new InvalidListingException(
                        "Starting bid is required for auction listings");
            }
            if (request.getAuctionEndTime() == null && request.getDurationHours() == null) {
                throw new InvalidListingException(
                        "Auction end time or duration is required");
            }
        }
    }

    /**
     * Build search specification
     */
    private Specification<Listing> buildSearchSpecification(ListingSearchRequest request) {
        Specification<Listing> spec = Specification.where(null);

        // Keyword search
        if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("title")),
                                    "%" + request.getKeyword().toLowerCase() + "%"),
                            cb.like(cb.lower(root.get("description")),
                                    "%" + request.getKeyword().toLowerCase() + "%")
                    ));
        }

        // Filter by seller
        if (request.getSellerId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("sellerId"), request.getSellerId()));
        }

        // Filter by listing type
        if (request.getListingType() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("listingType"), request.getListingType()));
        }

        // Filter by status
        if (request.getStatus() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), request.getStatus()));
        }

        // Filter by price range
        if (request.getMinPrice() != null && request.getMaxPrice() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.between(root.get("pricePerKg"),
                            request.getMinPrice(),
                            request.getMaxPrice()));
        }

        // Filter by CO2 amount range
        if (request.getMinCo2Amount() != null && request.getMaxCo2Amount() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.between(root.get("co2Amount"),
                            request.getMinCo2Amount(),
                            request.getMaxCo2Amount()));
        }

        // Filter verified only
        if (request.getVerifiedOnly() != null && request.getVerifiedOnly()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("tripVerified"), true));
        }

        return spec;
    }
}
