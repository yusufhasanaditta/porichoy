"""Extract SEO-relevant facts from one HTML page."""

import json
from typing import Any
from urllib.parse import urljoin, urlparse

from pydantic import BaseModel, Field
from selectolax.lexbor import LexborHTMLParser as HTMLParser

MAX_TEXT_CHARS = 8000


class PageInfo(BaseModel):
    url: str
    status: int
    title: str | None = None
    meta_description: str | None = None
    h1s: list[str] = Field(default_factory=list)
    canonical: str | None = None
    viewport: str | None = None
    lang: str | None = None
    robots_meta: str | None = None
    og: dict[str, str] = Field(default_factory=dict)
    images_total: int = 0
    images_with_alt: int = 0
    jsonld_raw: list[str] = Field(default_factory=list)
    jsonld_errors: int = 0
    schema_types: list[str] = Field(default_factory=list)
    same_as: list[str] = Field(default_factory=list)
    internal_links: list[str] = Field(default_factory=list)
    external_links: list[str] = Field(default_factory=list)
    text: str = ""


def _attr(node: Any, name: str) -> str | None:
    value = node.attributes.get(name) if node is not None else None
    return value.strip() if isinstance(value, str) else None


def _collect_schema(data: Any, types: list[str], same_as: list[str]) -> None:
    if isinstance(data, list):
        for item in data:
            _collect_schema(item, types, same_as)
    elif isinstance(data, dict):
        t = data.get("@type")
        if isinstance(t, str):
            types.append(t)
        elif isinstance(t, list):
            types.extend(x for x in t if isinstance(x, str))
        s = data.get("sameAs")
        if isinstance(s, str):
            same_as.append(s)
        elif isinstance(s, list):
            same_as.extend(x for x in s if isinstance(x, str))
        for key in ("@graph", "mainEntity", "author", "publisher"):
            if key in data:
                _collect_schema(data[key], types, same_as)


def same_site(a: str, b: str) -> bool:
    ha = (urlparse(a).hostname or "").removeprefix("www.")
    hb = (urlparse(b).hostname or "").removeprefix("www.")
    return ha == hb and ha != ""


def parse_page(url: str, status: int, html: str) -> PageInfo:
    tree = HTMLParser(html)
    info = PageInfo(url=url, status=status)

    title = tree.css_first("title")
    info.title = title.text(strip=True) if title else None
    for meta in tree.css("meta"):
        name = (_attr(meta, "name") or "").lower()
        prop = (_attr(meta, "property") or "").lower()
        content = _attr(meta, "content")
        if name == "description":
            info.meta_description = content or ""
        elif name == "viewport":
            info.viewport = content
        elif name == "robots":
            info.robots_meta = content
        elif prop.startswith("og:") and content:
            info.og[prop] = content
    info.h1s = [h.text(strip=True) for h in tree.css("h1")]
    canonical = tree.css_first('link[rel="canonical"]')
    info.canonical = _attr(canonical, "href")
    info.lang = _attr(tree.css_first("html"), "lang")

    images = tree.css("img")
    info.images_total = len(images)
    info.images_with_alt = sum(1 for img in images if (_attr(img, "alt") or "") != "")

    for script in tree.css('script[type="application/ld+json"]'):
        raw = script.text() or ""
        info.jsonld_raw.append(raw[:4000])
        try:
            _collect_schema(json.loads(raw), info.schema_types, info.same_as)
        except json.JSONDecodeError:
            info.jsonld_errors += 1

    links: list[str] = []
    external: list[str] = []
    for a in tree.css("a[href]"):
        href = _attr(a, "href") or ""
        if href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        absolute = urljoin(url, href).split("#")[0]
        if urlparse(absolute).scheme not in ("http", "https"):
            continue
        target = links if same_site(absolute, url) else external
        if absolute not in target:
            target.append(absolute)
    info.internal_links = links[:200]
    info.external_links = external[:100]

    for tag in tree.css("script, style, noscript, svg, template"):
        tag.decompose()
    body = tree.body
    text = body.text(separator="\n", strip=True) if body else ""
    info.text = "\n".join(line for line in text.splitlines() if line.strip())[:MAX_TEXT_CHARS]
    return info
