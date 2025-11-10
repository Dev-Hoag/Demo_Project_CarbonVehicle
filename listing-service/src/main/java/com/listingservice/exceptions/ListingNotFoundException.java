package com.listingservice.exceptions;

import java.util.UUID;

public class ListingNotFoundException extends RuntimeException {
    public ListingNotFoundException(UUID id) {
        super("Listing not found with ID: " + id);
    }
    public ListingNotFoundException(String message) {
        super(message);
    }

    public ListingNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
