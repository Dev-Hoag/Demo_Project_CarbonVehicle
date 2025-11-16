package com.creditservice.repositories;

import com.creditservice.entities.Credit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreditRepository extends JpaRepository<Credit, UUID> {
    Optional<Credit> findByUserId(UUID userId);

    Boolean existsByUserId(UUID userId);

    @Query("SELECT SUM(c.balance) FROM Credit c")
    Double getTotalCredits();

    @Query("SELECT SUM(c.totalEarned) FROM Credit c")
    Double getTotalEarned();

    @Query("SELECT SUM(c.totalSpent) FROM Credit c")
    Double getTotalSpent();

    @Query("SELECT SUM(c.totalTransferredOut) FROM Credit c")
    Double getTotalTransferred();

    @Query("SELECT AVG(c.balance) FROM Credit c")
    Double getAverageBalance();

    @Query("SELECT COUNT(c) FROM Credit c WHERE c.balance > :threshold")
    Long countUsersWithBalanceAbove(@Param("threshold") Double threshold);
}
