"""Rule-based website checks (technical, on-page, schema, performance)."""

from app.ingest.crawler import CrawlResult
from app.ingest.html_parse import PageInfo
from app.ingest.psi import PsiResult
from app.scoring.core import Check, Evidence

KEY_PAGE_WORDS = ("contact", "service", "hire", "about", "portfolio", "work")
PERSON_TYPES = {"Person", "Organization", "LocalBusiness", "ProfessionalService", "Corporation", "WebSite", "ProfilePage"}


def _ev(page: PageInfo, field: str, quote: str | None) -> Evidence:
    return Evidence(locator=f"{page.url} · {field}", quote=(quote if quote else "(missing)")[:200])


def _bool(value: bool) -> float:
    return 1.0 if value else 0.0


def technical_checks(crawl: CrawlResult) -> list[Check]:
    home = crawl.pages[0]
    noindex = "noindex" in (home.robots_meta or "").lower()
    return [
        Check(id="https", section="technical", weight=3, score=_bool(crawl.https), value=crawl.final_url),
        Check(
            id="status_ok",
            section="technical",
            weight=2,
            score=_bool(home.status == 200 and crawl.redirects <= 2),
            value=f"HTTP {home.status}, {crawl.redirects} redirect(s)",
        ),
        Check(
            id="robots_allowed",
            section="technical",
            weight=3,
            score=_bool(crawl.robots_allows_home),
            value="robots.txt found" if crawl.robots_found else "no robots.txt (allowed by default)",
        ),
        Check(id="sitemap", section="technical", weight=2, score=_bool(crawl.sitemap_found)),
        Check(id="canonical", section="technical", weight=2, score=_bool(bool(home.canonical)), evidence=_ev(home, "canonical", home.canonical)),
        Check(
            id="viewport",
            section="technical",
            weight=2,
            score=_bool("width=device-width" in (home.viewport or "").replace(" ", "")),
            evidence=_ev(home, "meta viewport", home.viewport),
        ),
        Check(id="indexable", section="technical", weight=3, score=_bool(not noindex), evidence=_ev(home, "meta robots", home.robots_meta)),
        Check(id="html_lang", section="technical", weight=1, score=_bool(bool(home.lang)), evidence=_ev(home, "<html lang>", home.lang)),
    ]


def onpage_checks(crawl: CrawlResult) -> list[Check]:
    home = crawl.pages[0]
    title = home.title or ""
    meta = home.meta_description or ""
    titles = [p.title for p in crawl.pages if p.title]
    unique_titles = len(set(titles)) == len(titles)
    total_imgs = sum(p.images_total for p in crawl.pages)
    alt_imgs = sum(p.images_with_alt for p in crawl.pages)
    alt_ratio = alt_imgs / total_imgs if total_imgs else None
    has_key_page = any(any(w in link.lower() for w in KEY_PAGE_WORDS) for link in home.internal_links)
    return [
        Check(
            id="title_length",
            section="onpage",
            weight=3,
            score=_bool(30 <= len(title) <= 60 and unique_titles),
            evidence=_ev(home, "<title>", title),
            value=f"{len(title)} characters" + ("" if unique_titles else ", duplicated on other pages"),
        ),
        Check(
            id="meta_description",
            section="onpage",
            weight=2,
            score=_bool(70 <= len(meta) <= 160),
            evidence=_ev(home, "meta description", meta),
            value=f"{len(meta)} characters",
        ),
        Check(
            id="single_h1",
            section="onpage",
            weight=2,
            score=_bool(len(home.h1s) == 1),
            evidence=_ev(home, "<h1>", " | ".join(home.h1s)),
            value=f"{len(home.h1s)} <h1> tag(s)",
        ),
        Check(
            id="img_alt",
            section="onpage",
            weight=2,
            score=None if alt_ratio is None else _bool(alt_ratio >= 0.8),
            value=None if alt_ratio is None else f"{alt_imgs} of {total_imgs} images have alt text",
        ),
        Check(id="key_pages", section="onpage", weight=1, score=_bool(has_key_page)),
        Check(
            id="open_graph",
            section="onpage",
            weight=1,
            score=_bool("og:title" in home.og and "og:image" in home.og),
            value=", ".join(sorted(home.og)) or None,
        ),
    ]


def schema_checks(crawl: CrawlResult) -> list[Check]:
    pages = crawl.pages
    has_jsonld = any(p.jsonld_raw for p in pages)
    errors = sum(p.jsonld_errors for p in pages)
    types = sorted({t for p in pages for t in p.schema_types})
    same_as = sorted({s for p in pages for s in p.same_as})
    return [
        Check(
            id="jsonld_valid",
            section="schema",
            weight=2,
            score=_bool(has_jsonld and errors == 0),
            value=("no JSON-LD found" if not has_jsonld else f"{errors} invalid block(s)"),
        ),
        Check(
            id="schema_type",
            section="schema",
            weight=2,
            score=_bool(bool(PERSON_TYPES.intersection(types))),
            value=", ".join(types) or None,
        ),
        Check(id="same_as", section="schema", weight=2, score=_bool(bool(same_as)), value=", ".join(same_as[:5]) or None),
    ]


def performance_checks(psi: PsiResult | None) -> list[Check]:
    if psi is None:
        return [Check(id=i, section="performance", weight=w, score=None) for i, w in (("lighthouse", 4), ("lcp", 2), ("inp", 2), ("cls", 2))]
    perf = psi.performance
    perf_score = None if perf is None else (1.0 if perf >= 0.9 else 0.5 if perf >= 0.5 else 0.0)
    # INP needs real-user (field) data; small sites rarely have it, so fall back to lab Total Blocking Time.
    if psi.inp_ms is not None:
        inp_score, inp_value = _bool(psi.inp_ms <= 200), f"INP {psi.inp_ms:.0f} ms (real users)"
    elif psi.tbt_ms is not None:
        inp_score, inp_value = _bool(psi.tbt_ms <= 200), f"Total Blocking Time {psi.tbt_ms:.0f} ms (lab)"
    else:
        inp_score, inp_value = None, None
    return [
        Check(id="lighthouse", section="performance", weight=4, score=perf_score, value=None if perf is None else f"{round(perf * 100)}/100"),
        Check(
            id="lcp",
            section="performance",
            weight=2,
            score=None if psi.lcp_ms is None else _bool(psi.lcp_ms <= 2500),
            value=None if psi.lcp_ms is None else f"{psi.lcp_ms / 1000:.1f} s",
        ),
        Check(id="inp", section="performance", weight=2, score=inp_score, value=inp_value),
        Check(
            id="cls",
            section="performance",
            weight=2,
            score=None if psi.cls is None else _bool(psi.cls <= 0.1),
            value=None if psi.cls is None else f"{psi.cls:.2f}",
        ),
    ]
