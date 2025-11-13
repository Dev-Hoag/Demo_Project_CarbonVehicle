package com.creditservice.repositories;

import com.creditservice.entities.CreditTransaction;
import com.creditservice.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, UUID> {
    Page<CreditTransaction> findByUserId(UUID userId, Pageable pageable);

    Page<CreditTransaction> findByUserIdAndTransactionType(
            UUID userId, TransactionType transactionType, Pageable pageable);

    @Query("SELECT ct FROM CreditTransaction ct WHERE ct.userId = :userId " +
            "ORDER BY ct.createdAt DESC")
    List<CreditTransaction> findRecentByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT ct FROM CreditTransaction ct WHERE ct.createdAt > :since " +
            "ORDER BY ct.createdAt DESC")
    List<CreditTransaction> findRecentTransactions(@Param("since") Instant since);

    @Query("SELECT SUM(ct.amount) FROM CreditTransaction ct " +
            "WHERE ct.userId = :userId AND ct.transactionType = :type")
    Double sumByUserIdAndType(@Param("userId") UUID userId,
                              @Param("type") TransactionType type);

    Long countByUserId(UUID userId);

    Long countByTransactionType(TransactionType transactionType);
}
