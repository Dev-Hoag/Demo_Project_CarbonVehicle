package com.creditservice.mappers;

import com.creditservice.dtos.response.CreditTransactionResponse;
import com.creditservice.entities.CreditTransaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
@Slf4j
public class CreditTransactionMapper {
    public CreditTransactionResponse toResponse(CreditTransaction transaction) {
        if (transaction == null) {
            return null;
        }

        log.debug("Converting CreditTransaction entity {} to CreditTransactionResponse",
                transaction.getId());

        // Format time ago
        String timeAgo = formatTimeAgo(transaction.getCreatedAt());

        // Format amount with sign
        String formattedAmount = formatAmountWithSign(
                transaction.getAmount(),
                transaction.getTransactionType()
        );

        return CreditTransactionResponse.builder()
                .id(transaction.getId())
                .userId(transaction.getUserId())
                .transactionType(transaction.getTransactionType())
                .transactionTypeDisplay(transaction.getTransactionType() != null ?
                        transaction.getTransactionType().getDisplayName() : null)
                .amount(transaction.getAmount())
                .balanceBefore(transaction.getBalanceBefore())
                .balanceAfter(transaction.getBalanceAfter())
                .relatedUserId(transaction.getRelatedUserId())
                .relatedTripId(transaction.getRelatedTripId())
                .relatedListingId(transaction.getRelatedListingId())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .timeAgo(timeAgo)
                .formattedAmount(formattedAmount)
                .build();
    }

    public List<CreditTransactionResponse> toResponseList(List<CreditTransaction> transactions) {
        if (transactions == null) {
            return List.of();
        }

        return transactions.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private String formatTimeAgo(Instant instant) {
        if (instant == null) {
            return "Unknown";
        }

        Duration duration = Duration.between(instant, Instant.now());
        long seconds = duration.getSeconds();

        if (seconds < 60) {
            return "Just now";
        } else if (seconds < 3600) {
            long minutes = seconds / 60;
            return minutes + (minutes == 1 ? " minute ago" : " minutes ago");
        } else if (seconds < 86400) {
            long hours = seconds / 3600;
            return hours + (hours == 1 ? " hour ago" : " hours ago");
        } else if (seconds < 2592000) { // 30 days
            long days = seconds / 86400;
            return days + (days == 1 ? " day ago" : " days ago");
        } else if (seconds < 31536000) { // 365 days
            long months = seconds / 2592000;
            return months + (months == 1 ? " month ago" : " months ago");
        } else {
            long years = seconds / 31536000;
            return years + (years == 1 ? " year ago" : " years ago");
        }
    }

    private String formatAmountWithSign(Double amount,
                                        com.creditservice.enums.TransactionType type) {
        if (amount == null) {
            return "0.00 kg CO2";
        }

        NumberFormat numberFormat = NumberFormat.getNumberInstance(Locale.US);
        numberFormat.setMinimumFractionDigits(2);
        numberFormat.setMaximumFractionDigits(2);

        String formattedNumber = numberFormat.format(amount);

        // Determine if this is a credit (+) or debit (-) transaction
        String sign;
        switch (type) {
            case EARNED_FROM_TRIP:
            case TRANSFERRED_IN:
            case ADJUSTMENT:
                sign = "+";
                break;
            case PURCHASED_FROM_MARKETPLACE:
            case SOLD_TO_MARKETPLACE:
            case TRANSFERRED_OUT:
                sign = "-";
                break;
            default:
                sign = "";
        }

        return sign + formattedNumber + " kg CO2";
    }
}
