package com.listingservice.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseCompletedResponse {
    private TransactionResponse transaction;
    private ListingResponse listing;
    private String message;
//    private String paymentUrl;
}
