package com.tripservice.entities;

import com.tripservice.constants.TripStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trips")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Trip {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "co2_reduced")
    private Double co2Reduced;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TripStatus status;

    @Column(name = "verification_status")
    private String verificationStatus;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
