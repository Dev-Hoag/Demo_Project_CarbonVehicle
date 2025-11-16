package com.creditservice.services;

import com.creditservice.dtos.requests.AddCreditRequest;
import com.creditservice.dtos.requests.DeductCreditRequest;
import com.creditservice.dtos.requests.TransferCreditRequest;
import com.creditservice.dtos.response.CreditResponse;
import com.creditservice.dtos.response.CreditStatisticsResponse;
import com.creditservice.dtos.response.CreditTransactionResponse;
import com.creditservice.dtos.response.TransferCreditResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface CreditService {
    CreditResponse createCreditAccount(UUID userId);

    CreditResponse getCreditByUserId(UUID userId);

    CreditResponse addCredit(AddCreditRequest request);

    CreditResponse deductCredit(DeductCreditRequest request);

    TransferCreditResponse transferCredit(TransferCreditRequest request);

    Page<CreditResponse> getAllCredits(Pageable pageable);

    CreditTransactionResponse getTransactionById(UUID id);

    Page<CreditTransactionResponse> getTransactionsByUserId(UUID userId, Pageable pageable);

    List<CreditTransactionResponse> getRecentTransactionsByUserId(UUID userId, int limit);

    List<CreditTransactionResponse> getAllRecentTransactions(Instant since);

    CreditStatisticsResponse getCreditStatistics();
}
