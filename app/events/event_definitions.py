from enum import Enum


class EventType(str, Enum):
    # Incoming events (from MRV Service)
    TRIP_SUBMITTED = "trip.submitted"
    
    # Outgoing events (published by CVA Service)
    VERIFICATION_APPROVED = "verification.approved"  # → Registry/Wallet Service để mint credits
    VERIFICATION_REJECTED = "verification.rejected"  # → Notification Service
    
    # Legacy events (for backward compatibility)
    TRIP_VERIFIED = "verification.trip.verified"
    TRIP_REJECTED = "verification.trip.rejected"

    # Certificate related (published by certificate service)
    CERTIFICATE_GENERATED = "certificate.generated"
    CERTIFICATE_VERIFIED = "certificate.verified"
    CERTIFICATE_DOWNLOADED = "certificate.downloaded"