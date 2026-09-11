from pydantic_settings import BaseSettings

class Settings(BaseSettings):
	database_url: str

	daraja_Consumer_key: str = ""
	daraja_consumer_secret: str = ""
	daraja_shortcode: str = ""
	daraja_passkey: str = ""
	daraja_env: str = "sandbox"
	daraja_callback_url: str = ""

	whatsapp_token: str = ""
	whatsapp_phone_number_id: str = ""

	booking_hold_minutes: int = 3
	app_base_url: str = "https://localhost:8000"

	class Config:
		env_file = ".env"

settings = Settings()
