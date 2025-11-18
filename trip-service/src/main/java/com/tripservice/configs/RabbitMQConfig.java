package com.tripservice.configs;

import com.tripservice.events.VerificationEventListener;
import jakarta.annotation.PostConstruct;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    
    @PostConstruct
    public void init() {
        System.out.println("🔥🔥🔥 RabbitMQConfig INITIALIZED 🔥🔥🔥");
    }
    
    public static final String EXCHANGE_NAME = "ccm.events";
    public static final String TRIP_VERIFIED_ROUTING_KEY = "trip.submitted";
    public static final String VERIFICATION_APPROVED_ROUTING_KEY = "verification.approved";
    public static final String TRIP_SERVICE_QUEUE = "trip_service_verification_queue";
    
    @Bean
    public TopicExchange ccmEventsExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }
    
    @Bean
    public Queue tripServiceQueue() {
        return new Queue(TRIP_SERVICE_QUEUE, true);
    }
    
    @Bean
    public Binding verificationApprovedBinding(Queue tripServiceQueue, TopicExchange ccmEventsExchange) {
        return BindingBuilder
                .bind(tripServiceQueue)
                .to(ccmEventsExchange)
                .with(VERIFICATION_APPROVED_ROUTING_KEY);
    }
    
    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.setAutoStartup(true);
        System.out.println("🔧 RabbitAdmin created - will auto-declare queues and bindings");
        return admin;
    }
    
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
    
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory,
                                                                              MessageConverter messageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);
        return factory;
    }
}
