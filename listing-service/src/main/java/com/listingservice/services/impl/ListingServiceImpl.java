package com.listingservice.services.impl;

import com.listingservice.clients.CreditServiceClient;
import com.listingservice.clients.TripServiceClient;
import com.listingservice.dtos.requests.*;
import com.listingservice.dtos.responses.*;
import com.listingservice.entities.Bid;
import com.listingservice.entities.Listing;
import com.listingservice.entities.Transaction;
import com.listingservice.enums.ListingStatus;
import com.listingservice.enums.ListingType;
import com.listingservice.exceptions.*;
import com.listingservice.mappers.ListingMapper;
import com.listingservice.mappers.TransactionMapper;
import com.listingservice.repositories.BidRepository;
import com.listingservice.repositories.ListingRepository;
import com.listingservice.repositories.TransactionRepository;
import com.listingservice.services.ListingService;
import com.listingservice.events.EventPublisher;
import com.listingservice.events.ListingEvent;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingServiceImpl implements ListingService {
    private final ListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final ListingMapper listingMapper;
    private final TripServiceClient tripServiceClient;
    private final TransactionMapper transactionMapper;
    private final TransactionRepository transactionRepository;
    private final CreditServiceClient creditServiceClient;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public ListingResponse createListing(CreateListingRequest request) {
        log.info("Creating new listing: {}", request.getTitle());

        if (request.getTripId() != null) {
            try {
                ApiResponse<TripResponse> tripResponse =
                        tripServiceClient.getTripById(request.getTripId());

                if (!(tripResponse.getStatusCode() == 200)) {
                    throw new InvalidListingException("Trip not found: " + request.getTripId());
                }

                TripResponse trip = tripResponse.getData();

                // Validate trip is completed
                if (!"VERIFIED".equals(trip.getStatus())) {
                    throw new InvalidListingException("Trip must be completed");
                }

                log.info("Trip verified: {}", request.getTripId());
            } catch (Exception e) {
                log.error("Error verifying trip: ", e);
                throw new InvalidListingException("Failed to verify trip");
            }
        }

        // Validate request
        validateCreateListingRequest(request);

        // Convert to entity
        Listing listing = listingMapper.toEntity(request);

        // Save
        Listing savedListing = listingRepository.save(listing);

        log.info("Listing created successfully with ID: {}", savedListing.getId());

        // Publish listing.created event
        ListingEvent event = ListingEvent.listingCreated(
                savedListing.getId(),
                savedListing.getSellerId(),
                savedListing.getTitle(),
                savedListing.getCo2Amount(),
                savedListing.getPricePerKg()
        );
        eventPublisher.publishListingCreated(event);

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

    @Transactional
    public TransactionResponse purchaseListing(UUID listingId, PurchaseRequest request){
        log.info("Processing purchase with credit deduction");

        log.info("Processing purchase for listing: {} by buyer: {}", listingId, request.getBuyerId());

        // 1. Find and validate listing
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));

        validateListingForPurchase(listing, request);

        // 2. Validate buyer is not the seller
        if (listing.getSellerId().equals(request.getBuyerId())) {
            throw new InvalidListingException("Seller cannot purchase their own listing");
        }

        // 3. Calculate transaction details
        Double pricePerKg = listing.getPricePerKg();
        Double totalPrice = pricePerKg * request.getAmount();

        // 4. Deduct credits from buyer
        try {
            DeductCreditRequest deductRequest = DeductCreditRequest.builder()
                    .userId(request.getBuyerId())
                    .amount(request.getAmount()) // ← SỬA ĐÂY: amount in kg, not totalPrice
                    .relatedListingId(listingId)
                    .description(String.format("Purchase %.2f kg CO2 credits from marketplace",
                            request.getAmount()))
                    .build();

            ApiResponse<CreditResponse> deductResponse =
                    creditServiceClient.deductCredit(deductRequest);

            // ← SỬA ĐÂY: Check success field
            if (!(deductResponse.getStatusCode()==200)) {
                throw new InsufficientCreditException(
                        "Failed to deduct credits: " + deductResponse.getMessage()
                );
            }

            log.info("Credits deducted from buyer: {}", request.getBuyerId());
        } catch (FeignException e) {
            log.error("Error calling Credit Service to deduct: ", e);
            throw new InsufficientCreditException("Insufficient credits or Credit Service unavailable");
        } catch (InsufficientCreditException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deducting credits: ", e);
            throw new InsufficientCreditException("Failed to process credit deduction");
        }

        // 5. Add credits to seller
        try {
            AddCreditRequest addRequest = AddCreditRequest.builder()
                    .userId(listing.getSellerId())
                    .amount(request.getAmount())
                    .relatedTripId(listingId)
                    .description(String.format("Sold %.2f kg CO2 credits on marketplace",
                            request.getAmount()))
                    .build();

            ApiResponse<CreditResponse> addResponse =
                    creditServiceClient.addCredit(addRequest);

            if (!(addResponse.getStatusCode()==200)) {
                log.error("Failed to add credits to seller: {}", addResponse.getMessage());
                // Note: Buyer credits already deducted, may need compensation logic
            } else {
                log.info("Credits added to seller: {}", listing.getSellerId());
            }
        } catch (Exception e) {
            log.error("Error adding credits to seller: ", e);
            // Note: Transaction continues, but seller credits not added
        }

        // 6. Create transaction record
        Transaction transaction = Transaction.builder()
                .listingId(listingId)
                .buyerId(request.getBuyerId())
                .sellerId(listing.getSellerId())
                .co2Amount(request.getAmount())
                .pricePerKg(pricePerKg)
                .totalPrice(totalPrice)
                .transactionType("PURCHASE")
                .status("COMPLETED")
                .paymentStatus("PAID")
                .notes(request.getNotes())
                .build();

        Transaction savedTransaction = transactionRepository.save(transaction);
        log.info("Transaction created: {} with total price: ${}", savedTransaction.getId(), totalPrice);

        // 7. Update listing available amount
        Double newAvailableAmount = listing.getAvailableAmount() - request.getAmount();
        listingRepository.updateAvailableAmount(listingId, newAvailableAmount, Instant.now());
        log.info("Updated listing {} available amount from {} to {} kg",
                listingId, listing.getAvailableAmount(), newAvailableAmount);

        // 8. If listing is sold out, mark as SOLD
        if (newAvailableAmount <= 0) {
            listingRepository.updateStatus(listingId, ListingStatus.SOLD, Instant.now());
            log.info("Listing {} marked as SOLD (fully purchased)", listingId);
            
            // Publish listing.sold event
            ListingEvent soldEvent = ListingEvent.listingSold(
                    listing.getId(),
                    listing.getSellerId(),
                    listing.getTitle(),
                    listing.getCo2Amount(),
                    listing.getPricePerKg()
            );
            eventPublisher.publishListingSold(soldEvent);
        }

        log.info("Purchase completed successfully for listing {}", listingId);

        // 9. Return response
        return transactionMapper.toResponse(savedTransaction);
    }

    private void validateListingForPurchase(Listing listing, PurchaseRequest request) {
        // Check if listing is FIXED_PRICE type (not auction)
        if (listing.getListingType() == ListingType.AUCTION) {
            throw new InvalidListingException(
                    "Cannot directly purchase auction listings. Place a bid instead."
            );
        }

        // Check if listing is active
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new InvalidListingException(
                    "Listing is not available for purchase. Status: " + listing.getStatus().getDisplayName()
            );
        }

        // Check if listing has expired
        if (listing.getExpiresAt() != null && Instant.now().isAfter(listing.getExpiresAt())) {
            throw new InvalidListingException("Listing has expired");
        }

        // Check if amount is positive
        if (request.getAmount() <= 0) {
            throw new InvalidListingException("Purchase amount must be greater than 0");
        }

        // Check if requested amount is available
        if (request.getAmount() > listing.getAvailableAmount()) {
            throw new InsufficientCreditException(request.getAmount(), listing.getAvailableAmount());
        }

        // Check if listing has price set
        if (listing.getPricePerKg() == null || listing.getPricePerKg() <= 0) {
            throw new InvalidListingException("Listing does not have a valid price");
        }
    }
}
