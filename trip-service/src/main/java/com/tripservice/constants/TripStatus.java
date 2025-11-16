package com.tripservice.constants;

public enum TripStatus {
    /**
     * Trip vừa được upload, chưa tính CO2
     */
    PENDING("Pending", "Trip has been uploaded but CO2 not calculated yet"),

    /**
     * Trip đã được tính CO2 thành công
     */
    CALCULATED("Calculated", "CO2 calculation completed"),

    /**
     * Trip đã được submit đến CVA để verify
     */
    SUBMITTED_FOR_VERIFICATION("Submitted for Verification", "Trip submitted to CVA for verification"),

    /**
     * Trip đang được CVA review
     */
    UNDER_REVIEW("Under Review", "Trip is being reviewed by CVA"),

    /**
     * Trip đã được CVA verify thành công
     */
    VERIFIED("Verified", "Trip verified by CVA, ready for credit issuance"),

    /**
     * Trip bị CVA reject
     */
    REJECTED("Rejected", "Trip rejected by CVA"),

    /**
     * Credit đã được cấp cho trip này
     */
    CREDIT_ISSUED("Credit Issued", "Carbon credits have been issued for this trip"),

    /**
     * Trip bị cancelled bởi user
     */
    CANCELLED("Cancelled", "Trip cancelled by user");

    private final String displayName;
    private final String description;

    TripStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if status is final (cannot be changed)
     */
    public boolean isFinal() {
        return this == VERIFIED ||
                this == REJECTED ||
                this == CREDIT_ISSUED ||
                this == CANCELLED;
    }

    /**
     * Check if trip can be submitted for verification
     */
    public boolean canSubmitForVerification() {
        return this == CALCULATED;
    }

    /**
     * Check if trip can be verified by CVA
     */
    public boolean canBeVerified() {
        return this == SUBMITTED_FOR_VERIFICATION ||
                this == UNDER_REVIEW;
    }
}
