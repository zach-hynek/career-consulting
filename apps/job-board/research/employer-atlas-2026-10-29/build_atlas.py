#!/usr/bin/env python3
"""Package the reviewed research data into offline HTML, Markdown and CSVs.

No network, dependencies, employer approval or database writes.
"""
import csv
import io
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "atlas-data.json").read_text())
employers = data["employers"]
by_name = {e["name"]: e for e in employers}
top = sorted((e for e in employers if e["top100"]), key=lambda e: e["editorialIndex"])


def write_json(name, value):
    (ROOT / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def cell(value):
    if value is None:
        return ""
    if isinstance(value, (list, dict)):
        value = json.dumps(value, ensure_ascii=False)
    elif isinstance(value, bool):
        value = str(value).lower()
    else:
        value = str(value)
    if value.startswith(("=", "+", "-", "@", "\t", "\r")):
        value = "'" + value
    return value


def write_csv(name, rows, columns=None):
    rows = list(rows)
    columns = columns or list(rows[0])
    with (ROOT / name).open("w", encoding="utf-8-sig", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(columns)
        out.writerows([cell(r.get(c)) for c in columns] for r in rows)


def company_row(e):
    return {
        "company_id": e["id"], "name": e["displayName"], "niche": e["niche"],
        "collections": "; ".join(e["collections"]), "top_100": e["top100"],
        "editorial_reading_order": e["editorialIndex"], "research_priority": e["priority"],
        "research_depth": e["researchDepth"], "why_investigate": e["thesis"],
        "role_hypotheses_not_vacancies": "; ".join(e["roleHypotheses"]),
        "tradeoff_to_resolve": e["tradeoff"], "career_url": e["careerUrl"],
        "career_evidence_url": e["careerRead"]["url"],
        "substantive_career_evidence_read": e["careerRead"]["substantive"],
        "workplace_mode": e["workplace"]["mode"], "workplace_note": e["workplace"]["note"],
        "workplace_source": e["workplace"]["source"],
        "office_days_per_week_in_stated_scope": e["workplace"]["officeDaysPerWeek"],
        "workforce_events": e["workforceEvents"], "linked_evidence": e["evidence"],
        "role_pay_examples": e["payExamples"], "ownership_note": e["ownership"],
        "median_employee_tenure_years": None, "boomerang_rate": None,
        "employee_pride_score": None, "company_salary_median": None,
        "current_runway_months": None, "adapter_candidate": e["sourceReview"]["adapterCandidate"],
        "board_token_candidate": e["sourceReview"]["boardTokenCandidate"],
        "api_verified": False, "reuse_reviewed_at": None, "approved": False, "enabled": False,
        "research_as_of": data["asOf"], "unknown_field_rule": "Unknown, not zero or no event",
    }


write_csv("employers.csv", map(company_row, employers))
write_csv("top-100.csv", map(company_row, top))
memberships = []
for group in data["collections"]:
    for position, name in enumerate(group["names"], 1):
        e = by_name[name]
        memberships.append({"collection_id": group["id"], "collection": group["title"],
                            "display_order_not_quality_rank": position, "company_id": e["id"],
                            "company": e["displayName"], "niche": e["niche"],
                            "top_100": e["top100"], "career_url": e["careerUrl"],
                            "research_as_of": data["asOf"]})
write_csv("collection-memberships.csv", memberships)
evidence = [f for e in employers for f in e["evidence"]]
write_csv("evidence.csv", evidence)
write_csv("workforce-events.csv", [f for e in employers for f in e["workforceEvents"]])
write_csv("capital-and-business.csv", [f for f in evidence if f["kind"] in
          {"capital", "debt", "secondary", "business", "contract_ceiling", "ownership"}])
write_csv("workplace-policies.csv", [dict(company=e["displayName"], **e["workplace"], checkedAt=data["asOf"])
          for e in employers if e["workplace"]["mode"] != "unknown"],
          ["company", "mode", "note", "officeDaysPerWeek", "scope", "source", "checkedAt"])
pay = [p for e in employers for p in e["payExamples"]]
write_csv("salary-examples.csv", pay,
          ["company", "role", "location", "currency", "baseMin", "baseMax", "oteMin", "oteMax",
           "displayedMin", "displayedMax", "source", "caution"])
write_csv("metro-price-levels.csv", data["metros"])

# These small indexes are generated from the canonical data, not earlier research drafts.
write_json("candidates.json", [{"name": e["name"], "niche": e["niche"], "selected": e["selected"],
                              "collections": e["collections"], "top100": e["top100"]} for e in employers])
write_json("career-links.json", [{"name": e["name"], "careerUrl": e["careerUrl"],
                                 "evidenceRead": e["careerRead"], "sourceReview": e["sourceReview"]}
                                for e in employers])

sources = {}


def source(url, company, use, note=None):
    if not url:
        return
    entry = sources.setdefault(url, {"url": url, "companies": [], "uses": [],
                                    "checkedAt": data["asOf"], "notes": []})
    for key, value in (("companies", company), ("uses", use), ("notes", note)):
        if value and value not in entry[key]:
            entry[key].append(value)


for e in employers:
    source(e["careerUrl"], e["name"], "Career link; not a verified live job count")
    source(e["careerRead"]["url"], e["name"], "Career evidence attempt",
           "Substantive read" if e["careerRead"]["substantive"] else "Limited/blocked/thin read")
    source(e["workplace"]["source"], e["name"], "Workplace policy or role example")
    for f in e["evidence"]:
        source(f["url"], e["name"], f["kind"], f["confidence"])
    for p in e["payExamples"]:
        source(p["source"], e["name"], "Role-specific advertised compensation", p["caution"])
for s in data["methodSources"]:
    source(s["url"], None, s["title"], s["use"])
write_json("sources.json", {"asOf": data["asOf"], "notice": "Evidence index. Source access does not imply reuse permission.",
                           "sources": list(sources.values())})


def md(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


lines = ["# Proposed overall Top 100", "", "**Research date: October 29, 2026. Unapproved editorial shortlist.**",
         "", "Numbers are a reading order, not measured happiness or safety ranks. Role suggestions are hypotheses, not claims of current openings. All dossiers retain unknown tenure, boomerang and pay fields in the JSON/CSV. Read the main research brief for the method and limits.", ""]
for e in top:
    lines += [f"## {e['editorialIndex']}. {e['displayName']}", "",
              f"**{e['priority']} · {e['niche']}**", "", e["thesis"], "",
              "Role hypotheses: " + "; ".join(e["roleHypotheses"]) + ".", "",
              "Resolve before prioritizing: " + e["tradeoff"], "",
              f"[Employer careers]({e['careerUrl']}) · Research depth: {e['researchDepth']}.", ""]
    if e["workplace"]["source"]:
        lines += [f"Workplace: {e['workplace']['note']} [Source]({e['workplace']['source']}).", ""]
    if e["evidence"]:
        # Link the evidence register rather than repeat every claim across all deliverables.
        refs = []
        for f in e["evidence"]:
            label = f["kind"].replace("_", " ") + (" · " + f["eventDate"] if f["eventDate"] else "")
            refs.append(f"[{label}]({f['url']})")
        lines += ["Evidence to inspect: " + "; ".join(refs) + ". Full notes are in the atlas and evidence.csv.", ""]
    else:
        lines += ["Additional employee-experience and financial evidence remains unestablished in this dossier.", ""]
(ROOT / "top-100.md").write_text("\n".join(lines))

lines = ["# Seven 50-employer research collections", "",
         "**As of October 29, 2026. Draft for review.** Five industries plus two cross-cutting lenses. 350 memberships cover 315 distinct employers. Order within a collection is editorial, not a measured quality ranking. Flagged entries are conditional/watch candidates, not certified great workplaces.", ""]
for group in data["collections"]:
    lines += [f"## {group['title']}", "", "| Employer | Segment | Overall Top 100 | Evidence / question |",
              "|---|---|---|---|"]
    for name in group["names"]:
        e = by_name[name]
        flag = "Linked workforce/project event — inspect dossier" if e["workforceEvents"] else "Workforce history incomplete"
        if e["workplace"]["mode"] != "unknown":
            flag += "; " + e["workplace"]["mode"].replace("_", " ")
        lines.append(f"| [{md(e['displayName'])}]({e['careerUrl']}) | {md(e['niche'])} | {'Yes' if e['top100'] else '—'} | {md(flag)} |")
    lines.append("")
lines += ["## Screened alternatives outside the seven selections", "",
          ", ".join(e["displayName"] for e in employers if not e["selected"]) + ".",
          "", "These are not rejected as bad employers. They did not make this edition’s collection membership; several needed better flexibility evidence or had weaker fit than replacements.", ""]
(ROOT / "collections.md").write_text("\n".join(lines))

# Safe JSON script embedding; the UI renders data with textContent, never HTML evaluation.
def embedded(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


template = (ROOT / "review-template.html").read_text()
html = template.replace("__ATLAS_DATA__", embedded(data)).replace("__RESEARCH_BRIEF__", embedded((ROOT / "README.md").read_text()))
html = html.replace("__SCORE_RUBRIC__", embedded(json.loads((ROOT / "scoring-rubric.json").read_text())))
html = html.replace("__COMPANY_LOGOS__", embedded(json.loads((ROOT / "logos.json").read_text())))
for marker, filename in [("__SCORE_ENGINE__", "score-engine.js"), ("__REVIEW_ENHANCEMENTS__", "review-enhancements.js"), ("__ENHANCEMENT_CSS__", "atlas-enhancements.css")]:
    html = html.replace(marker, (ROOT / filename).read_text())
(ROOT / "employer-atlas.html").write_text(html)

files = ["README.md", "employer-atlas.html", "atlas-data.json", "sources.json", "search-ledger.json",
         "top-100.md", "collections.md", "employers.csv", "top-100.csv", "collection-memberships.csv",
         "evidence.csv", "workforce-events.csv", "capital-and-business.csv", "workplace-policies.csv",
         "salary-examples.csv", "metro-price-levels.csv", "career-links.json", "candidates.json",
         "verification.md", "build_atlas.py", "review-template.html", "scoring-rubric.json",
         "score-engine.js", "review-enhancements.js", "atlas-enhancements.css", "logos.json", "fetch_logos.py"]
with zipfile.ZipFile(ROOT / "zachs-employer-atlas-2026-10-29.zip", "w", zipfile.ZIP_DEFLATED) as bundle:
    for name in files:
        bundle.write(ROOT / name, arcname="employer-atlas/" + name)

print(json.dumps({"screened": len(employers), "selected": sum(e["selected"] for e in employers),
                  "collections": {g["id"]: len(g["names"]) for g in data["collections"]},
                  "memberships": len(memberships), "top100": len(top), "evidence": len(evidence),
                  "evidence_sources": len(sources), "html_bytes": len(html.encode()),
                  "bundle_bytes": (ROOT / "zachs-employer-atlas-2026-10-29.zip").stat().st_size}, indent=2))
