"""
Security middleware for M-Pesa webhook protection.
"""
import ipaddress
from fastapi import Request, HTTPException
from app.config import settings


async def validate_safaricom_ip(request: Request) -> None:
    """
    Validate that the request originates from Safaricom's documented IP ranges.
    
    Safaricom callbacks come from these IP ranges:
    - 196.201.214.0/24
    - 196.201.213.0/24
    
    When behind a proxy, check X-Forwarded-For header.
    """
    # Get client IP - check forwarded headers first for proxy setups
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one (original client)
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        # Fallback to direct connection IP
        client_ip = request.client.host if request.client else None
    
    if not client_ip:
        # If we can't determine the IP, we might want to be permissive in development
        # but strict in production. For now, we'll allow it but log a warning.
        if settings.daraja_env == "production":
            raise HTTPException(status_code=403, detail="Unable to determine client IP")
        return
    
    try:
        client_ip_obj = ipaddress.ip_address(client_ip)
    except ValueError:
        # Invalid IP format
        if settings.daraja_env == "production":
            raise HTTPException(status_code=403, detail="Invalid client IP format")
        return
    
    # Check if client IP is in any of the allowed ranges
    is_allowed = False
    for allowed_range in settings.daraja_allowed_ips:
        try:
            network = ipaddress.ip_network(allowed_range)
            if client_ip_obj in network:
                is_allowed = True
                break
        except ValueError:
            # Invalid network format in config, skip this range
            continue
    
    if not is_allowed and settings.daraja_env == "production":
        # In production, reject requests from non-Safaricom IPs
        # Return 200 to avoid revealing security measures to attackers
        raise HTTPException(status_code=200, detail="Accepted")
    
    # In development/sandbox, we allow the request but could log a warning
    if not is_allowed and settings.daraja_env == "sandbox":
        # Allow for testing purposes
        pass