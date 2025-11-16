package com.listingservice.services.impl;

import com.listingservice.dtos.requests.PurchaseRequest;
import com.listingservice.dtos.responses.ListingResponse;
import com.listingservice.dtos.responses.PurchaseCompletedResponse;
import com.listingservice.dtos.responses.TransactionResponse;
import com.listingservice.entities.Listing;
import com.listingservice.entities.Transaction;
import com.listingservice.enums.ListingStatus;
import com.listingservice.enums.ListingType;
import com.listingservice.exceptions.InsufficientCreditException;
import com.listingservice.exceptions.InvalidListingException;
import com.listingservice.exceptions.ListingNotFoundException;
import com.listingservice.exceptions.TransactionNotFoundException;
import com.listingservice.mappers.ListingMapper;
import com.listingservice.mappers.TransactionMapper;
import com.listingservice.repositories.ListingRepository;
import com.listingservice.repositories.TransactionRepository;
import com.listingservice.services.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TransactionServiceImpl implements TransactionService {
    private final TransactionRepository transactionRepository;
    private final ListingRepository listingRepository;
    private final TransactionMapper transactionMapper;
    private final ListingMapper listingMapper;

    @Override
    public PurchaseCompletedResponse purchaseListing(UUID listingId, PurchaseRequest request) {
        log.info("Processing purchase for listing: {} by buyer: {} with amount: {} kg",
                listingId, request.getBuyerId(), request.getAmount());

        // 1. Validate listing exists and is available for purchase
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));

        // 2. Validate listing can be purchased
        validateListingForPurchase(listing, request);

        // 3. Validate buyer is not the seller
        if (listing.getSellerId().equals(request.getBuyerId())) {
            throw new InvalidListingException("Seller cannot purchase their own listing");
        }

        // 4. Calculate transaction details
        Double pricePerKg = listing.getPricePerKg();
        Double totalPrice = pricePerKg * request.getAmount();

        // 5. Create transaction
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

        // 6. Update listing available amount
        Double newAvailableAmount = listing.getAvailableAmount() - request.getAmount();
        listingRepository.updateAvailableAmount(listingId, newAvailableAmount, Instant.now());
        log.info("Updated listing {} available amount from {} to {} kg",
                listingId, listing.getAvailableAmount(), newAvailableAmount);

        // 7. If listing is sold out, mark as SOLD
        if (newAvailableAmount <= 0) {
            listingRepository.updateStatus(listingId, ListingStatus.SOLD, Instant.now());
            log.info("Listing {} marked as SOLD (fully purchased)", listingId);
        }

        // 8. Refresh listing entity to get updated values
        listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));

        // 9. Prepare response
        TransactionResponse transactionResponse = transactionMapper.toResponse(savedTransaction);
        ListingResponse listingResponse = listingMapper.toResponse(listing);

        String message = String.format(
                "Purchase completed successfully! You bought %.2f kg of CO2 credits for $%.2f",
                request.getAmount(), totalPrice
        );

        log.info("Purchase completed successfully for listing {}", listingId);

        return PurchaseCompletedResponse.builder()
                .transaction(transactionResponse)
                .listing(listingResponse)
                .message(message)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(UUID id) {
        log.info("Fetching transaction by id: {}", id);

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException(id));

        return transactionMapper.toResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactionsByBuyer(UUID buyerId, Pageable pageable) {
        log.info("Fetching transactions by buyer: {} with page: {}, size: {}",
                buyerId, pageable.getPageNumber(), pageable.getPageSize());

        return transactionRepository.findByBuyerId(buyerId, pageable)
                .map(transactionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactionsBySeller(UUID sellerId, Pageable pageable) {
        log.info("Fetching transactions by seller: {} with page: {}, size: {}",
                sellerId, pageable.getPageNumber(), pageable.getPageSize());

        return transactionRepository.findBySellerId(sellerId, pageable)
                .map(transactionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactionsByStatus(String status, Pageable pageable) {
        log.info("Fetching transactions by status: {} with page: {}, size: {}",
                status, pageable.getPageNumber(), pageable.getPageSize());

        return transactionRepository.findByStatus(status, pageable)
                .map(transactionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getRecentTransactions(Instant since) {
        log.info("Fetching recent transactions since: {}", since);

        return transactionRepository.findRecentTransactions(since)
                .stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Double getTotalRevenueBySeller(UUID sellerId) {
        log.info("Calculating total revenue for seller: {}", sellerId);

        Double revenue = transactionRepository.getTotalRevenueBySeller(sellerId);
        return revenue != null ? revenue : 0.0;
    }

    @Override
    @Transactional(readOnly = true)
    public Double getTotalSpendingByBuyer(UUID buyerId) {
        log.info("Calculating total spending for buyer: {}", buyerId);

        Double spending = transactionRepository.getTotalSpendingByBuyer(buyerId);
        return spending != null ? spending : 0.0;
    }

    @Override
    @Transactional(readOnly = true)
    public Double getTotalCo2PurchasedByBuyer(UUID buyerId) {
        log.info("Calculating total CO2 purchased by buyer: {}", buyerId);

        Double co2Amount = transactionRepository.getTotalCo2PurchasedByBuyer(buyerId);
        return co2Amount != null ? co2Amount : 0.0;
    }

    @Override
    @Transactional(readOnly = true)
    public Double getTotalCo2SoldBySeller(UUID sellerId) {
        log.info("Calculating total CO2 sold by seller: {}", sellerId);

        Double co2Amount = transactionRepository.getTotalCo2SoldBySeller(sellerId);
        return co2Amount != null ? co2Amount : 0.0;
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
