from pydantic.v1 import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_USER: str
    DB_PW: str
    OPENAI_API_KEY: str
    TTS_CLIENT_ID: str
    TTS_CLIENT_SECRET: str

    class Config:
        env_file = ".env"


settings = Settings()
