package com.tripservice.exceptions;

public class InvalidTripStateException extends RuntimeException{
    public InvalidTripStateException(String message) {
        super(message);
    }

    public InvalidTripStateException(String message, Throwable cause) {
        super(message, cause);
    }
}
