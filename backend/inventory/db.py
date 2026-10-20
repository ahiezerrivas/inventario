# MongoDB connection removed — application now uses Django ORM (SQLite).


def ensure_mongo_connection() -> None:
    """No-op kept for compatibility during transition."""
    pass
