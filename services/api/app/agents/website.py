"""Website content agent: E-E-A-T checks, findings and copy suggestions."""

import json
import logging
from typing import Any

from app.config import settings
from app.ingest.crawler import CrawlResult
from app.llm.gemini import generate, load_prompt
from app.models.ai import WebContentAudit
from app.scoring.core import Check, Evidence
from app.validate.evidence import quote_in_source

log = logging.getLogger("porichoy.agents.website")

LANG_NAMES = {"en": "English", "bn": "Bangla (natural, everyday Bangla as spoken in Bangladesh)"}
WEIGHTS = {"who": 2, "proof": 3, "contact": 2, "recent": 1}
SOCIAL_HOSTS = ("linkedin.com", "github.com", "facebook.com", "x.com", "twitter.com", "behance.net", "dribbble.com", "upwork.com", "fiverr.com", "instagram.com", "youtube.com")


def _page_source(crawl: CrawlResult, url: str | None) -> str:
    for p in crawl.pages:
        if url and p.url.rstrip("/") == url.rstrip("/"):
            return "\n".join([p.title or "", p.meta_description or "", p.text])
    return "\n".join("\n".join([p.title or "", p.meta_description or "", p.text]) for p in crawl.pages)


def build_json_ld(audit: WebContentAudit, crawl: CrawlResult, external_links: list[str]) -> str:
    s = audit.suggestions
    data: dict[str, Any] = {"@context": "https://schema.org", "@type": s.entity_type, "name": s.entity_name, "url": crawl.final_url}
    if s.entity_job_title and s.entity_type == "Person":
        data["jobTitle"] = s.entity_job_title
    data["description"] = s.entity_description
    same_as = [u for u in external_links if any(h in u for h in SOCIAL_HOSTS)]
    if same_as:
        data["sameAs"] = same_as[:8]
    return json.dumps(data, indent=2, ensure_ascii=False)


async def audit_content(crawl: CrawlResult, lang: str, external_links: list[str]) -> dict[str, Any]:
    home = crawl.pages[0]
    pages_text = "\n\n".join(f"=== PAGE: {p.url}\nTITLE: {p.title}\n{p.text[:5000]}" for p in crawl.pages)
    contents = [f"HOMEPAGE TITLE: {home.title}\nHOMEPAGE META DESCRIPTION: {home.meta_description}", pages_text]
    audit = await generate(
        model=settings.model_main,
        system=load_prompt("web_audit", lang_name=LANG_NAMES[lang]),
        contents=contents,
        schema=WebContentAudit,
    )

    checks: list[Check] = []
    for c in audit.checks:
        evidence = None
        if c.quote and quote_in_source(c.quote, _page_source(crawl, c.page_url)):
            evidence = Evidence(locator=c.page_url or home.url, quote=c.quote[:200])
        checks.append(
            Check(id=c.id, section="content", weight=WEIGHTS[c.id], score=1.0 if c.passed else 0.0, method="ai", evidence=evidence, note=c.note)
        )

    findings = []
    dropped = 0
    for f in audit.findings:
        if not quote_in_source(f.quote, _page_source(crawl, f.page_url)):
            dropped += 1
            continue
        findings.append(
            {
                "severity": f.severity,
                "evidence": {"locator": f.page_url, "quote": f.quote},
                "problem": f.problem,
                "whyItHurts": f.why_it_hurts,
                "fixHint": f.fix_hint,
            }
        )
    if dropped:
        log.info("evidence checker dropped %d website finding(s)", dropped)

    s = audit.suggestions
    return {
        "checks": checks,
        "overall": audit.overall,
        "findings": findings,
        "droppedFindings": dropped,
        "suggestions": {"title": s.title, "metaDescription": s.meta_description, "h1": s.h1, "jsonLd": build_json_ld(audit, crawl, external_links)},
    }
