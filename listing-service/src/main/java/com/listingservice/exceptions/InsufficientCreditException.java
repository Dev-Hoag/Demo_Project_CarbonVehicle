package com.listingservice.exceptions;

public class InsufficientCreditException extends RuntimeException{
    public InsufficientCreditException(String message) {
        super(message);
    }

    public InsufficientCreditException(Double requested, Double available) {
        super(String.format("Insufficient credits. Requested: %.2f kg, Available: %.2f kg",
                requested, available));
    }
}
