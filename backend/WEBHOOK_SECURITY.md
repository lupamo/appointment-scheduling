# M-Pesa Webhook Security Implementation

## Security Overview

The M-Pesa callback endpoint has been secured with multiple defense layers to prevent fake booking confirmations.

## Security Layers Implemented

### 1. Webhook Secret Token
- **Location**: URL path parameter
- **Configuration**: `DARAJA_WEBHOOK_SECRET` in `.env`
- **Purpose**: Prevents URL guessing and unauthorized access
- **Implementation**: Callback URL changed from `/mpesa/callback` to `/mpesa/callback/{webhook_secret}`

### 2. IP Whitelisting
- **Location**: `app/middleware.py`
- **Configuration**: `DARAJA_ALLOWED_IPS` in config (default: Safaricom's documented ranges)
- **Purpose**: Only allows requests from Safaricom's IP ranges
- **Ranges**: `196.201.214.0/24` and `196.201.213.0/24`
- **Note**: In sandbox mode, IP validation is relaxed for testing

### 3. Transaction Verification
- **Location**: `app/services/daraja.py` - `verify_transaction_success()`
- **Purpose**: Cross-checks with Daraja's query API before confirming bookings
- **Implementation**: Calls STK query API to verify ResultCode == 0
- **Fail-safe**: If verification fails, transaction is not confirmed

### 4. Enhanced Payload Validation
- **Location**: `app/routers/mpesa.py`
- **Purpose**: Validates callback structure before processing
- **Checks**: Payload is dict, Body exists, stkCallback exists, required fields present

## Configuration Required

Add these to your `.env` file:

```bash
# Generate a random secret string (use: openssl rand -hex 32)
DARAJA_WEBHOOK_SECRET=your_random_secret_here

# Optional: Customize IP ranges if needed
DARAJA_ALLOWED_IPS=["196.201.214.0/24", "196.201.213.0/24"]
```

## Callback URL Update

Update your Daraja configuration:
- **Old**: `https://your-domain.com/mpesa/callback`
- **New**: `https://your-domain.com/mpesa/callback/{your_webhook_secret}`

The system automatically appends the webhook secret when initiating STK push.

## Testing

### Manual Testing (Development)
```bash
# Test without secret (should return 200 but not process)
curl -X POST https://localhost:8000/mpesa/callback/invalid_secret \
  -H "Content-Type: application/json" \
  -d '{"Body":{"stkCallback":{"CheckoutRequestID":"test","ResultCode":0}}}'

# Test with correct secret (will process if other validations pass)
curl -X POST https://localhost:8000/mpesa/callback/your_actual_secret \
  -H "Content-Type: application/json" \
  -d '{"Body":{"stkCallback":{"CheckoutRequestID":"test","ResultCode":0}}}'
```

### Security Testing Checklist
- [ ] Callback without secret returns 200 but doesn't process
- [ ] Callback with invalid secret returns 200 but doesn't process  
- [ ] Callback from non-Safaricom IP rejected in production
- [ ] Fake success callback without Daraja verification is rejected
- [ ] Valid callback with proper verification processes correctly

## Production Deployment Notes

1. **Set `DARAJA_ENV=production`** to enable strict IP validation
2. **Use a strong webhook secret** (32+ character random string)
3. **Monitor PaymentEvent table** for `callback_verification_failed` events
4. **Ensure your proxy/load balancer** properly forwards `X-Forwarded-For` header
5. **Test with Daraja sandbox** before production deployment

## Security Trade-offs

- **Latency**: Transaction verification adds ~1-2 seconds to callback processing
- **Reliability**: If Daraja query API is down, legitimate payments may fail verification
- **Mitigation**: Monitor for verification failures and have manual review process

## Monitoring

Monitor these PaymentEvent types:
- `callback_verification_failed` - Possible attack or API issue
- `callback_success` - Legitimate confirmed payments
- `callback_failed` - Legitimate failed payments

## References

- [M-Pesa Daraja Security Best Practices](https://bororedevtech.hashnode.dev/how-to-secure-stk-push-callback)
- [Safaricom IP Documentation](https://developer.safaricom.co.ke/APIs/M-Pesa%20Express%20Simulate)