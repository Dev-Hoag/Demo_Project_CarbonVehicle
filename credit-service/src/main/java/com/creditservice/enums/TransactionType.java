package com.creditservice.enums;

public enum TransactionType {
    EARNED_FROM_TRIP("Earned from Trip", "Credits earned from completing an EV trip"),
    PURCHASED_FROM_MARKETPLACE("Purchased from Marketplace", "Credits purchased from marketplace"),
    SOLD_TO_MARKETPLACE("Sold to Marketplace", "Credits sold on marketplace"),
    TRANSFERRED_IN("Transfer In", "Credits received from another user"),
    TRANSFERRED_OUT("Transfer Out", "Credits sent to another user"),
    ADJUSTMENT("Manual Adjustment", "Manual credit adjustment by admin");

    private final String displayName;
    private final String description;

    TransactionType(String displayName, String description) {
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
