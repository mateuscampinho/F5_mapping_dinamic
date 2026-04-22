from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    cors_origins: list[str] = ["http://localhost:5173"]
    f5_verify_ssl: bool = False
    f5_request_timeout: int = 15

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
