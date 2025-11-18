package com.creditservice.events;

import com.creditservice.dtos.requests.AddCreditRequest;
import com.creditservice.services.CreditService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class VerificationEventListener {
    
    private final CreditService creditService;
    
    @PostConstruct
    public void init() {
        log.info("🎯🎯🎯 VerificationEventListener INITIALIZED - listening for verification.approved 🎯🎯🎯");
    }
    
    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(value = "credit_service_verification_queue", durable = "true"),
        exchange = @Exchange(value = "ccm.events", type = "topic", durable = "true"),
        key = "verification.approved"
    ))
    public void handleVerificationApproved(VerificationApprovedEvent event) {
        log.info("🎉 RECEIVED verification.approved event: {}", event);
        try {
            log.info("📨 Processing verification.approved for user: {} (trip: {}, credits: {})", 
                    event.getUserId(), event.getTripId(), event.getCreditsAwarded());
            
            UUID userId = UUID.fromString(event.getUserId());
            
            // Ensure user has credit account
            try {
                creditService.getCreditByUserId(userId);
            } catch (Exception e) {
                log.info("Creating new credit account for user {}", userId);
                creditService.createCreditAccount(userId);
            }
            
            // Add credits from verified trip
            AddCreditRequest request = new AddCreditRequest();
            request.setUserId(userId);
            request.setAmount(event.getCreditsAwarded() != null ? event.getCreditsAwarded() : event.getCo2SavedKg());
            request.setDescription("Carbon credits from verified EV trip " + event.getTripId().substring(0, 8) + "...");
            request.setRelatedTripId(UUID.fromString(event.getTripId()));
            
            creditService.addCredit(request);
            
            log.info("✅ Minted {} kg CO₂ credits for user {} from trip {}", 
                    request.getAmount(), userId, event.getTripId());
            
        } catch (Exception e) {
            log.error("❌ Failed to mint credits for verification.approved event", e);
            throw e; // Requeue message for retry
        }
    }
    
    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(value = "credit_service_certificate_revoked_queue", durable = "true"),
        exchange = @Exchange(value = "ccm.events", type = "topic", durable = "true"),
        key = "certificate.revoked"
    ))
    public void handleCertificateRevoked(CertificateRevokedEvent event) {
        log.info("🚫 RECEIVED certificate.revoked event: {}", event);
        try {
            log.info("📨 Processing certificate.revoked for user: {} (cert: {}, credits: {})", 
                    event.getUserId(), event.getCertificateId(), event.getCreditAmount());
            
            // Deduct credits due to certificate revocation
            // Note: User ID from certificate service is numeric, convert to UUID if needed
            UUID userId;
            try {
                userId = UUID.fromString(event.getUserId());
            } catch (IllegalArgumentException e) {
                // If numeric ID, convert to UUID format (00000000-0000-0000-0000-000000000XXX)
                String paddedId = String.format("%012d", Long.parseLong(event.getUserId()));
                userId = UUID.fromString("00000000-0000-0000-" + paddedId.substring(0, 4) + "-" + paddedId.substring(4));
            }
            
            // Deduct credits
            AddCreditRequest deductRequest = new AddCreditRequest();
            deductRequest.setUserId(userId);
            deductRequest.setAmount(-event.getCreditAmount()); // Negative to deduct
            deductRequest.setDescription("Certificate revoked (ID: " + event.getCertificateId() + "). Reason: " + event.getRevokeReason());
            
            creditService.addCredit(deductRequest);
            
            log.info("✅ Deducted {} kg CO₂ credits from user {} due to certificate revocation", 
                    event.getCreditAmount(), userId);
            
        } catch (Exception e) {
            log.error("❌ Failed to process certificate.revoked event", e);
            throw e; // Requeue message for retry
        }
    }
}
