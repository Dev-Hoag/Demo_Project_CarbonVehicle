import hashlib
import json
from datetime import datetime
from typing import Dict, Any

class HashService:
    """
    Service for generating and verifying certificate hashes
    """
    
    @staticmethod
    def generate_certificate_hash(data: Dict[str, Any]) -> str:
        """
        Generate SHA256 hash for certificate data
        
        Args:
            data: Dictionary containing certificate information
            
        Returns:
            Hexadecimal hash string
        """
        # Create a standardized string representation
        hash_data = {
            "verification_id": data.get("verification_id"),
            "trip_id": data.get("trip_id"),
            "user_id": data.get("user_id"),
            "credit_amount": str(data.get("credit_amount")),
            "timestamp": data.get("timestamp", datetime.utcnow().isoformat())
        }
        
        # Sort keys for consistency
        sorted_data = json.dumps(hash_data, sort_keys=True)
        
        # Generate SHA256 hash
        hash_object = hashlib.sha256(sorted_data.encode('utf-8'))
        return hash_object.hexdigest()
    
    @staticmethod
    def verify_certificate_hash(data: Dict[str, Any], expected_hash: str) -> bool:
        """
        Verify if the certificate data matches the expected hash
        
        Args:
            data: Dictionary containing certificate information
            expected_hash: The hash to verify against
            
        Returns:
            True if hash matches, False otherwise
        """
        calculated_hash = HashService.generate_certificate_hash(data)
        return calculated_hash == expected_hash
    
    @staticmethod
    def generate_file_hash(file_path: str) -> str:
        """
        Generate SHA256 hash for a file (e.g., PDF certificate)
        
        Args:
            file_path: Path to the file
            
        Returns:
            Hexadecimal hash string
        """
        sha256_hash = hashlib.sha256()
        
        with open(file_path, "rb") as f:
            # Read file in chunks to handle large files
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        return sha256_hash.hexdigest()