package com.listingservice.mappers;

import com.listingservice.dtos.responses.TransactionResponse;
import com.listingservice.entities.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
@Slf4j
public class TransactionMapper {
    public TransactionResponse toResponse(Transaction transaction) {
        if (transaction == null) {
            return null;
        }

        log.debug("Converting Transaction entity {} to TransactionResponse", transaction.getId());

        // Format total price (e.g., "$1,234.56")
        String formattedTotalPrice = formatCurrency(transaction.getTotalPrice());

        return TransactionResponse.builder()
                .id(transaction.getId())
                .listingId(transaction.getListingId())
                .buyerId(transaction.getBuyerId())
                .buyerName(null) // TODO: Fetch from User Service via Feign Client
                .sellerId(transaction.getSellerId())
                .sellerName(null) // TODO: Fetch from User Service via Feign Client
                .co2Amount(transaction.getCo2Amount())
                .pricePerKg(transaction.getPricePerKg())
                .totalPrice(transaction.getTotalPrice())
                .transactionType(transaction.getTransactionType())
                .status(transaction.getStatus())
                .paymentStatus(transaction.getPaymentStatus())
                .createdAt(transaction.getCreatedAt())
                .notes(transaction.getNotes())
                .formattedTotalPrice(formattedTotalPrice)
                .build();
    }

    public List<TransactionResponse> toResponseList(List<Transaction> transactions) {
        if (transactions == null) {
            return List.of();
        }

        return transactions.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private String formatCurrency(Double amount) {
        if (amount == null) {
            return "$0.00";
        }

        NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(Locale.US);
        return currencyFormatter.format(amount);
    }
}
