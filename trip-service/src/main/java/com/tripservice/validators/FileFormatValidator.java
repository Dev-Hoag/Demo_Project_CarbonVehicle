package com.tripservice.validators;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class FileFormatValidator {
    private static final List<String> CSV_EXTENSIONS = Arrays.asList(".csv", ".txt");
    private static final List<String> JSON_EXTENSIONS = Arrays.asList(".json");

    private static final List<String> CSV_MIME_TYPES = Arrays.asList(
            "text/csv",
            "text/plain",
            "application/csv",
            "application/vnd.ms-excel"
    );

    private static final List<String> JSON_MIME_TYPES = Arrays.asList(
            "application/json",
            "text/json"
    );

    /**
     * Check file extension có hợp lệ không
     */
    public boolean isValidExtension(String filename, String format) {
        String lowerFilename = filename.toLowerCase();

        return switch (format.toUpperCase()) {
            case "CSV" -> CSV_EXTENSIONS.stream()
                    .anyMatch(lowerFilename::endsWith);
            case "JSON" -> JSON_EXTENSIONS.stream()
                    .anyMatch(lowerFilename::endsWith);
            default -> false;
        };
    }

    /**
     * Check MIME type có hợp lệ không
     */
    public boolean isValidContentType(String contentType, String format) {
        if (contentType == null) {
            return false;
        }

        String lowerContentType = contentType.toLowerCase();

        return switch (format.toUpperCase()) {
            case "CSV" -> CSV_MIME_TYPES.stream()
                    .anyMatch(lowerContentType::contains);
            case "JSON" -> JSON_MIME_TYPES.stream()
                    .anyMatch(lowerContentType::contains);
            default -> false;
        };
    }
}
