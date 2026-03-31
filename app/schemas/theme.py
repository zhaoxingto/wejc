from pydantic import BaseModel, Field


class StoreThemeColorsRead(BaseModel):
    primary_color: str
    primary_text_color: str
    accent_color: str
    background_color: str
    surface_color: str
    surface_muted_color: str
    text_color: str
    text_muted_color: str
    notice_background_color: str


class StoreThemeRead(BaseModel):
    preset_key: str
    preset_name: str
    description: str
    colors: StoreThemeColorsRead
    supports_custom: bool = True


class StoreThemePresetRead(BaseModel):
    key: str
    name: str
    description: str
    primary_color: str
    primary_text_color: str
    accent_color: str
    background_color: str
    surface_color: str
    surface_muted_color: str
    text_color: str
    text_muted_color: str
    notice_background_color: str


class StoreThemeColorsWrite(BaseModel):
    primary_color: str | None = Field(default=None, max_length=32)
    primary_text_color: str | None = Field(default=None, max_length=32)
    accent_color: str | None = Field(default=None, max_length=32)
    background_color: str | None = Field(default=None, max_length=32)
    surface_color: str | None = Field(default=None, max_length=32)
    surface_muted_color: str | None = Field(default=None, max_length=32)
    text_color: str | None = Field(default=None, max_length=32)
    text_muted_color: str | None = Field(default=None, max_length=32)
    notice_background_color: str | None = Field(default=None, max_length=32)


class StoreThemeUpdateRequest(BaseModel):
    preset_key: str | None = Field(default=None, max_length=32)
    colors: StoreThemeColorsWrite | None = None
