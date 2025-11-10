package com.listingservice.enums;

public enum ListingType {
    FIXED_PRICE("Fixed Price", "Buy at a fixed price per kg"),
    AUCTION("Auction", "Bid in an auction");

    private final String displayName;
    private final String description;

    ListingType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}
