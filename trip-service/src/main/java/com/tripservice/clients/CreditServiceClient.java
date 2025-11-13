package com.tripservice.clients;

import com.tripservice.dtos.request.AddCreditRequest;
import com.tripservice.dtos.response.ApiResponse;
import com.tripservice.dtos.response.CreditResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "credit-service",
        url = "${services.credit-service.url}"
)
public interface CreditServiceClient {
    @PostMapping("/v1/credits/add")
    ApiResponse<CreditResponse> addCredit(@RequestBody AddCreditRequest request);
}
