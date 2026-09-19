## Checklist done and tested
Tested end-to-end against live Postgres 16:

- business create / duplicate-slug rejection / payout validation
- service create, deposit>price rejection, 404 on missing business
- booking creation with exact-overlap AND partial-overlap rejection (409)
- adjacent non-overlapping slots allowed
- past-slot rejection
- expiry job releases abandoned holds, and freed slots become rebookable
- reschedule carries the deposit over, links rescheduled_from, marks old row
- 24h reschedule notice enforced

## Checklist to work on to complete backend
- No authentication anywhere. Any caller can create businesses, add services, or read the dashboard.
- Webhook authentication implemented with multiple security layers (IP whitelisting, secret token, transaction verification)
- Daraja integration is unverified against a live sandbox. Written to the documented shape; real payloads sometimes differ. Test before money.
- WhatsApp templates not created — needs Meta Business Manager approval.
- No availability_rules logic — nothing stops booking outside business hours.
- No reminder job (confirmation send exists, 24h-before reminder doesn't).
CORS allows all origins.
- payment_events is written but never read —No authentication anywhere. Any caller can create businesses, add services, or read the dashboard.
- Webhook authentication implemented with multiple security layers (IP whitelisting, secret token, transaction verification)
- Daraja integration is unverified against a live sandbox. Written to the documented shape; real payloads sometimes differ. Test before money.
- WhatsApp templates not created — needs Meta Business Manager approval.
- No availability_rules logic — nothing stops booking outside business hours.
- No reminder job (confirmation send exists, 24h-before reminder doesn't).
- CORS allows all origins.
- payment_events is written but never read — no admin view yet.
