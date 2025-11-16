package com.listingservice.repositories;

import com.listingservice.entities.Bid;
import com.listingservice.enums.BidStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidRepository extends JpaRepository<Bid, UUID> {
    @Query("SELECT b FROM Bid b WHERE b.listing.id = :listingId ORDER BY b.bidAmount DESC, b.createdAt DESC")
    List<Bid> findByListingIdOrderByBidAmountDesc(@Param("listingId") UUID listingId);

    @Query("SELECT b FROM Bid b WHERE b.listing.id = :listingId ORDER BY b.bidAmount DESC, b.createdAt DESC")
    Page<Bid> findByListingId(@Param("listingId") UUID listingId, Pageable pageable);

    Page<Bid> findByBidderId(UUID bidderId, Pageable pageable);

    Page<Bid> findByBidderIdAndStatus(UUID bidderId, BidStatus status, Pageable pageable);

    @Query("SELECT COUNT(b) FROM Bid b WHERE b.listing.id = :listingId")
    Integer countByListingId(@Param("listingId") UUID listingId);

    Long countByBidderId(UUID bidderId);

    @Query("SELECT b FROM Bid b WHERE b.listing.id = :listingId " +
            "ORDER BY b.bidAmount DESC, b.createdAt ASC")
    Optional<Bid> findHighestBidByListingId(@Param("listingId") UUID listingId);

    @Query("SELECT MAX(b.bidAmount) FROM Bid b WHERE b.listing.id = :listingId")
    Optional<Double> getHighestBidAmount(@Param("listingId") UUID listingId);

    @Query("SELECT b FROM Bid b WHERE b.listing.id = :listingId AND b.isWinning = true")
    Optional<Bid> findWinningBid(@Param("listingId") UUID listingId);

    @Query("SELECT b FROM Bid b WHERE b.listing.id = :listingId AND b.bidderId = :bidderId " +
            "ORDER BY b.createdAt DESC")
    Optional<Bid> findUserBidOnListing(@Param("listingId") UUID listingId,
                                       @Param("bidderId") UUID bidderId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Bid b " +
            "WHERE b.listing.id = :listingId AND b.bidderId = :bidderId")
    Boolean hasUserBidOnListing(@Param("listingId") UUID listingId,
                                @Param("bidderId") UUID bidderId);

    @Query("SELECT b FROM Bid b WHERE b.bidderId = :bidderId AND b.status = 'ACTIVE' " +
            "ORDER BY b.createdAt DESC")
    List<Bid> findActiveBidsByBidder(@Param("bidderId") UUID bidderId);

    @Query("SELECT b FROM Bid b WHERE b.bidderId = :bidderId AND b.status = 'WON' " +
            "ORDER BY b.createdAt DESC")
    List<Bid> findWinningBidsByBidder(@Param("bidderId") UUID bidderId);

    @Query("SELECT COUNT(DISTINCT b.bidderId) FROM Bid b WHERE b.listing.id = :listingId")
    Integer countUniqueBiddersByListingId(@Param("listingId") UUID listingId);

    @Query("SELECT AVG(b.bidAmount) FROM Bid b WHERE b.listing.id = :listingId")
    Optional<Double> getAverageBidAmount(@Param("listingId") UUID listingId);

    Long countByStatus(BidStatus status);

    @Modifying
    @Query("UPDATE Bid b SET b.status = 'OUTBID', b.isWinning = false, b.updatedAt = :updatedAt " +
            "WHERE b.listing.id = :listingId AND b.id != :excludeBidId AND b.status = 'ACTIVE'")
    void markOtherBidsAsOutbid(@Param("listingId") UUID listingId,
                               @Param("excludeBidId") UUID excludeBidId,
                               @Param("updatedAt") Instant updatedAt);

    @Modifying
    @Query("UPDATE Bid b SET b.status = 'WON', b.isWinning = true, b.updatedAt = :updatedAt " +
            "WHERE b.id = :bidId")
    void setAsWinningBid(@Param("bidId") UUID bidId, @Param("updatedAt") Instant updatedAt);

    @Modifying
    @Query("UPDATE Bid b SET b.status = 'LOST', b.isWinning = false, b.updatedAt = :updatedAt " +
            "WHERE b.listing.id = :listingId AND b.id != :winningBidId")
    void markNonWinningBidsAsLost(@Param("listingId") UUID listingId,
                                  @Param("winningBidId") UUID winningBidId,
                                  @Param("updatedAt") Instant updatedAt);

    @Modifying
    @Query("UPDATE Bid b SET b.status = 'CANCELLED', b.updatedAt = :updatedAt WHERE b.id = :bidId")
    void cancelBid(@Param("bidId") UUID bidId, @Param("updatedAt") Instant updatedAt);

    @Query("SELECT b FROM Bid b WHERE b.createdAt > :since ORDER BY b.createdAt DESC")
    List<Bid> findRecentBids(@Param("since") Instant since);

    @Query("SELECT b FROM Bid b WHERE b.listing.id = :listingId " +
            "ORDER BY b.createdAt DESC")
    List<Bid> findTopNRecentBids(@Param("listingId") UUID listingId, Pageable pageable);
}
