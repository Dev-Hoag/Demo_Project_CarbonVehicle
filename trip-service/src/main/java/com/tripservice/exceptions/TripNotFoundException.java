package com.tripservice.exceptions;

import java.util.UUID;

public class TripNotFoundException extends RuntimeException{
    public TripNotFoundException(UUID id) {
        super("Trip not found with ID: " + id);
    }

    public TripNotFoundException(String message) {
        super(message);
    }

    public TripNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
