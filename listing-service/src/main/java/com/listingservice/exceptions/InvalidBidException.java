package com.listingservice.exceptions;

public class InvalidBidException extends RuntimeException {
    public InvalidBidException(String message) {
        super(message);
    }

    public InvalidBidException(String message, Throwable cause) {
        super(message, cause);
    }
}
