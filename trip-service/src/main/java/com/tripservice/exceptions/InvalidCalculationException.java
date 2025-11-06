package com.tripservice.exceptions;

public class InvalidCalculationException  extends RuntimeException{
    public InvalidCalculationException(String message) {
        super(message);
    }

    public InvalidCalculationException(String message, Throwable cause) {
        super(message, cause);
    }
}
