package com.listingservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditPurchasedEvent {
    private String eventType;
    private UUID transactionId;
    private UUID listingId;
    private UUID buyerId;
    private UUID sellerId;
    private Double creditAmount; // CO2 amount purchased
    private Double totalPrice;
    private Double pricePerKg;
    private Instant purchasedAt;
    private UUID tripId; // Optional: if listing linked to trip
}
