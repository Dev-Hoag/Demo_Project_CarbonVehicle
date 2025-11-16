package com.creditservice.events;

import com.creditservice.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {
    
    private final RabbitTemplate rabbitTemplate;
    
    public void publishCreditIssued(CreditEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.CREDIT_ISSUED_ROUTING_KEY,
                    event
            );
            log.info("📤 Published credit.issued event for user: {}, amount: {}", 
                    event.getUserId(), event.getAmount());
        } catch (Exception e) {
            log.error("❌ Failed to publish credit.issued event", e);
        }
    }
}
