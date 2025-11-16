package com.creditservice.exceptions;

public class DuplicateCreditAccountException extends RuntimeException{
    public DuplicateCreditAccountException(String message) {
        super(message);
    }
}
