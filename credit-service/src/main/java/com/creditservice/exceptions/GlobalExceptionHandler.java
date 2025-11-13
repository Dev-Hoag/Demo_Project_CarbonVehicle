package com.creditservice.exceptions;

import com.creditservice.dtos.response.ErrorResponse;
import com.creditservice.dtos.response.ValidationErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(CreditNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCreditNotFound(
            CreditNotFoundException ex,
            HttpServletRequest request) {

        log.error("Credit not found: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(CreditTransactionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCreditTransactionNotFound(
            CreditTransactionNotFoundException ex,
            HttpServletRequest request) {

        log.error("Credit transaction not found: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(InsufficientCreditException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientCredit(
            InsufficientCreditException ex,
            HttpServletRequest request) {

        log.error("Insufficient credits: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(InvalidCreditOperationException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCreditOperation(
            InvalidCreditOperationException ex,
            HttpServletRequest request) {

        log.error("Invalid credit operation: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(DuplicateCreditAccountException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateCreditAccount(
            DuplicateCreditAccountException ex,
            HttpServletRequest request) {

        log.error("Duplicate credit account: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.CONFLICT.value())
                .error("Conflict")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        log.error("Validation failed: {}", ex.getMessage());

        List<ValidationErrorResponse.ValidationError> validationErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> ValidationErrorResponse.ValidationError.builder()
                        .field(error.getField())
                        .message(error.getDefaultMessage())
                        .rejectedValue(error.getRejectedValue())
                        .code(error.getCode())
                        .build())
                .collect(Collectors.toList());

        ValidationErrorResponse response = ValidationErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Input validation failed. Please check the errors.")
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        log.error("Type mismatch: {}", ex.getMessage());

        String message = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s",
                ex.getValue(),
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(message)
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        log.error("Illegal argument: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request) {

        log.error("Illegal state: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.CONFLICT.value())
                .error("Conflict")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        log.error("Unexpected error occurred", ex);

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("An unexpected error occurred. Please try again later.")
                .path(request.getRequestURI())
                .exception(ex.getClass().getSimpleName())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
