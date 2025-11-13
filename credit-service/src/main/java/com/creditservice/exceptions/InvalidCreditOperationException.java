package com.creditservice.exceptions;

public class InvalidCreditOperationException extends RuntimeException{
    public InvalidCreditOperationException(String message) {
        super(message);
    }

    public InvalidCreditOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
