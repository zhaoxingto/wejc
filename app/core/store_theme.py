DEFAULT_THEME_KEY = "amber"

THEME_PRESETS: dict[str, dict[str, str]] = {
    "amber": {
        "name": "琥珀暖棕",
        "description": "偏咖啡馆气质的暖色模板，适合食品、礼盒和生活方式门店。",
        "primary_color": "#8F5A2A",
        "primary_text_color": "#FFF8F0",
        "accent_color": "#D9B58B",
        "background_color": "#F5EFE5",
        "surface_color": "#FFFAF2",
        "surface_muted_color": "#EFE4D2",
        "text_color": "#2F241B",
        "text_muted_color": "#7A6551",
        "notice_background_color": "#F4E8D8",
    },
    "forest": {
        "name": "森屿青绿",
        "description": "更清新的绿色模板，适合有机、生鲜、茶饮等自然风格门店。",
        "primary_color": "#2F6B55",
        "primary_text_color": "#F5FFF9",
        "accent_color": "#9BC6AE",
        "background_color": "#EEF5F0",
        "surface_color": "#FBFFFC",
        "surface_muted_color": "#DCEBDF",
        "text_color": "#20342B",
        "text_muted_color": "#5C7469",
        "notice_background_color": "#E3F0E7",
    },
    "berry": {
        "name": "莓果晚霞",
        "description": "更鲜明的莓果色模板，适合礼品、烘焙和活动型门店。",
        "primary_color": "#B14D63",
        "primary_text_color": "#FFF7FA",
        "accent_color": "#E5A8B7",
        "background_color": "#FBF1F4",
        "surface_color": "#FFF9FB",
        "surface_muted_color": "#F4DDE4",
        "text_color": "#3C2430",
        "text_muted_color": "#7B5A67",
        "notice_background_color": "#F9E5EB",
    },
}

THEME_COLOR_FIELDS = [
    "primary_color",
    "primary_text_color",
    "accent_color",
    "background_color",
    "surface_color",
    "surface_muted_color",
    "text_color",
    "text_muted_color",
    "notice_background_color",
]


def list_theme_presets() -> list[dict]:
    return [{"key": key, **value} for key, value in THEME_PRESETS.items()]


def normalize_theme(theme_json: dict | None) -> dict:
    theme_json = theme_json or {}
    preset_key = str(theme_json.get("preset_key") or DEFAULT_THEME_KEY)
    preset = THEME_PRESETS.get(preset_key, THEME_PRESETS[DEFAULT_THEME_KEY])
    overrides = theme_json.get("colors") if isinstance(theme_json.get("colors"), dict) else {}
    colors = {field: str(overrides.get(field) or preset[field]) for field in THEME_COLOR_FIELDS}
    return {
        "preset_key": preset_key if preset_key in THEME_PRESETS else DEFAULT_THEME_KEY,
        "preset_name": preset["name"],
        "description": preset["description"],
        "colors": colors,
        "supports_custom": True,
    }


def build_theme_storage(preset_key: str | None, colors: dict | None) -> dict:
    selected_key = preset_key or DEFAULT_THEME_KEY
    if selected_key not in THEME_PRESETS:
        selected_key = DEFAULT_THEME_KEY
    color_overrides = {}
    if isinstance(colors, dict):
        for field in THEME_COLOR_FIELDS:
            value = colors.get(field)
            if value:
                color_overrides[field] = str(value)
    return {
        "preset_key": selected_key,
        "colors": color_overrides,
    }
