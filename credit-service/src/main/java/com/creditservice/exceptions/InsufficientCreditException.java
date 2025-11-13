package com.creditservice.exceptions;

public class InsufficientCreditException extends RuntimeException{
    public InsufficientCreditException(Double requested, Double available) {
        super(String.format("Insufficient credits. Requested: %.2f kg, Available: %.2f kg",
                requested, available));
    }

    public InsufficientCreditException(String message) {
        super(message);
    }
}
