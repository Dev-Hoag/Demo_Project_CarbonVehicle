package com.tripservice.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Data
@Builder
public class TripUploadRequest {
    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Vehicle ID is required")
    private UUID vehicleId;

    private MultipartFile file; // CSV/JSON

    @NotBlank(message = "File format is required")
    private String format;
}
