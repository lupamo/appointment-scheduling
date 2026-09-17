"""
Single source of truth free/paid plan gating
"""

from datetime import datetime, timezone
from enum import Enum

from app.models import Business

class Feature(str, Enum):
	MULTI_STAFF = "multi_staff"
	RECURRING_BOOKINGS = 'recurring_bookings'
	PACKAGE_DEALS = "package_deals"
	CUSTOMER_ACCOUNTS = "customer_accounts"
	REVIEWS = "reviews"
	ADVANCED_ANALYTICS = "advance_analytics"
	AUTO_REFUNDS = "auto_refunds"
	SMS_FALLBACK = "sms_fallback"
	MULTI_LANGUAGE = "multi_language"

PLAN_FEATURES: dict[str, set[Feature]] = {
	"free": set(),
	"paid": {
		Feature.MULTI_STAFF,
        Feature.RECURRING_BOOKINGS,
        Feature.PACKAGE_DEALS,
        Feature.CUSTOMER_ACCOUNTS,
        Feature.REVIEWS,
        Feature.ADVANCED_ANALYTICS,
        Feature.AUTO_REFUNDS,
        Feature.SMS_FALLBACK,
        Feature.MULTI_LANGUAGE,

	}
}

def has_feature(business: Business, feature: Feature) -> bool:
	effective_plan = business.plan
	if (
		business.plan == "paid"
		and business.plan_expires_at is not None
		and business.plan_expires_at < datetime.now(timezone.utc)
	):
		effective_plan = "free"

	return feature in PLAN_FEATURES.get(effective_plan, set())

