"""Polite, SSRF-guarded crawler: same site only, robots.txt respected, max 6 pages."""

import asyncio
import ipaddress
import socket
from dataclasses import dataclass, field
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx

from app.ingest.html_parse import PageInfo, parse_page, same_site

USER_AGENT = "PorichoyBot/0.1 (+https://github.com/yusufhasanaditta/porichoy)"
MAX_PAGES = 6
MAX_REDIRECTS = 5
MAX_BYTES = 2_000_000
TIMEOUT = httpx.Timeout(10.0)
PRIORITY_WORDS = ("about", "contact", "service", "portfolio", "project", "work", "case")


class CrawlError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass
class CrawlResult:
    start_url: str
    final_url: str
    redirects: int
    https: bool
    robots_found: bool
    robots_allows_home: bool
    sitemap_found: bool
    pages: list[PageInfo] = field(default_factory=list)


def normalize_url(raw: str) -> str:
    raw = raw.strip()
    if not raw.lower().startswith(("http://", "https://")):
        raw = "https://" + raw
    parsed = urlparse(raw)
    if not parsed.hostname or "." not in parsed.hostname:
        raise CrawlError("invalid_url", "That doesn't look like a website address.")
    if parsed.port not in (None, 80, 443):
        raise CrawlError("invalid_url", "Only standard web ports (80 and 443) are allowed.")
    return raw


async def _assert_public(host: str) -> None:
    """Block private, loopback, link-local and reserved addresses (SSRF guard)."""
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise CrawlError("dns_failed", f"Could not find the website {host}.") from exc
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global or ip.is_multicast:
            raise CrawlError("blocked_host", "That address points to a private network and can't be checked.")


@dataclass
class Fetched:
    status: int
    url: str
    hops: int
    content_type: str
    text: str


async def _get(client: httpx.AsyncClient, url: str) -> Fetched:
    """GET with manual redirects so every hop passes the SSRF guard. Body is capped at MAX_BYTES."""
    hops = 0
    while True:
        await _assert_public(urlparse(url).hostname or "")
        async with client.stream("GET", url) as resp:
            if resp.is_redirect and resp.next_request is not None and hops < MAX_REDIRECTS:
                url = str(resp.next_request.url)
                hops += 1
                continue
            body = bytearray()
            async for chunk in resp.aiter_bytes():
                body.extend(chunk)
                if len(body) > MAX_BYTES:
                    break
            text = bytes(body[:MAX_BYTES]).decode(resp.encoding or "utf-8", errors="replace")
            return Fetched(resp.status_code, url, hops, resp.headers.get("content-type", ""), text)


async def _robots(client: httpx.AsyncClient, base: str) -> tuple[RobotFileParser, bool, list[str]]:
    parser = RobotFileParser()
    try:
        resp = await _get(client, f"{base}/robots.txt")
    except (httpx.HTTPError, CrawlError):
        parser.parse([])
        return parser, False, []
    if resp.status != 200:
        parser.parse([])
        return parser, False, []
    lines = resp.text.splitlines()
    parser.parse(lines)
    sitemaps = [ln.split(":", 1)[1].strip() for ln in lines if ln.lower().startswith("sitemap:")]
    return parser, True, sitemaps


async def _has_sitemap(client: httpx.AsyncClient, base: str, declared: list[str]) -> bool:
    for url in [*declared[:2], f"{base}/sitemap.xml", f"{base}/sitemap_index.xml"]:
        try:
            resp = await _get(client, url)
        except (httpx.HTTPError, CrawlError):
            continue
        head = resp.text[:2000]
        if resp.status == 200 and ("<urlset" in head or "<sitemapindex" in head):
            return True
    return False


def _pick_links(home: PageInfo, limit: int) -> list[str]:
    candidates = [u for u in home.internal_links if u.rstrip("/") != home.url.rstrip("/")]
    candidates = [u for u in candidates if not urlparse(u).path.lower().endswith((".pdf", ".jpg", ".png", ".zip"))]
    candidates.sort(key=lambda u: 0 if any(w in u.lower() for w in PRIORITY_WORDS) else 1)
    return candidates[:limit]


async def crawl(raw_url: str) -> CrawlResult:
    start = normalize_url(raw_url)
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
    async with httpx.AsyncClient(headers=headers, timeout=TIMEOUT, follow_redirects=False) as client:
        try:
            resp = await _get(client, start)
        except httpx.HTTPError as exc:
            raise CrawlError("fetch_failed", f"Could not load the website: {type(exc).__name__}.") from exc
        final_url, hops = resp.url, resp.hops
        if resp.content_type and "html" not in resp.content_type:
            raise CrawlError("not_html", "That address didn't return a web page.")

        parsed = urlparse(final_url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        robots, robots_found, declared = await _robots(client, base)
        home = parse_page(final_url, resp.status, resp.text)
        result = CrawlResult(
            start_url=start,
            final_url=final_url,
            redirects=hops,
            https=parsed.scheme == "https",
            robots_found=robots_found,
            robots_allows_home=robots.can_fetch(USER_AGENT, final_url),
            sitemap_found=await _has_sitemap(client, base, declared),
            pages=[home],
        )

        async def fetch_page(url: str) -> PageInfo | None:
            if not robots.can_fetch(USER_AGENT, url) or not same_site(url, final_url):
                return None
            try:
                r = await _get(client, url)
            except (httpx.HTTPError, CrawlError):
                return None
            if "html" not in r.content_type:
                return None
            return parse_page(r.url, r.status, r.text)

        extra = await asyncio.gather(*(fetch_page(u) for u in _pick_links(home, MAX_PAGES - 1)))
        result.pages.extend(p for p in extra if p is not None)
        return result
