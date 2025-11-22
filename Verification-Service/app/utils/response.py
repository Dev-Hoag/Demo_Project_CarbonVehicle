from typing import Optional, Any
from fastapi.responses import JSONResponse


class ResponseHelper:
    """Helper class cho API responses"""
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        status_code: int = 200
    ) -> dict:
        """
        Success response format
        
        Args:
            data: Response data
            message: Success message
            status_code: HTTP status code
            
        Returns:
            Formatted response dict
            
        Example:
            return ResponseHelper.success(
                data=verification,
                message="Verification created successfully"
            )
        """
        return {
            "success": True,
            "message": message,
            "data": data
        }
    
    @staticmethod
    def error(
        message: str = "Error occurred",
        error: Optional[str] = None,
        status_code: int = 400
    ) -> dict:
        """
        Error response format
        
        Args:
            message: Error message
            error: Error detail
            status_code: HTTP status code
            
        Returns:
            Formatted error response
        """
        response = {
            "success": False,
            "message": message
        }
        
        if error:
            response["error"] = error
        
        return response
    
    @staticmethod
    def created(data: Any = None, message: str = "Created successfully") -> dict:
        """Shortcut for 201 Created response"""
        return ResponseHelper.success(data, message, 201)
    
    @staticmethod
    def not_found(message: str = "Resource not found") -> dict:
        """Shortcut for 404 Not Found response"""
        return ResponseHelper.error(message, status_code=404)
    
    @staticmethod
    def bad_request(message: str = "Bad request", error: str = None) -> dict:
        """Shortcut for 400 Bad Request response"""
        return ResponseHelper.error(message, error, 400)
    
    @staticmethod
    def unauthorized(message: str = "Unauthorized") -> dict:
        """Shortcut for 401 Unauthorized response"""
        return ResponseHelper.error(message, status_code=401)
    
    @staticmethod
    def forbidden(message: str = "Forbidden") -> dict:
        """Shortcut for 403 Forbidden response"""
        return ResponseHelper.error(message, status_code=403)