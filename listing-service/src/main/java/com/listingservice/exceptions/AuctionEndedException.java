package com.listingservice.exceptions;

import java.util.UUID;

public class AuctionEndedException extends RuntimeException{
    public AuctionEndedException(UUID listingId) {
        super("Auction has ended for listing: " + listingId);
    }

    public AuctionEndedException(String message) {
        super(message);
    }
}
