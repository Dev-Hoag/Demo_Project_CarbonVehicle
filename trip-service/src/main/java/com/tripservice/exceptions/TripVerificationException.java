package com.tripservice.exceptions;

public class TripVerificationException extends RuntimeException{
    public TripVerificationException(String message) {
        super(message);
    }

    public TripVerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}
