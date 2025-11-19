package com.creditservice.services.impl;

import com.creditservice.dtos.requests.AddCreditRequest;
import com.creditservice.dtos.requests.DeductCreditRequest;
import com.creditservice.dtos.requests.TransferCreditRequest;
import com.creditservice.dtos.response.CreditResponse;
import com.creditservice.dtos.response.CreditStatisticsResponse;
import com.creditservice.dtos.response.CreditTransactionResponse;
import com.creditservice.dtos.response.TransferCreditResponse;
import com.creditservice.entities.Credit;
import com.creditservice.entities.CreditTransaction;
import com.creditservice.enums.TransactionType;
import com.creditservice.exceptions.*;
import com.creditservice.mappers.CreditMapper;
import com.creditservice.mappers.CreditStatisticsMapper;
import com.creditservice.mappers.CreditTransactionMapper;
import com.creditservice.repositories.CreditRepository;
import com.creditservice.repositories.CreditTransactionRepository;
import com.creditservice.services.CreditService;
import com.creditservice.events.EventPublisher;
import com.creditservice.events.CreditEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CreditServiceImpl implements CreditService {
    private final CreditRepository creditRepository;
    private final CreditTransactionRepository transactionRepository;
    private final CreditMapper creditMapper;
    private final CreditTransactionMapper transactionMapper;
    private final CreditStatisticsMapper statisticsMapper;
    private final EventPublisher eventPublisher;

    @Override
    public CreditResponse createCreditAccount(UUID userId) {
        log.info("Creating credit account for user: {}", userId);

        // Check if account already exists
        if (creditRepository.existsByUserId(userId)) {
            throw new DuplicateCreditAccountException(
                    "Credit account already exists for user ID: " + userId
            );
        }

        // Create new credit account
        Credit credit = Credit.builder()
                .userId(userId)
                .balance(0.0)
                .totalEarned(0.0)
                .totalSpent(0.0)
                .totalTransferredIn(0.0)
                .totalTransferredOut(0.0)
                .build();

        Credit savedCredit = creditRepository.save(credit);

        log.info("Credit account created successfully for user: {}", userId);

        return creditMapper.toResponse(savedCredit);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "creditAccount", key = "#userId.toString()")
    public CreditResponse getCreditByUserId(UUID userId) {
        log.info("[CACHE MISS] Fetching credit account for user: {}", userId);

        Credit credit = creditRepository.findByUserId(userId)
                .orElseThrow(() -> new CreditNotFoundException(userId));

        return creditMapper.toResponse(credit);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "creditAccount", key = "#request.userId.toString()"),
        @CacheEvict(value = "transactionHistory", key = "#request.userId.toString()"),
        @CacheEvict(value = "recentTransactions", key = "#request.userId.toString()"),
        @CacheEvict(value = "creditStatistics", allEntries = true)
    })
    public CreditResponse addCredit(AddCreditRequest request) {
        log.info("[CACHE INVALIDATE] Adding {} credits to user: {}", request.getAmount(), request.getUserId());

        // Validate amount
        if (request.getAmount() <= 0) {
            throw new InvalidCreditOperationException("Amount must be greater than 0");
        }

        // Get or create credit account
        Credit credit = creditRepository.findByUserId(request.getUserId())
                .orElseGet(() -> {
                    log.info("Credit account not found, creating new one for user: {}",
                            request.getUserId());
                    Credit newCredit = Credit.builder()
                            .userId(request.getUserId())
                            .balance(0.0)
                            .totalEarned(0.0)
                            .totalSpent(0.0)
                            .totalTransferredIn(0.0)
                            .totalTransferredOut(0.0)
                            .build();
                    return creditRepository.save(newCredit);
                });

        // Record balance before transaction
        Double balanceBefore = credit.getBalance();

        // Add credits
        credit.addBalance(request.getAmount());

        // Save updated credit
        Credit updatedCredit = creditRepository.save(credit);

        // Create transaction record
        CreditTransaction transaction = CreditTransaction.builder()
                .userId(request.getUserId())
                .transactionType(TransactionType.EARNED_FROM_TRIP)
                .amount(request.getAmount())
                .balanceBefore(balanceBefore)
                .balanceAfter(updatedCredit.getBalance())
                .relatedTripId(request.getRelatedTripId())
                .description(request.getDescription() != null ?
                        request.getDescription() : "Credits earned from trip")
                .build();

        transactionRepository.save(transaction);

        log.info("Successfully added {} credits to user: {}. New balance: {}",
                request.getAmount(), request.getUserId(), updatedCredit.getBalance());

        // Publish credit.issued event
        CreditEvent event = CreditEvent.creditIssued(
                request.getUserId(),
                request.getAmount(),
                "TRIP",
                request.getRelatedTripId(),
                request.getDescription()
        );
        eventPublisher.publishCreditIssued(event);

        return creditMapper.toResponse(updatedCredit);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "creditAccount", key = "#request.userId.toString()"),
        @CacheEvict(value = "transactionHistory", key = "#request.userId.toString()"),
        @CacheEvict(value = "recentTransactions", key = "#request.userId.toString()"),
        @CacheEvict(value = "creditStatistics", allEntries = true)
    })
    public CreditResponse deductCredit(DeductCreditRequest request) {
        log.info("[CACHE INVALIDATE] Deducting {} credits from user: {}", request.getAmount(), request.getUserId());

        // Validate amount
        if (request.getAmount() <= 0) {
            throw new InvalidCreditOperationException("Amount must be greater than 0");
        }

        // Get credit account
        Credit credit = creditRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new CreditNotFoundException(request.getUserId()));

        // Check sufficient balance
        if (credit.getBalance() < request.getAmount()) {
            throw new InsufficientCreditException(request.getAmount(), credit.getBalance());
        }

        // Record balance before transaction
        Double balanceBefore = credit.getBalance();

        // Deduct credits
        credit.deductBalance(request.getAmount());

        // Save updated credit
        Credit updatedCredit = creditRepository.save(credit);

        // Create transaction record
        CreditTransaction transaction = CreditTransaction.builder()
                .userId(request.getUserId())
                .transactionType(TransactionType.PURCHASED_FROM_MARKETPLACE)
                .amount(request.getAmount())
                .balanceBefore(balanceBefore)
                .balanceAfter(updatedCredit.getBalance())
                .relatedListingId(request.getRelatedListingId())
                .description(request.getDescription() != null ?
                        request.getDescription() : "Credits spent on marketplace purchase")
                .build();

        transactionRepository.save(transaction);

        log.info("Successfully deducted {} credits from user: {}. New balance: {}",
                request.getAmount(), request.getUserId(), updatedCredit.getBalance());

        return creditMapper.toResponse(updatedCredit);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "creditAccount", key = "#request.fromUserId.toString()"),
        @CacheEvict(value = "creditAccount", key = "#request.toUserId.toString()"),
        @CacheEvict(value = "transactionHistory", key = "#request.fromUserId.toString()"),
        @CacheEvict(value = "transactionHistory", key = "#request.toUserId.toString()"),
        @CacheEvict(value = "recentTransactions", key = "#request.fromUserId.toString()"),
        @CacheEvict(value = "recentTransactions", key = "#request.toUserId.toString()"),
        @CacheEvict(value = "creditStatistics", allEntries = true)
    })
    public TransferCreditResponse transferCredit(TransferCreditRequest request) {
        log.info("[CACHE INVALIDATE] Transferring {} credits from user: {} to user: {}",
                request.getAmount(), request.getFromUserId(), request.getToUserId());

        // Validate amount
        if (request.getAmount() <= 0) {
            throw new InvalidCreditOperationException("Transfer amount must be greater than 0");
        }

        // Validate not transferring to self
        if (request.getFromUserId().equals(request.getToUserId())) {
            throw new InvalidCreditOperationException("Cannot transfer credits to yourself");
        }

        // Get sender's credit account
        Credit senderCredit = creditRepository.findByUserId(request.getFromUserId())
                .orElseThrow(() -> new CreditNotFoundException(request.getFromUserId()));

        // Check sufficient balance
        if (senderCredit.getBalance() < request.getAmount()) {
            throw new InsufficientCreditException(request.getAmount(), senderCredit.getBalance());
        }

        // Get or create receiver's credit account
        Credit receiverCredit = creditRepository.findByUserId(request.getToUserId())
                .orElseGet(() -> {
                    log.info("Creating credit account for receiver: {}", request.getToUserId());
                    Credit newCredit = Credit.builder()
                            .userId(request.getToUserId())
                            .balance(0.0)
                            .totalEarned(0.0)
                            .totalSpent(0.0)
                            .totalTransferredIn(0.0)
                            .totalTransferredOut(0.0)
                            .build();
                    return creditRepository.save(newCredit);
                });

        // Record balances before transfer
        Double senderBalanceBefore = senderCredit.getBalance();
        Double receiverBalanceBefore = receiverCredit.getBalance();

        // Execute transfer
        senderCredit.transferOut(request.getAmount());
        receiverCredit.transferIn(request.getAmount());

        // Save updated credits
        Credit updatedSenderCredit = creditRepository.save(senderCredit);
        Credit updatedReceiverCredit = creditRepository.save(receiverCredit);

        // Create sender transaction record
        CreditTransaction senderTransaction = CreditTransaction.builder()
                .userId(request.getFromUserId())
                .transactionType(TransactionType.TRANSFERRED_OUT)
                .amount(request.getAmount())
                .balanceBefore(senderBalanceBefore)
                .balanceAfter(updatedSenderCredit.getBalance())
                .relatedUserId(request.getToUserId())
                .description(request.getDescription() != null ?
                        request.getDescription() :
                        "Credits transferred to user " + request.getToUserId())
                .build();

        CreditTransaction savedSenderTransaction = transactionRepository.save(senderTransaction);

        // Create receiver transaction record
        CreditTransaction receiverTransaction = CreditTransaction.builder()
                .userId(request.getToUserId())
                .transactionType(TransactionType.TRANSFERRED_IN)
                .amount(request.getAmount())
                .balanceBefore(receiverBalanceBefore)
                .balanceAfter(updatedReceiverCredit.getBalance())
                .relatedUserId(request.getFromUserId())
                .description(request.getDescription() != null ?
                        request.getDescription() :
                        "Credits received from user " + request.getFromUserId())
                .build();

        CreditTransaction savedReceiverTransaction = transactionRepository.save(receiverTransaction);

        log.info("Successfully transferred {} credits from user: {} to user: {}",
                request.getAmount(), request.getFromUserId(), request.getToUserId());

        // Build response
        String message = String.format(
                "Successfully transferred %.2f kg CO2 credits from %s to %s",
                request.getAmount(), request.getFromUserId(), request.getToUserId()
        );

        return TransferCreditResponse.builder()
                .senderTransaction(transactionMapper.toResponse(savedSenderTransaction))
                .receiverTransaction(transactionMapper.toResponse(savedReceiverTransaction))
                .message(message)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CreditResponse> getAllCredits(Pageable pageable) {
        log.info("Fetching all credit accounts - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        return creditRepository.findAll(pageable)
                .map(creditMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CreditTransactionResponse getTransactionById(UUID id) {
        log.info("Fetching transaction by ID: {}", id);

        CreditTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new CreditTransactionNotFoundException(id));

        return transactionMapper.toResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "transactionHistory", key = "#userId.toString() + '_page_' + #pageable.pageNumber + '_size_' + #pageable.pageSize")
    public Page<CreditTransactionResponse> getTransactionsByUserId(UUID userId, Pageable pageable) {
        log.info("[CACHE MISS] Fetching transactions for user: {} - page: {}, size: {}",
                userId, pageable.getPageNumber(), pageable.getPageSize());

        return transactionRepository.findByUserId(userId, pageable)
                .map(transactionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "recentTransactions", key = "#userId.toString() + '_limit_' + #limit")
    public List<CreditTransactionResponse> getRecentTransactionsByUserId(UUID userId, int limit) {
        log.info("[CACHE MISS] Fetching recent {} transactions for user: {}", limit, userId);

        Pageable pageable = PageRequest.of(0, limit);
        List<CreditTransaction> transactions =
                transactionRepository.findRecentByUserId(userId, pageable);

        return transactionMapper.toResponseList(transactions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreditTransactionResponse> getAllRecentTransactions(Instant since) {
        log.info("Fetching all recent transactions since: {}", since);

        List<CreditTransaction> transactions =
                transactionRepository.findRecentTransactions(since);

        return transactionMapper.toResponseList(transactions);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "creditStatistics", key = "'global'")
    public CreditStatisticsResponse getCreditStatistics() {
        log.info("[CACHE MISS] Calculating credit statistics");

        Long totalUsersCount = creditRepository.count();
        Integer totalUsers = totalUsersCount.intValue();

        Double totalCredits = creditRepository.getTotalCredits();
        Double totalEarned = creditRepository.getTotalEarned();
        Double totalSpent = creditRepository.getTotalSpent();
        Double totalTransferred = creditRepository.getTotalTransferred();
        Double averageBalance = creditRepository.getAverageBalance();

        return statisticsMapper.toStatisticsResponse(
                totalUsers,
                totalCredits,
                totalEarned,
                totalSpent,
                totalTransferred,
                averageBalance
        );
    }
}
