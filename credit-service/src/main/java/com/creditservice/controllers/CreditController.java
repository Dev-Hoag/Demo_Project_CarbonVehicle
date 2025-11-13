package com.creditservice.controllers;

import com.creditservice.dtos.requests.AddCreditRequest;
import com.creditservice.dtos.requests.DeductCreditRequest;
import com.creditservice.dtos.requests.TransferCreditRequest;
import com.creditservice.dtos.response.ApiResponse;
import com.creditservice.dtos.response.CreditResponse;
import com.creditservice.dtos.response.CreditStatisticsResponse;
import com.creditservice.dtos.response.TransferCreditResponse;
import com.creditservice.services.CreditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/credits")
@RequiredArgsConstructor
@Slf4j
public class CreditController {
    private final CreditService creditService;

    /**
     * Create a new credit account for a user
     * POST /api/v1/credits
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CreditResponse>> createCreditAccount(
            @RequestParam UUID userId) {
        log.info("Creating credit account for user: {}", userId);

        CreditResponse response = creditService.createCreditAccount(userId);
        var result = ApiResponse.<CreditResponse>builder()
                .status(200)
                .message("Credit account created")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Get credit account by user ID
     * GET /api/v1/credits/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<CreditResponse>> getCreditByUserId(
            @PathVariable UUID userId) {
        log.info("Fetching credit account for user: {}", userId);

        CreditResponse response = creditService.getCreditByUserId(userId);
        var result = ApiResponse.<CreditResponse>builder()
                .status(200)
                .message("Credit account fetched")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Add credits to user account
     * POST /api/v1/credits/add
     */
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<CreditResponse>> addCredit(
            @Valid @RequestBody AddCreditRequest request) {
        log.info("Adding {} credits to user: {}", request.getAmount(), request.getUserId());

        CreditResponse response = creditService.addCredit(request);
        var result = ApiResponse.<CreditResponse>builder()
                .status(200)
                .message("Credit added")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Deduct credits from user account
     * POST /api/v1/credits/deduct
     */
    @PostMapping("/deduct")
    public ResponseEntity<ApiResponse<CreditResponse>> deductCredit(
            @Valid @RequestBody DeductCreditRequest request) {
        log.info("Deducting {} credits from user: {}", request.getAmount(), request.getUserId());

        CreditResponse response = creditService.deductCredit(request);
        var result = ApiResponse.<CreditResponse>builder()
                .status(200)
                .message("Credit deducted")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Transfer credits between users
     * POST /api/v1/credits/transfer
     */
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransferCreditResponse>> transferCredit(
            @Valid @RequestBody TransferCreditRequest request) {
        log.info("Transferring {} credits from user: {} to user: {}",
                request.getAmount(), request.getFromUserId(), request.getToUserId());

        TransferCreditResponse response = creditService.transferCredit(request);
        var result = ApiResponse.<TransferCreditResponse>builder()
                .status(200)
                .message("Credit transferred")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Get all credit accounts (admin)
     * GET /api/v1/credits
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CreditResponse>>> getAllCredits(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Fetching all credit accounts - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<CreditResponse> response = creditService.getAllCredits(pageable);
        var result = ApiResponse.<Page<CreditResponse>>builder()
                .status(200)
                .message("All credit accounts fetched")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }

    /**
     * Get credit statistics
     * GET /api/v1/credits/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<CreditStatisticsResponse>> getCreditStatistics() {
        log.info("Fetching credit statistics");

        CreditStatisticsResponse response = creditService.getCreditStatistics();
        var result = ApiResponse.<CreditStatisticsResponse>builder()
                .status(200)
                .message("Credit statistics fetched")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatus()).body(result);
    }
}
