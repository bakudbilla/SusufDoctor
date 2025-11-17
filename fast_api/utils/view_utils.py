def normalize_view_type(view_type: str) -> str:
    mapping = {
        'frontal': 'Frontal',
        'pa': 'PA',
        'ap': 'AP',
        'lateral': 'Lateral',
    }
    v = (view_type or "").lower().strip()
    return mapping.get(v, "Other")
