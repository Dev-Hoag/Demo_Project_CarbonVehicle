package com.tripservice.services;

import com.tripservice.dtos.internal.TripData;
import com.tripservice.dtos.request.TripUploadRequest;
import com.tripservice.utils.CSVParser;
import com.tripservice.utils.JSONParser;
import com.tripservice.validators.FileFormatValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.fileupload.FileUploadException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripUploadService {
    private final CSVParser csvParser;
    private final JSONParser jsonParser;
    private final FileFormatValidator fileValidator;

    /**
     * Parse file thành List<TripData> dựa vào format
     *
     * @param request - TripUploadRequest chứa file và format
     * @return List<TripData> - Danh sách trip data đã parse
     * @throws FileUploadException nếu file invalid hoặc format không hỗ trợ
     */

    public List<TripData> parseFile(TripUploadRequest request) throws FileUploadException {
        MultipartFile file = request.getFile();
        String format = request.getFormat().toUpperCase();
        log.info("Parsing file: {} with format: {}",
                file.getOriginalFilename(), format);

        // Validate file
        validateFile(file, format);

        // Parse based on format
        List<TripData> tripDataList = switch (format){
            case "CSV" -> csvParser.parseCSV(file);
            case"JSON" -> jsonParser.parseJSON(file);
            default -> throw new FileUploadException(
                    "Unsupported file format: " + format + ". Only CSV and JSON are supported."
            );
        };
        log.info("Successfully parsed {} trip records from file", tripDataList.size());
        return tripDataList;
    }

    public List<TripData> parseBatchFiles(List<MultipartFile> files, String format) {
        log.info("Parsing batch of {} files", files.size());

        return files.stream()
                .flatMap(file -> {
                    TripUploadRequest request = TripUploadRequest.builder()
                            .file(file)
                            .format(format)
                            .build();
                    try {
                        return parseFile(request).stream();
                    } catch (FileUploadException e) {
                        throw new RuntimeException(e);
                    }
                })
                .toList();
    }

    private void validateFile(MultipartFile file, String format) throws FileUploadException {
        if(file == null || file.isEmpty()) {
            throw new FileUploadException("File is empty or null");
        }

        long maxSize = 10 * 1024 * 1024;
        if(file.getSize() > maxSize) {
            throw new FileUploadException("File size exceeds maximum limit of 10MB");
        }

        String filename = file.getOriginalFilename();
        if(filename == null || !fileValidator.isValidExtension(filename, format)) {
            throw new FileUploadException(
                    "File extension does not match format: " + format
            );
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (!fileValidator.isValidContentType(contentType, format)) {
            throw new FileUploadException("Invalid file content type: " + contentType);
        }

        log.debug("File validation passed for: {}", filename);
    }

}
