package com.creditservice.mappers;

import com.creditservice.dtos.response.CreditResponse;
import com.creditservice.entities.Credit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
@Slf4j
public class CreditMapper {
    public CreditResponse toResponse(Credit credit) {
        if (credit == null) {
            return null;
        }

        log.debug("Converting Credit entity {} to CreditResponse", credit.getId());

        // Format balance
        String formattedBalance = formatCreditAmount(credit.getBalance());

        return CreditResponse.builder()
                .id(credit.getId())
                .userId(credit.getUserId())
                .balance(credit.getBalance())
                .totalEarned(credit.getTotalEarned())
                .totalSpent(credit.getTotalSpent())
                .totalTransferredIn(credit.getTotalTransferredIn())
                .totalTransferredOut(credit.getTotalTransferredOut())
                .createdAt(credit.getCreatedAt())
                .updatedAt(credit.getUpdatedAt())
                .formattedBalance(formattedBalance)
                .build();
    }

    public List<CreditResponse> toResponseList(List<Credit> credits) {
        if (credits == null) {
            return List.of();
        }

        return credits.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private String formatCreditAmount(Double amount) {
        if (amount == null) {
            return "0.00 kg CO2";
        }

        NumberFormat numberFormat = NumberFormat.getNumberInstance(Locale.US);
        numberFormat.setMinimumFractionDigits(2);
        numberFormat.setMaximumFractionDigits(2);

        return numberFormat.format(amount) + " kg CO2";
    }
}
