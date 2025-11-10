package com.listingservice.services;

import com.listingservice.dtos.requests.PurchaseRequest;
import com.listingservice.dtos.responses.PurchaseCompletedResponse;
import com.listingservice.dtos.responses.TransactionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TransactionService {
    /**
     * Purchase a listing (for FIXED_PRICE listings)
     * @param listingId ID of the listing to purchase
     * @param request Purchase request containing buyer info and amount
     * @return Purchase completed response with transaction and listing details
     */
    PurchaseCompletedResponse purchaseListing(UUID listingId, PurchaseRequest request);

    /**
     * Get transaction by ID
     * @param id Transaction ID
     * @return Transaction response
     */
    TransactionResponse getTransactionById(UUID id);

    /**
     * Get all transactions by buyer
     * @param buyerId Buyer's user ID
     * @param pageable Pagination parameters
     * @return Page of transactions
     */
    Page<TransactionResponse> getTransactionsByBuyer(UUID buyerId, Pageable pageable);

    /**
     * Get all transactions by seller
     * @param sellerId Seller's user ID
     * @param pageable Pagination parameters
     * @return Page of transactions
     */
    Page<TransactionResponse> getTransactionsBySeller(UUID sellerId, Pageable pageable);

    /**
     * Get all transactions by status
     * @param status Transaction status
     * @param pageable Pagination parameters
     * @return Page of transactions
     */
    Page<TransactionResponse> getTransactionsByStatus(String status, Pageable pageable);

    /**
     * Get recent transactions since a specific time
     * @param since Instant to get transactions from
     * @return List of recent transactions
     */
    List<TransactionResponse> getRecentTransactions(Instant since);

    /**
     * Get total revenue for a seller
     * @param sellerId Seller's user ID
     * @return Total revenue amount
     */
    Double getTotalRevenueBySeller(UUID sellerId);

    /**
     * Get total spending for a buyer
     * @param buyerId Buyer's user ID
     * @return Total spending amount
     */
    Double getTotalSpendingByBuyer(UUID buyerId);

    /**
     * Get total CO2 purchased by a buyer
     * @param buyerId Buyer's user ID
     * @return Total CO2 amount in kg
     */
    Double getTotalCo2PurchasedByBuyer(UUID buyerId);

    /**
     * Get total CO2 sold by a seller
     * @param sellerId Seller's user ID
     * @return Total CO2 amount in kg
     */
    Double getTotalCo2SoldBySeller(UUID sellerId);
}
