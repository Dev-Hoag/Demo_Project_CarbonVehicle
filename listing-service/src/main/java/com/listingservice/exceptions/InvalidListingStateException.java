package com.listingservice.exceptions;

import com.listingservice.enums.ListingStatus;

public class InvalidListingStateException extends RuntimeException {
    public InvalidListingStateException(String message) {
        super(message);
    }

    public InvalidListingStateException(String operation, ListingStatus currentStatus) {
        super(String.format("Cannot perform '%s' operation. Current listing status: %s",
                operation, currentStatus));
    }
}
