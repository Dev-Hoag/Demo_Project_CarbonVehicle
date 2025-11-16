package com.tripservice.repositories;

import com.tripservice.entities.Trip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {

    Page<Trip> findByUserId(UUID userId, Pageable pageable);

    long countByUserId(UUID userId);
}
