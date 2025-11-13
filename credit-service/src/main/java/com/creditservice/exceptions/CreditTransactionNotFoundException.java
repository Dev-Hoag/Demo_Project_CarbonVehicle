package com.creditservice.exceptions;

import java.util.UUID;

public class CreditTransactionNotFoundException extends RuntimeException{
    public CreditTransactionNotFoundException(UUID id) {
        super("Credit transaction not found with ID: " + id);
    }

    public CreditTransactionNotFoundException(String message) {
        super(message);
    }
}
