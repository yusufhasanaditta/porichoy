"""Evidence checker: a finding is kept only if its quote really appears in the source."""

import re
import unicodedata

_QUOTES = str.maketrans({"“": '"', "”": '"', "‘": "'", "’": "'", "–": "-", "—": "-"})


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).translate(_QUOTES)
    return re.sub(r"\s+", " ", text).strip().lower()


def quote_in_source(quote: str, source: str) -> bool:
    q = normalize(quote).strip(" .\"'")
    if len(q) < 2:
        return False
    return q in normalize(source)
