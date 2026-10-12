import asyncio

import pytest
from fastapi.testclient import TestClient

from app.ingest.crawler import CrawlError, CrawlResult, _assert_public, normalize_url
from app.ingest.html_parse import parse_page
from app.ingest.psi import PsiResult
from app.main import app
from app.scoring.checks_web import onpage_checks, performance_checks, schema_checks, technical_checks
from app.scoring.core import section_score, weighted_overall
from app.validate.evidence import quote_in_source

client = TestClient(app)

GOOD_HTML = """<html lang="en"><head>
<title>Rahim Uddin – React & Shopify Developer in Dhaka</title>
<meta name="description" content="I build fast, mobile-first websites for small businesses in Bangladesh and abroad. See my work and get in touch.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://rahim.dev/">
<meta property="og:title" content="Rahim"><meta property="og:image" content="https://rahim.dev/og.png">
<script type="application/ld+json">{"@type":"Person","name":"Rahim","sameAs":["https://www.linkedin.com/in/rahim"]}</script>
</head><body><h1>Rahim Uddin</h1><img src="a.png" alt="Portfolio"><a href="/contact">Contact</a></body></html>"""

BAD_HTML = "<html><head><title>Home</title><meta name='robots' content='noindex'></head><body><h1>A</h1><h1>B</h1><img src=x></body></html>"


def _crawl(html: str, https: bool = True) -> CrawlResult:
    url = "https://rahim.dev/" if https else "http://rahim.dev/"
    return CrawlResult(
        start_url=url, final_url=url, redirects=0, https=https, robots_found=True,
        robots_allows_home=True, sitemap_found=True, pages=[parse_page(url, 200, html)],
    )


def _scores(crawl: CrawlResult) -> dict[str, float | None]:
    return {c.id: c.score for c in [*technical_checks(crawl), *onpage_checks(crawl), *schema_checks(crawl)]}


def test_good_site_passes_rules() -> None:
    scores = _scores(_crawl(GOOD_HTML))
    assert all(v == 1.0 for v in scores.values()), scores


def test_bad_site_fails_expected_rules() -> None:
    scores = _scores(_crawl(BAD_HTML, https=False))
    for check_id in ("https", "indexable", "title_length", "meta_description", "single_h1", "img_alt", "jsonld_valid", "viewport"):
        assert scores[check_id] == 0.0, check_id


def test_performance_partial_and_missing() -> None:
    checks = {c.id: c for c in performance_checks(PsiResult(strategy="mobile", performance=0.72, lcp_ms=3100, cls=0.02, tbt_ms=150))}
    assert checks["lighthouse"].score == 0.5
    assert checks["lcp"].score == 0.0
    assert checks["cls"].score == 1.0
    assert "lab" in (checks["inp"].value or "")
    missing = performance_checks(None)
    assert section_score(missing, "performance") is None


def test_overall_rebalances_missing_sections() -> None:
    assert weighted_overall({"a": 80, "b": None}, {"a": 0.5, "b": 0.5}) == 80


@pytest.mark.parametrize("url", ["http://localhost", "http://127.0.0.1", "http://10.0.0.5", "http://169.254.169.254"])
def test_ssrf_guard_blocks_private_hosts(url: str) -> None:
    host = url.split("//")[1]
    with pytest.raises(CrawlError):
        asyncio.run(_assert_public(host))


def test_normalize_url() -> None:
    assert normalize_url("rahim.dev") == "https://rahim.dev"
    with pytest.raises(CrawlError):
        normalize_url("https://rahim.dev:8080")
    with pytest.raises(CrawlError):
        normalize_url("not a url")


def test_evidence_validator() -> None:
    source = "I build “fast” websites\nfor  small businesses."
    assert quote_in_source('build "fast" websites for small businesses', source)
    assert not quote_in_source("50+ client websites", source)


def test_analyze_endpoint_validates_and_reports_blocked_host() -> None:
    assert client.post("/v1/website/analyze", json={"url": "not a url"}).status_code == 422
    res = client.post("/v1/website/analyze", json={"url": "http://127.0.0.1"})
    assert res.status_code == 202
    body = client.get(f"/v1/website/{res.json()['id']}").json()
    assert body["status"] == "error"
    assert "private network" in body["error"]
