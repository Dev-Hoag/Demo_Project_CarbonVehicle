package com.tripservice.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CO2CalculationResponse {
    // Trip info
    private Double distanceKm;
    private String vehicleType;

    // Emission factors (g CO2/km)
    private Double vehicleEmissionFactor;
    private Double iceEmissionFactor;

    // CO2 calculations (kg)
    private Double co2SavedKg;          // Tổng CO2 tiết kiệm được
    private Double iceEmissionKg;       // CO2 mà xe ICE thải ra
    private Double evEmissionKg;        // CO2 mà xe EV thải ra

    // Additional info
    private Double reductionPercentage; // % giảm so với ICE
    private String formattedAmount;     // "10.5 kg" or "1.5 ton"
}
