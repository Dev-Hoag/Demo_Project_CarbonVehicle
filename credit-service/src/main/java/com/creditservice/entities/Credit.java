package com.creditservice.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "credits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Credit {
    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "balance", nullable = false)
    private Double balance = 0.0;

    @Column(name = "total_earned", nullable = false)
    private Double totalEarned = 0.0;

    @Column(name = "total_spent", nullable = false)
    private Double totalSpent = 0.0;

    @Column(name = "total_transferred_in", nullable = false)
    private Double totalTransferredIn = 0.0;

    @Column(name = "total_transferred_out", nullable = false)
    private Double totalTransferredOut = 0.0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (balance == null) balance = 0.0;
        if (totalEarned == null) totalEarned = 0.0;
        if (totalSpent == null) totalSpent = 0.0;
        if (totalTransferredIn == null) totalTransferredIn = 0.0;
        if (totalTransferredOut == null) totalTransferredOut = 0.0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Business methods
    public void addBalance(Double amount) {
        this.balance += amount;
        this.totalEarned += amount;
    }

    public void deductBalance(Double amount) {
        if (this.balance < amount) {
            throw new IllegalStateException("Insufficient credit balance");
        }
        this.balance -= amount;
        this.totalSpent += amount;
    }

    public void transferOut(Double amount) {
        if (this.balance < amount) {
            throw new IllegalStateException("Insufficient credit balance for transfer");
        }
        this.balance -= amount;
        this.totalTransferredOut += amount;
    }

    public void transferIn(Double amount) {
        this.balance += amount;
        this.totalTransferredIn += amount;
    }
}
