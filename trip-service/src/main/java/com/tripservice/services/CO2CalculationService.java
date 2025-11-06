package com.tripservice.services;

import com.tripservice.dtos.response.CO2CalculationResponse;
import com.tripservice.exceptions.InvalidCalculationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@Slf4j
public class CO2CalculationService {
    private static final double ICE_EMISSION_FACTOR = 150.0;
    private static final double EV_EMISSION_FACTOR = 50.0;
    private static final double PHEV_EMISSION_FACTOR = 70.0;
    private static final double HEV_EMISSION_FACTOR = 100.0;

    private static final double GRAMS_TO_KG = 1000.0;

    /**
     * Tính toán CO2 giảm phát thải (in kilograms)
     *
     * @param distanceKm - Khoảng cách đã đi (km)
     * @param vehicleType - Loại xe (EV, PHEV, HEV)
     * @return CO2 saved in kilograms (kg)
     * @throws InvalidCalculationException nếu input không hợp lệ
     */

    public CO2CalculationResponse calculateDetailed(Double distanceKm, String vehicleType){
        log.debug("Calculating CO2 reduction for distance: {} km, vehicle type: {}",
                distanceKm, vehicleType);

        validateInputs(distanceKm, vehicleType);

        double vehicleEmissionFactor = getEmissionFactor(vehicleType);

        // Calculate CO2 saved
        double co2SavedGrams = distanceKm * (ICE_EMISSION_FACTOR - vehicleEmissionFactor);
        double co2SavedKg = co2SavedGrams / GRAMS_TO_KG;

        // Calculate ICE emission
        double iceEmissionGrams = distanceKm * ICE_EMISSION_FACTOR;
        double iceEmissionKg = iceEmissionGrams / GRAMS_TO_KG;

        // Calculate EV emission
        double evEmissionGrams = distanceKm * vehicleEmissionFactor;
        double evEmissionKg = evEmissionGrams / GRAMS_TO_KG;

        // Calculate reduction percentage
        double reductionPercentage = calculateReductionPercentage(vehicleEmissionFactor);

        // Format amount
        String formattedAmount = formatCO2Amount(co2SavedKg);

        return CO2CalculationResponse.builder()
                .distanceKm(roundToTwoDecimals(distanceKm))
                .vehicleType(vehicleType)
                .vehicleEmissionFactor(vehicleEmissionFactor)
                .iceEmissionFactor(ICE_EMISSION_FACTOR)
                .co2SavedKg(roundToTwoDecimals(co2SavedKg))
                .iceEmissionKg(roundToTwoDecimals(iceEmissionKg))
                .evEmissionKg(roundToTwoDecimals(evEmissionKg))
                .reductionPercentage(roundToTwoDecimals(reductionPercentage))
                .formattedAmount(formattedAmount)
                .build();
    }

    /**
     * Get emission factor dựa vào loại xe
     */
    private double getEmissionFactor(String vehicleType){
        return switch(vehicleType.toUpperCase()){
            case "EV", "ELECTRIC" -> EV_EMISSION_FACTOR;
            case "PHEV", "PLUG_IN_HYBRID" -> PHEV_EMISSION_FACTOR;
            case "HEV", "HYBRID" -> HEV_EMISSION_FACTOR;
            default -> throw new InvalidCalculationException(
                    "Unknown vehicle type: " + vehicleType +
                            ". Supported types: EV, PHEV, HEV"
            );
        };
    }

    /**
     * Calculate reduction percentage compared to ICE
     */
    private double calculateReductionPercentage(double vehicleEmissionFactor) {
        double reduction = ((ICE_EMISSION_FACTOR - vehicleEmissionFactor) / ICE_EMISSION_FACTOR) * 100;
        return roundToTwoDecimals(reduction);
    }

    /**
     * Validate input parameters
     */
    private void validateInputs(Double distanceKm, String vehicleType) {
        if (distanceKm == null || distanceKm <= 0) {
            throw new InvalidCalculationException(
                    "Distance must be greater than 0, got: " + distanceKm
            );
        }

        if (vehicleType == null || vehicleType.isBlank()) {
            throw new InvalidCalculationException("Vehicle type is required");
        }

        if (distanceKm > 10000) {
            log.warn("Unusually large distance detected: {} km", distanceKm);
        }
    }

    /**
     * Round to 2 decimal places
     */
    private double roundToTwoDecimals(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /**
     * Convert CO2 từ kg sang ton (nếu > 1000 kg)
     */
    public String formatCO2Amount(double co2Kg) {
        if (co2Kg >= 1000) {
            double co2Ton = co2Kg / 1000.0;
            return String.format("%.2f ton", co2Ton);
        }
        return String.format("%.2f kg", co2Kg);
    }
}
