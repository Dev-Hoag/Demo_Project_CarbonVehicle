package com.creditservice.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis Cache Configuration for Credit Service
 * 
 * Provides caching for:
 * - Credit account balance (5 minutes TTL)
 * - Credit statistics (30 minutes TTL)
 * - Transaction history (10 minutes TTL)
 * - Recent transactions (2 minutes TTL)
 */
@Configuration
@EnableCaching
@Slf4j
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Value("${spring.data.redis.password}")
    private String redisPassword;

    @Value("${spring.data.redis.database:0}")
    private int redisDatabase;

    /**
     * Redis connection factory with Lettuce client
     */
    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        log.info("Configuring Redis connection - Host: {}, Port: {}, DB: {}", 
                 redisHost, redisPort, redisDatabase);

        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        config.setPassword(redisPassword);
        config.setDatabase(redisDatabase);

        return new LettuceConnectionFactory(config);
    }

    /**
     * ObjectMapper configured for HTTP serialization (Primary)
     * - Supports Java 8 time types
     * - NO polymorphic type info for standard REST APIs
     */
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    /**
     * ObjectMapper configured for Redis serialization
     * - Supports Java 8 time types
     * - Includes type information for polymorphic deserialization
     */
    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Enable default typing for polymorphic support
        BasicPolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType(Object.class)
                .build();
        mapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);
        
        return mapper;
    }

    /**
     * RedisTemplate for manual cache operations
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Use String serializer for keys
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        
        // Use Jackson serializer for values
        GenericJackson2JsonRedisSerializer jackson2JsonRedisSerializer = 
            new GenericJackson2JsonRedisSerializer(redisObjectMapper());
        template.setValueSerializer(jackson2JsonRedisSerializer);
        template.setHashValueSerializer(jackson2JsonRedisSerializer);
        
        template.afterPropertiesSet();
        
        log.info("RedisTemplate configured successfully");
        return template;
    }

    /**
     * Cache Manager with custom TTL configurations per cache
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        log.info("Configuring Redis Cache Manager with custom TTL settings");

        // Default cache configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))  // 5 minutes default
                .serializeKeysWith(
                    RedisSerializationContext.SerializationPair.fromSerializer(
                        new StringRedisSerializer()
                    )
                )
                .serializeValuesWith(
                    RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer(redisObjectMapper())
                    )
                )
                .disableCachingNullValues();

        // Cache-specific configurations with different TTLs
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Credit account balance - 5 minutes
        cacheConfigurations.put("creditAccount", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // Credit statistics - 30 minutes (changes less frequently)
        cacheConfigurations.put("creditStatistics", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // Transaction history - 10 minutes
        cacheConfigurations.put("transactionHistory", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // Recent transactions - 2 minutes (more volatile)
        cacheConfigurations.put("recentTransactions", defaultConfig.entryTtl(Duration.ofMinutes(2)));

        RedisCacheManager cacheManager = RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();

        log.info("Redis Cache Manager configured with {} custom cache configurations", 
                 cacheConfigurations.size());
        
        return cacheManager;
    }
}
