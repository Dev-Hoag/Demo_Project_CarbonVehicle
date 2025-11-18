package com.listingservice.enums;

public enum ListingStatus {
    DRAFT("Draft", "Listing is being created"),
    ACTIVE("Active", "Listing is live and accepting offers"),
    PENDING("Pending", "Waiting for payment/confirmation"),
    PENDING_PAYMENT("Pending Payment", "Auction won, waiting for winner payment"),
    SOLD("Sold", "Listing has been sold"),
    EXPIRED("Expired", "Listing has expired"),
    CANCELLED("Cancelled", "Listing was cancelled by seller");

    private final String displayName;
    private final String description;

    ListingStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean isFinal() {
        return this == SOLD || this == CANCELLED || this == EXPIRED;
    }
}
