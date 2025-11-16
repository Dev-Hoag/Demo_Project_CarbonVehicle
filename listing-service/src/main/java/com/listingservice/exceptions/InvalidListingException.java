package com.listingservice.exceptions;

public class InvalidListingException extends RuntimeException{
    public InvalidListingException(String message) {
        super(message);
    }

    public InvalidListingException(String message, Throwable cause) {
        super(message, cause);
    }
}
