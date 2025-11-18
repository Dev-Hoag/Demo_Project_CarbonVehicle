package com.listingservice.events;

import com.listingservice.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {
    
    private final RabbitTemplate rabbitTemplate;
    
    public void publishListingCreated(ListingEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.LISTING_CREATED_ROUTING_KEY,
                    event
            );
            log.info("📤 Published listing.created event for listing: {}, seller: {}", 
                    event.getListingId(), event.getUserId());
        } catch (Exception e) {
            log.error("❌ Failed to publish listing.created event", e);
        }
    }
    
    public void publishListingSold(ListingEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.LISTING_SOLD_ROUTING_KEY,
                    event
            );
            log.info("📤 Published listing.sold event for listing: {}, seller: {}", 
                    event.getListingId(), event.getUserId());
        } catch (Exception e) {
            log.error("❌ Failed to publish listing.sold event", e);
        }
    }
    
    public void publishCreditPurchased(CreditPurchasedEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.CREDIT_PURCHASED_ROUTING_KEY,
                    event
            );
            log.info("📤 Published credit.purchased event for transaction: {}, buyer: {}, amount: {} kg",
                    event.getTransactionId(), event.getBuyerId(), event.getCreditAmount());
        } catch (Exception e) {
            log.error("❌ Failed to publish credit.purchased event", e);
        }
    }
}
