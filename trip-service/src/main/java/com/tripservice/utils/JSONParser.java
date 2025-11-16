package com.tripservice.utils;

import com.google.gson.*;
import com.google.gson.reflect.TypeToken;
import com.tripservice.dtos.internal.TripData;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.fileupload.FileUploadException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.lang.reflect.Type;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class JSONParser {
    private final Gson gson;

    public JSONParser() {
        // Configure Gson with custom adapters
        this.gson = new GsonBuilder()
                .registerTypeAdapter(Instant.class, new InstantAdapter())
                .registerTypeAdapter(UUID.class, new UUIDAdapter())
                .setPrettyPrinting()
                .create();
    }

    /**
     * Parse JSON file thành List<TripData>
     */
    public List<TripData> parseJSON(MultipartFile file) throws FileUploadException {
        log.info("Starting to parse JSON file: {}", file.getOriginalFilename());

        try (Reader reader = new InputStreamReader(file.getInputStream())) {

            Type listType = new TypeToken<List<TripData>>() {
            }.getType();
            List<TripData> tripDataList = gson.fromJson(reader, listType);

            if (tripDataList == null || tripDataList.isEmpty()) {
                throw new FileUploadException(
                        "JSON file is empty or has invalid format"
                );
            }

            // Validate and set upload source
            for (int i = 0; i < tripDataList.size(); i++) {
                TripData tripData = tripDataList.get(i);
                validateTripData(tripData, i + 1);
                tripData.setUploadSource("JSON");
            }

            log.info("Successfully parsed {} trip records from JSON", tripDataList.size());
            return tripDataList;

        } catch (IOException | FileUploadException e) {
            log.error("Failed to read JSON file", e);
            throw new FileUploadException("Failed to read JSON file: " + e.getMessage());
        } catch (JsonSyntaxException e) {
            log.error("Invalid JSON syntax", e);
            throw new FileUploadException("Invalid JSON format: " + e.getMessage());
        }
    }

    /**
     * Validate TripData
     */
    private void validateTripData(TripData tripData, int index) throws FileUploadException {
        if (tripData.getVehicleId() == null) {
            throw new FileUploadException(
                    "Record " + index + ": vehicle_id is required"
            );
        }

        if (tripData.getStartTime() == null) {
            throw new FileUploadException(
                    "Record " + index + ": start_time is required"
            );
        }

        if (tripData.getEndTime() == null) {
            throw new FileUploadException(
                    "Record " + index + ": end_time is required"
            );
        }

        if (tripData.getDistanceKm() == null || tripData.getDistanceKm() <= 0) {
            throw new FileUploadException(
                    "Record " + index + ": distance_km must be greater than 0"
            );
        }

        if (tripData.getVehicleType() == null || tripData.getVehicleType().isBlank()) {
            throw new FileUploadException(
                    "Record " + index + ": vehicle_type is required"
            );
        }

        if (tripData.getEndTime().isBefore(tripData.getStartTime())) {
            throw new FileUploadException(
                    "Record " + index + ": end_time must be after start_time"
            );
        }
    }

    /**
     * Custom Gson adapter for Instant
     */
    private static class InstantAdapter implements JsonSerializer<Instant>,
            JsonDeserializer<Instant> {
        @Override
        public JsonElement serialize(Instant instant, Type type,
                                     JsonSerializationContext context) {
            return new JsonPrimitive(instant.toString());
        }

        @Override
        public Instant deserialize(JsonElement json, Type type,
                                   JsonDeserializationContext context)
                throws JsonParseException {
            try {
                return Instant.parse(json.getAsString());
            } catch (DateTimeParseException e) {
                throw new JsonParseException(
                        "Invalid Instant format. Expected ISO-8601 (e.g., 2025-10-30T10:30:00Z), " +
                                "got: " + json.getAsString()
                );
            }
        }
    }

    /**
     * Custom Gson adapter for UUID
     */
    private static class UUIDAdapter implements JsonSerializer<UUID>,
            JsonDeserializer<UUID> {
        @Override
        public JsonElement serialize(UUID uuid, Type type,
                                     JsonSerializationContext context) {
            return new JsonPrimitive(uuid.toString());
        }

        @Override
        public UUID deserialize(JsonElement json, Type type,
                                JsonDeserializationContext context)
                throws JsonParseException {
            try {
                String value = json.getAsString();

                // Try parsing as UUID
                try {
                    return UUID.fromString(value);
                } catch (IllegalArgumentException e) {
                    // Try parsing as numeric ID
                    try {
                        long id = Long.parseLong(value);
                        return new UUID(0L, id);
                    } catch (NumberFormatException ex) {
                        throw new JsonParseException(
                                "Invalid UUID format. Expected UUID or numeric ID, got: " + value
                        );
                    }
                }
            } catch (Exception e) {
                throw new JsonParseException("Failed to parse UUID: " + e.getMessage());
            }
        }
    }
}
