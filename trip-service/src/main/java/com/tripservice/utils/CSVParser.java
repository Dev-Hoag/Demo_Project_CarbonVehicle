package com.tripservice.utils;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import com.tripservice.dtos.internal.TripData;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class CSVParser {
    // Date format trong CSV
    private static final DateTimeFormatter DATETIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final DateTimeFormatter[] ALTERNATIVE_FORMATTERS = {
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm:ss")
    };

    /**
     * Parse CSV file thành List<TripData>
     */

    public List<TripData> parseCSV(MultipartFile file) throws FileUploadException {
        log.info("Starting to parse CSV file: {}", file.getOriginalFilename());
        List<TripData> tripDataList = new ArrayList<>();

        List<String[]> rows;
        try (Reader reader = new InputStreamReader(file.getInputStream());
             CSVReader csvReader = new CSVReader(reader)) {
            rows = csvReader.readAll();

            if (rows.isEmpty()) {
                throw new FileUploadException("CSV file is empty");
            }
            validateHeader(rows.get(0));

            // Parse data rows (skip header)
            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);

                try {
                    TripData tripData = mapRowToTripData(row, i + 1);
                    tripDataList.add(tripData);
                } catch (Exception e) {
                    log.warn("Skipping invalid row {}: {}", i + 1, e.getMessage());
                }
            }

            if (tripDataList.isEmpty()) {
                throw new FileUploadException("No valid trip data found in CSV file");
            }
            log.info("Successfully parsed {} trip records from CSV", tripDataList.size());
            return tripDataList;
        } catch(IOException | CsvException e){
            log.error("Failed to parse CSV file", e);
            throw new FileUploadException("Failed to parse CSV file: " + e.getMessage());
        }

    }

    /**
     * Validate CSV header
     */
    private void validateHeader(String[] header) throws FileUploadException {
        if (header.length < 5) {
            throw new FileUploadException(
                    "Invalid CSV header. Expected at least 5 columns: " +
                            "vehicle_id, start_time, end_time, distance_km, vehicle_type"
            );
        }
        log.debug("CSV Header: {}", String.join(", ", header));
    }

    /**
     * Map CSV row thành TripData
     */
    private TripData mapRowToTripData(String[] row, int rowNumber) throws FileUploadException {
        try {
            // Parse required fields
            UUID vehicleId = parseUUID(row[0], "vehicle_id", rowNumber);
            Instant startTime = parseInstant(row[1], "start_time", rowNumber);
            Instant endTime = parseInstant(row[2], "end_time", rowNumber);
            Double distanceKm = parseDouble(row[3], "distance_km", rowNumber);
            String vehicleType = parseString(row[4], "vehicle_type", rowNumber);

            // Validate logic
            validateTripData(startTime, endTime, distanceKm, rowNumber);

            // Parse optional fields
            Double averageSpeed = row.length > 5 ? parseDoubleOptional(row[5]) : null;
            Double batteryUsed = row.length > 6 ? parseDoubleOptional(row[6]) : null;
            String startLocation = row.length > 7 ? parseStringOptional(row[7]) : null;
            String endLocation = row.length > 8 ? parseStringOptional(row[8]) : null;
            String gpsCoordinates = row.length > 9 ? parseStringOptional(row[9]) : null;

            return TripData.builder()
                    .vehicleId(vehicleId)
                    .startTime(startTime)
                    .endTime(endTime)
                    .distanceKm(distanceKm)
                    .vehicleType(vehicleType)
                    .averageSpeed(averageSpeed)
                    .batteryUsed(batteryUsed)
                    .startLocation(startLocation)
                    .endLocation(endLocation)
                    .gpsCoordinates(gpsCoordinates)
                    .uploadSource("CSV")
                    .build();

        } catch (Exception e) {
            throw new FileUploadException(
                    "Invalid data at row " + rowNumber + ": " + e.getMessage()
            );
        }
    }

    /**
     * Validate trip data logic
     */
    private void validateTripData(Instant startTime, Instant endTime,
                                  Double distanceKm, int rowNumber) throws FileUploadException {
        if (endTime.isBefore(startTime)) {
            throw new FileUploadException(
                    "Row " + rowNumber + ": End time must be after start time"
            );
        }

        if (distanceKm <= 0) {
            throw new FileUploadException(
                    "Row " + rowNumber + ": Distance must be greater than 0"
            );
        }
    }

    // ==================== PARSING UTILITIES ====================

    /**
     * Parse UUID from string
     * Supports both UUID format and simple numeric IDs
     */
    private UUID parseUUID(String value, String fieldName, int rowNumber) {
        if (StringUtils.isBlank(value)) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        String trimmed = value.trim();

        try {
            // Try parsing as UUID first
            return UUID.fromString(trimmed);
        } catch (IllegalArgumentException e) {
            // If not UUID, check if it's a number and create UUID from it
            try {
                long id = Long.parseLong(trimmed);
                // Create deterministic UUID from long ID
                return new UUID(0L, id);
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException(
                        fieldName + " must be a valid UUID or numeric ID, got: " + value
                );
            }
        }
    }

    /**
     * Parse Instant from datetime string
     * Supports multiple formats and converts to UTC
     */
    private Instant parseInstant(String value, String fieldName, int rowNumber) {
        if (StringUtils.isBlank(value)) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        String trimmed = value.trim();

        // Try ISO Instant format first (e.g., "2025-10-30T10:30:00Z")
        try {
            return Instant.parse(trimmed);
        } catch (DateTimeParseException e) {
            // Not ISO Instant, try LocalDateTime formats
            LocalDateTime localDateTime = parseLocalDateTime(trimmed, fieldName);
            // Convert to Instant (assume UTC timezone)
            return localDateTime.toInstant(ZoneOffset.UTC);
        }
    }

    /**
     * Parse LocalDateTime from various formats
     */
    private LocalDateTime parseLocalDateTime(String value, String fieldName) {
        // Try primary formatter
        try {
            return LocalDateTime.parse(value, DATETIME_FORMATTER);
        } catch (DateTimeParseException e) {
            // Try alternative formatters
            for (DateTimeFormatter formatter : ALTERNATIVE_FORMATTERS) {
                try {
                    return LocalDateTime.parse(value, formatter);
                } catch (DateTimeParseException ignored) {
                    // Continue
                }
            }

            throw new IllegalArgumentException(
                    fieldName + " has invalid datetime format. " +
                            "Expected: yyyy-MM-dd HH:mm:ss or ISO format, got: " + value
            );
        }
    }

    private Double parseDouble(String value, String fieldName, int rowNumber) {
        if (StringUtils.isBlank(value)) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    fieldName + " must be a valid number, got: " + value
            );
        }
    }

    private Double parseDoubleOptional(String value) {
        if (StringUtils.isBlank(value)) {
            return null;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String parseString(String value, String fieldName, int rowNumber) {
        if (StringUtils.isBlank(value)) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim();
    }

    private String parseStringOptional(String value) {
        return StringUtils.isBlank(value) ? null : value.trim();
    }
}
