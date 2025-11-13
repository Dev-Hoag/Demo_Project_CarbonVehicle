package com.creditservice.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditStatisticsResponse {
    private Integer totalUsers;
    private Double totalCredits;
    private Double totalEarned;
    private Double totalSpent;
    private Double totalTransferred;
    private Double averageBalance;
}
