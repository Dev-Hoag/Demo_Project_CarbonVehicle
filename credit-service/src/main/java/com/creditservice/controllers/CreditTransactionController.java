package com.creditservice.controllers;

import com.creditservice.dtos.response.ApiResponse;
import com.creditservice.dtos.response.CreditTransactionResponse;
import com.creditservice.services.CreditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/credit-transactions")
@RequiredArgsConstructor
@Slf4j
public class CreditTransactionController {
    private final CreditService creditService;

    /**
     * Get transaction by ID
     * GET /api/v1/credit-transactions/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CreditTransactionResponse>> getTransactionById(
            @PathVariable UUID id) {
        log.info("Fetching transaction by ID: {}", id);

        CreditTransactionResponse response = creditService.getTransactionById(id);
        var result = ApiResponse.<CreditTransactionResponse>builder()
                .status(200)
                .message("Success")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Get all transactions for a user
     * GET /api/v1/credit-transactions/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<CreditTransactionResponse>>> getTransactionsByUserId(
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Fetching transactions for user: {} - page: {}, size: {}",
                userId, pageable.getPageNumber(), pageable.getPageSize());

        Page<CreditTransactionResponse> response =
                creditService.getTransactionsByUserId(userId, pageable);
        var result = ApiResponse.<Page<CreditTransactionResponse>>builder()
                .status(200)
                .message("Success")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Get recent transactions for a user
     * GET /api/v1/credit-transactions/user/{userId}/recent
     */
    @GetMapping("/user/{userId}/recent")
    public ResponseEntity<ApiResponse<List<CreditTransactionResponse>>> getRecentTransactionsByUserId(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Fetching recent {} transactions for user: {}", limit, userId);

        List<CreditTransactionResponse> response =
                creditService.getRecentTransactionsByUserId(userId, limit);
        var result = ApiResponse.<List<CreditTransactionResponse>>builder()
                .status(200)
                .message("Success")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Get all recent transactions
     * GET /api/v1/credit-transactions/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<CreditTransactionResponse>>> getAllRecentTransactions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since) {
        log.info("Fetching all recent transactions since: {}", since);

        List<CreditTransactionResponse> response =
                creditService.getAllRecentTransactions(since);
        var result = ApiResponse.<List<CreditTransactionResponse>>builder()
                .status(200)
                .message("Success")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }
}
