package com.listingservice.config;

import feign.Response;
import feign.codec.ErrorDecoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class FeignErrorDecoder implements ErrorDecoder {
    @Override
    public Exception decode(String methodKey, Response response) {
        log.error("Feign client error: {} - Status: {}", methodKey, response.status());

        switch (response.status()) {
            case 400:
                return new RuntimeException("Bad Request from service");
            case 404:
                return new RuntimeException("Resource not found in service");
            case 500:
                return new RuntimeException("Internal Server Error in service");
            default:
                return new RuntimeException("Generic error from service");
        }
    }
}
