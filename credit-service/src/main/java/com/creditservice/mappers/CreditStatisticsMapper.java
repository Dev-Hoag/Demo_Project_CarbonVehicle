package com.creditservice.mappers;

import com.creditservice.dtos.response.CreditStatisticsResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CreditStatisticsMapper {
    public CreditStatisticsResponse toStatisticsResponse(
            Integer totalUsers,
            Double totalCredits,
            Double totalEarned,
            Double totalSpent,
            Double totalTransferred,
            Double averageBalance) {

        log.debug("Building CreditStatisticsResponse");

        return CreditStatisticsResponse.builder()
                .totalUsers(totalUsers != null ? totalUsers : 0)
                .totalCredits(totalCredits != null ? totalCredits : 0.0)
                .totalEarned(totalEarned != null ? totalEarned : 0.0)
                .totalSpent(totalSpent != null ? totalSpent : 0.0)
                .totalTransferred(totalTransferred != null ? totalTransferred : 0.0)
                .averageBalance(averageBalance != null ? averageBalance : 0.0)
                .build();
    }
}
