package com.listingservice.controllers;

import com.listingservice.dtos.requests.PurchaseRequest;
import com.listingservice.dtos.responses.ApiResponse;
import com.listingservice.dtos.responses.PurchaseCompletedResponse;
import com.listingservice.dtos.responses.TransactionResponse;
import com.listingservice.services.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {
    private final TransactionService transactionService;

    @PostMapping("/listings/{listingId}/purchase")
    public ResponseEntity<ApiResponse<PurchaseCompletedResponse>> purchaseListing(
            @PathVariable UUID listingId,
            @Valid @RequestBody PurchaseRequest request) {
        log.info("Processing purchase for listing: {} by buyer: {} with amount: {} kg",
                listingId, request.getBuyerId(), request.getAmount());

        PurchaseCompletedResponse response = transactionService.purchaseListing(listingId, request);
        var result = ApiResponse.<PurchaseCompletedResponse>builder()
                .statusCode(200)
                .message(response.getMessage())
                .data(response)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionById(
            @PathVariable UUID id) {
        log.info("Fetching transaction with id: {}", id);

        TransactionResponse response = transactionService.getTransactionById(id);
        var result = ApiResponse.<TransactionResponse>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactionsByBuyer(
            @PathVariable UUID buyerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Fetching transactions by buyer: {}", buyerId);

        Page<TransactionResponse> response = transactionService.getTransactionsByBuyer(buyerId, pageable);
        var result = ApiResponse.<Page<TransactionResponse>>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactionsBySeller(
            @PathVariable UUID sellerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Fetching transactions by seller: {}", sellerId);

        Page<TransactionResponse> response = transactionService.getTransactionsBySeller(sellerId, pageable);
        var result = ApiResponse.<Page<TransactionResponse>>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactionsByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Fetching transactions by status: {}", status);

        Page<TransactionResponse> response = transactionService.getTransactionsByStatus(status, pageable);
        var result = ApiResponse.<Page<TransactionResponse>>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getRecentTransactions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since) {
        log.info("Fetching recent transactions since: {}", since);

        List<TransactionResponse> response = transactionService.getRecentTransactions(since);
        var result = ApiResponse.<List<TransactionResponse>>builder()
                .statusCode(200)
                .message("OK")
                .data(response)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/seller/{sellerId}/revenue")
    public ResponseEntity<ApiResponse<Double>> getTotalRevenueBySeller(
            @PathVariable UUID sellerId) {
        log.info("Calculating total revenue for seller: {}", sellerId);

        Double revenue = transactionService.getTotalRevenueBySeller(sellerId);
        var result = ApiResponse.<Double>builder()
                .statusCode(200)
                .message("OK")
                .data(revenue)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/buyer/{buyerId}/spending")
    public ResponseEntity<ApiResponse<Double>> getTotalSpendingByBuyer(
            @PathVariable UUID buyerId) {
        log.info("Calculating total spending for buyer: {}", buyerId);

        Double spending = transactionService.getTotalSpendingByBuyer(buyerId);
        var result = ApiResponse.<Double>builder()
                .statusCode(200)
                .message("OK")
                .data(spending)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/buyer/{buyerId}/co2-purchased")
    public ResponseEntity<ApiResponse<Double>> getTotalCo2PurchasedByBuyer(
            @PathVariable UUID buyerId) {
        log.info("Calculating total CO2 purchased by buyer: {}", buyerId);

        Double co2Amount = transactionService.getTotalCo2PurchasedByBuyer(buyerId);
        var result = ApiResponse.<Double>builder()
                .statusCode(200)
                .message("OK")
                .data(co2Amount)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }

    @GetMapping("/seller/{sellerId}/co2-sold")
    public ResponseEntity<ApiResponse<Double>> getTotalCo2SoldBySeller(
            @PathVariable UUID sellerId) {
        log.info("Calculating total CO2 sold by seller: {}", sellerId);

        Double co2Amount = transactionService.getTotalCo2SoldBySeller(sellerId);
        var result = ApiResponse.<Double>builder()
                .statusCode(200)
                .message("OK")
                .data(co2Amount)
                .build();

        return ResponseEntity.status(result.getStatusCode()).body(result);
    }
}
