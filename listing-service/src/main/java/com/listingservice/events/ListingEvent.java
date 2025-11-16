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
public class ListingEvent {
    private String eventType;
    private UUID listingId;
    private UUID userId;
    private String listingTitle;
    private Double creditAmount;
    private Double price;
    private String currency;
    private String status;
    private Instant timestamp;
    
    public static ListingEvent listingCreated(UUID listingId, UUID sellerId, String title, Double creditAmount, Double price) {
        return ListingEvent.builder()
                .eventType("listing.created")
                .listingId(listingId)
                .userId(sellerId)
                .listingTitle(title)
                .creditAmount(creditAmount)
                .price(price)
                .currency("VND")
                .status("ACTIVE")
                .timestamp(Instant.now())
                .build();
    }
    
    public static ListingEvent listingSold(UUID listingId, UUID sellerId, String title, Double creditAmount, Double price) {
        return ListingEvent.builder()
                .eventType("listing.sold")
                .listingId(listingId)
                .userId(sellerId)
                .listingTitle(title)
                .creditAmount(creditAmount)
                .price(price)
                .currency("VND")
                .status("SOLD")
                .timestamp(Instant.now())
                .build();
    }
}
