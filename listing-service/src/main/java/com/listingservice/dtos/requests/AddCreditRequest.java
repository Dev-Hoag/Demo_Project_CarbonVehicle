package com.listingservice.dtos.requests;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddCreditRequest {
    private UUID userId;
    private Double amount;
    private UUID relatedTripId;
    private String description;
}
