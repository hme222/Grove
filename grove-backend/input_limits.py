"""Size and range limits for request bodies, and a sniffer for uploaded image types."""
import re
from typing import Annotated, Optional

from pydantic import Field, StringConstraints

# Short labels (names, titles) and longer free text (notes, captions, bios).
Label = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
OptLabel = Annotated[Optional[str], Field(default=None, max_length=120)]
Text = Annotated[str, StringConstraints(max_length=2000)]
OptText = Annotated[Optional[str], Field(default=None, max_length=2000)]

MAX_EMAIL = 254
MAX_USERNAME = 40
MAX_PASSWORD = 128
MAX_BULK_PLANTS = 100
MAX_WATERING_DAYS = 365
MAX_FEED_PAGE_SIZE = 50
MAX_SEARCH_QUERY = 100
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# What the clients send today (the web app also logs light checks and notes).
CARE_ACTIONS = {
    'water', 'mist', 'fertilize', 'rotate', 'prune', 'check',
    'change_water', 'flush', 'repot', 'propagate', 'photo',
    'clean', 'stake', 'inspect', 'health_check', 'soil_check',
    'light_check', 'note',
}
POST_TYPES = {'plant_update', 'bouquet', 'propagation', 'milestone', 'swap_complete'}
GOAL_TYPES = {'streak_days', 'care_logs_count', 'plant_count', 'bouquet_vase_life', 'custom'}
GOAL_STATUSES = {'active', 'completed', 'paused', 'abandoned'}


def looks_like_email(value: str) -> bool:
    return len(value) <= MAX_EMAIL and bool(_EMAIL.match(value))


def sniff_image_type(data: bytes) -> Optional[str]:
    """The real type of an image from its first bytes, or None if it is not a supported image."""
    if data[:3] == b'\xff\xd8\xff':
        return 'image/jpeg'
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return 'image/png'
    if data[:6] in (b'GIF87a', b'GIF89a'):
        return 'image/gif'
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return 'image/webp'
    return None
