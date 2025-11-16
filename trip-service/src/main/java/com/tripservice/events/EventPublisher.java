package com.tripservice.events;

import com.tripservice.configs.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {
    
    private final RabbitTemplate rabbitTemplate;
    
    public void publishTripVerified(TripEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.TRIP_VERIFIED_ROUTING_KEY,
                    event
            );
            log.info("📤 Published trip.verified event for trip: {}, user: {}", 
                    event.getTripId(), event.getUserId());
        } catch (Exception e) {
            log.error("❌ Failed to publish trip.verified event", e);
        }
    }
}
