package com.listingservice.clients;

import com.listingservice.dtos.requests.AddCreditRequest;
import com.listingservice.dtos.requests.DeductCreditRequest;
import com.listingservice.dtos.responses.ApiResponse;
import com.listingservice.dtos.responses.CreditResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(
        name = "credit-service",
        url = "${services.credit-service.url}"
)
public interface CreditServiceClient {
    @PostMapping("/v1/credits/add")
    ApiResponse<CreditResponse> addCredit(@RequestBody AddCreditRequest request);

    @PostMapping("/v1/credits/deduct")
    ApiResponse<CreditResponse> deductCredit(@RequestBody DeductCreditRequest request);

    @GetMapping("/v1/credits/user/{userId}")
    ApiResponse<CreditResponse> getCreditByUserId(@PathVariable("userId") UUID userId);
}
