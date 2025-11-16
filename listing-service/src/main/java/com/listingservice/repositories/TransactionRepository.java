package com.listingservice.repositories;

import com.listingservice.entities.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByListingId(UUID listingId);
    Page<Transaction> findByBuyerId(UUID buyerId, Pageable pageable);
    Page<Transaction> findBySellerId(UUID sellerId, Pageable pageable);
    Page<Transaction> findByStatus(String status, Pageable pageable);
    Long countByBuyerId(UUID buyerId);
    Long countBySellerId(UUID sellerId);

    @Query("SELECT SUM(t.totalPrice) FROM Transaction t WHERE t.sellerId = :sellerId AND t.status = 'COMPLETED'")
    Double getTotalRevenueBySeller(@Param("sellerId") UUID sellerId);

    @Query("SELECT SUM(t.totalPrice) FROM Transaction t WHERE t.buyerId = :buyerId AND t.status = 'COMPLETED'")
    Double getTotalSpendingByBuyer(@Param("buyerId") UUID buyerId);

    @Query("SELECT SUM(t.co2Amount) FROM Transaction t WHERE t.buyerId = :buyerId AND t.status = 'COMPLETED'")
    Double getTotalCo2PurchasedByBuyer(@Param("buyerId") UUID buyerId);

    @Query("SELECT SUM(t.co2Amount) FROM Transaction t WHERE t.sellerId = :sellerId AND t.status = 'COMPLETED'")
    Double getTotalCo2SoldBySeller(@Param("sellerId") UUID sellerId);

    Long countByStatus(String status);

    @Query("SELECT SUM(t.totalPrice) FROM Transaction t WHERE t.status = 'COMPLETED'")
    Double getTotalRevenue();

    @Query("SELECT AVG(t.totalPrice) FROM Transaction t WHERE t.status = 'COMPLETED'")
    Double getAverageTransactionPrice();

    @Query("SELECT t FROM Transaction t WHERE t.createdAt BETWEEN :startDate AND :endDate ORDER BY t.createdAt DESC")
    List<Transaction> findTransactionsBetweenDates(@Param("startDate") Instant startDate,
                                                   @Param("endDate") Instant endDate);

    @Query("SELECT t FROM Transaction t WHERE t.createdAt > :since ORDER BY t.createdAt DESC")
    List<Transaction> findRecentTransactions(@Param("since") Instant since);

    @Query("SELECT SUM(t.totalPrice) FROM Transaction t WHERE " +
            "t.status = 'COMPLETED' AND " +
            "t.createdAt BETWEEN :startDate AND :endDate")
    Double getRevenueInDateRange(@Param("startDate") Instant startDate,
                                 @Param("endDate") Instant endDate);

    Page<Transaction> findByTransactionType(String transactionType, Pageable pageable);

    Long countByTransactionType(String transactionType);

    @Query("SELECT SUM(t.totalPrice) FROM Transaction t WHERE " +
            "t.transactionType = :type AND t.status = 'COMPLETED'")
    Double getRevenueByType(@Param("type") String transactionType);
}
