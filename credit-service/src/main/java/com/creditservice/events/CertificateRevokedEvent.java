package com.creditservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateRevokedEvent {
    private String eventType;
    private Integer certificateId;
    private String userId;
    private Integer revokedBy;
    private String revokeReason;
    private Double creditAmount;
}
