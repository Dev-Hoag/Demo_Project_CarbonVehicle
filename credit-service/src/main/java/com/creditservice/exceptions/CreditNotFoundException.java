package com.creditservice.exceptions;

import java.util.UUID;

public class CreditNotFoundException extends RuntimeException{
    public CreditNotFoundException(UUID userId) {
        super("Credit account not found for user ID: " + userId);
    }

    public CreditNotFoundException(String message) {
        super(message);
    }
}
