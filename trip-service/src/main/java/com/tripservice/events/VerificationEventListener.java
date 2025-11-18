package com.tripservice.events;

import com.tripservice.constants.TripStatus;
import com.tripservice.entities.Trip;
import com.tripservice.repositories.TripRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import java.util.HashMap;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class VerificationEventListener {
    
    private final TripRepository tripRepository;
    private final RabbitTemplate rabbitTemplate;
    
    @PostConstruct
    public void init() {
        System.out.println("🎯🎯🎯 VerificationEventListener INITIALIZED 🎯🎯🎯");
    }
    
        @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "trip_service_verification_queue", durable = "true"),
            exchange = @Exchange(value = "ccm.events", type = "topic", durable = "true"),
            key = "verification.approved"
        ))
        public void handleVerificationApproved(VerificationApprovedEvent event) {
        System.out.println("🎉🎉🎉 RECEIVED verification.approved event: " + event);
        try {
            log.info("📨 Received verification.approved event for trip: {}", event.getTripId());
            
            UUID tripId = UUID.fromString(event.getTripId());
            Trip trip = tripRepository.findById(tripId).orElse(null);
            
            if (trip == null) {
                log.warn("⚠️ Trip not found: {}", tripId);
                return;
            }
            
            // Update trip status to VERIFIED
            trip.setStatus(TripStatus.VERIFIED);
            trip.setVerificationStatus("VERIFIED");
            trip.setVerifiedAt(Instant.now());
            if (event.getVerifierId() != null) {
                try {
                    // verifierId may not be a UUID in all publishers; ignore if invalid
                    UUID verifierUuid = UUID.fromString(event.getVerifierId());
                    trip.setVerifiedBy(verifierUuid);
                } catch (IllegalArgumentException ex) {
                    // leave verifiedBy as-is when verifierId is not a UUID
                }
            }
            trip.setUpdatedAt(Instant.now());
            
            tripRepository.save(trip);
            
            log.info("✅ Updated trip {} to VERIFIED status (verifier: {})", 
                    tripId, event.getVerifierId());

            // Publish trip.verified for downstream services (notification, etc.)
            try {
                HashMap<String, Object> msg = new HashMap<>();
                msg.put("eventType", "TripVerified");
                msg.put("tripId", tripId.toString());
                msg.put("userId", trip.getUserId() != null ? trip.getUserId().toString() : null);
                msg.put("verificationId", event.getVerificationId());
                msg.put("verifiedAt", Instant.now().toString());
                rabbitTemplate.convertAndSend("ccm.events", "trip.verified", msg);
                log.info("📤 Published trip.verified for trip {}", tripId);
            } catch (Exception pubEx) {
                log.warn("Failed to publish trip.verified for trip {}", tripId, pubEx);
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to handle verification.approved event", e);
        }
    }
}
