package com.creditservice.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferCreditResponse {
    private CreditTransactionResponse senderTransaction;
    private CreditTransactionResponse receiverTransaction;
    private String message;
}
