package com.listingservice.exceptions;

import java.util.UUID;

public class TransactionNotFoundException extends RuntimeException {
    public TransactionNotFoundException(UUID id) {
        super("Transaction not found with ID: " + id);
    }

    public TransactionNotFoundException(String message) {
        super(message);
    }
}
