package com.listingservice.repositories;

import com.listingservice.entities.Listing;
import com.listingservice.enums.ListingStatus;
import com.listingservice.enums.ListingType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ListingRepository extends JpaRepository<Listing, UUID>, JpaSpecificationExecutor<Listing> {
    Page<Listing> findBySellerId(UUID sellerId, Pageable pageable);
    Page<Listing> findBySellerIdAndStatus(UUID sellerId, ListingStatus status, Pageable pageable);
    Long countBySellerId(UUID sellerId);
    Page<Listing> findByStatus(ListingStatus status, Pageable pageable);
    Page<Listing> findByListingType(ListingType listingType, Pageable pageable);
    Page<Listing> findByTripVerified(Boolean tripVerified, Pageable pageable);
    @Query("SELECT l FROM Listing l WHERE " +
            "LOWER(l.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(l.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Listing> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE " +
            "l.status = 'ACTIVE' AND " +
            "l.listingType = 'FIXED_PRICE' AND " +
            "l.pricePerKg BETWEEN :minPrice AND :maxPrice")
    Page<Listing> findByPriceRange(@Param("minPrice") Double minPrice,
                                   @Param("maxPrice") Double maxPrice,
                                   Pageable pageable);
    @Query("SELECT l FROM Listing l WHERE " +
            "l.co2Amount BETWEEN :minAmount AND :maxAmount")
    Page<Listing> findByCo2AmountRange(@Param("minAmount") Double minAmount,
                                       @Param("maxAmount") Double maxAmount,
                                       Pageable pageable);
    @Query("SELECT l FROM Listing l WHERE " +
            "l.status = 'ACTIVE' AND " +
            "l.availableAmount > 0")
    Page<Listing> findActiveWithAvailableAmount(Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE " +
            "l.listingType = 'AUCTION' AND " +
            "l.status = 'ACTIVE' AND " +
            "l.auctionEndTime > :now")
    Page<Listing> findActiveAuctions(@Param("now") Instant now, Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE " +
            "l.listingType = 'AUCTION' AND " +
            "l.status = 'ACTIVE' AND " +
            "l.auctionEndTime BETWEEN :now AND :endTime " +
            "ORDER BY l.auctionEndTime ASC")
    List<Listing> findEndingSoonAuctions(@Param("now") Instant now,
                                         @Param("endTime") Instant endTime);

    @Query("SELECT l FROM Listing l WHERE " +
            "l.listingType = 'AUCTION' AND " +
            "l.status = 'ACTIVE' AND " +
            "l.auctionEndTime < :now")
    List<Listing> findExpiredAuctions(@Param("now") Instant now);

    Long countByStatus(ListingStatus status);

    Long countByListingType(ListingType listingType);

    @Query("SELECT SUM(l.co2Amount) FROM Listing l WHERE l.status = :status")
    Double sumCo2AmountByStatus(@Param("status") ListingStatus status);

    @Query("SELECT SUM(l.availableAmount) FROM Listing l WHERE l.status = 'ACTIVE'")
    Double sumAvailableCo2();

    @Query("SELECT AVG(l.pricePerKg) FROM Listing l WHERE " +
            "l.listingType = 'FIXED_PRICE' AND " +
            "l.pricePerKg IS NOT NULL")
    Double getAveragePricePerKg();

    @Query("SELECT MIN(l.pricePerKg) FROM Listing l WHERE " +
            "l.listingType = 'FIXED_PRICE' AND " +
            "l.status = 'ACTIVE' AND " +
            "l.pricePerKg IS NOT NULL")
    Double getLowestPricePerKg();

    @Query("SELECT MAX(l.pricePerKg) FROM Listing l WHERE " +
            "l.listingType = 'FIXED_PRICE' AND " +
            "l.status = 'ACTIVE' AND " +
            "l.pricePerKg IS NOT NULL")
    Double getHighestPricePerKg();

    @Modifying
    @Query("UPDATE Listing l SET l.viewCount = l.viewCount + 1 WHERE l.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE Listing l SET l.status = :status, l.updatedAt = :updatedAt WHERE l.id = :id")
    void updateStatus(@Param("id") UUID id,
                      @Param("status") ListingStatus status,
                      @Param("updatedAt") Instant updatedAt);

    @Modifying
    @Query("UPDATE Listing l SET l.availableAmount = :amount, l.updatedAt = :updatedAt WHERE l.id = :id")
    void updateAvailableAmount(@Param("id") UUID id,
                               @Param("amount") Double amount,
                               @Param("updatedAt") Instant updatedAt);

    @Modifying
    @Query("UPDATE Listing l SET l.winnerId = :winnerId, l.status = 'SOLD', " +
            "l.soldAt = :soldAt, l.updatedAt = :updatedAt WHERE l.id = :id")
    void setAuctionWinner(@Param("id") UUID id,
                          @Param("winnerId") UUID winnerId,
                          @Param("soldAt") Instant soldAt,
                          @Param("updatedAt") Instant updatedAt);

    Optional<Listing> findByTripId(UUID tripId);

    @Modifying
    @Query("UPDATE Listing l SET l.tripVerified = :verified, l.updatedAt = :updatedAt WHERE l.tripId = :tripId")
    void updateTripVerification(@Param("tripId") UUID tripId,
                                @Param("verified") Boolean verified,
                                @Param("updatedAt") Instant updatedAt);

    @Query("SELECT l FROM Listing l WHERE " +
            "l.status = 'ACTIVE' AND " +
            "l.expiresAt IS NOT NULL AND " +
            "l.expiresAt < :now")
    List<Listing> findExpiredListings(@Param("now") Instant now);

    @Modifying
    @Query("UPDATE Listing l SET l.status = 'EXPIRED', l.updatedAt = :updatedAt WHERE " +
            "l.status = 'ACTIVE' AND " +
            "l.expiresAt < :now")
    int expireOldListings(@Param("now") Instant now, @Param("updatedAt") Instant updatedAt);
}
