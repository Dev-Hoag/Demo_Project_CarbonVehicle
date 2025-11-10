package com.listingservice.enums;

public enum BidStatus {
    ACTIVE("Active", "Bid is active"),
    OUTBID("Outbid", "Bid has been outbid by another bidder"),
    WON("Won", "Bid won the auction"),
    LOST("Lost", "Bid lost the auction"),
    CANCELLED("Cancelled", "Bid was cancelled");

    private final String displayName;
    private final String description;

    BidStatus(String displayName, String description) {
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
