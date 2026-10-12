# Task: audit a CV

The CV is given as numbered lines ("14: Built websites for clients").
Target role (may be empty): {{target_role}}
Write every human-readable field (overall, note, problem, why_it_hurts, fix_hint, question, why, example_answer) in {{lang_name}}.
Keep quotes exactly as they appear in the CV, in the CV's own language.

1. checks: decide each of these, quoting the most relevant line:
   - summary_strong: there is a clear summary that says who the person is, what they offer and for whom.
   - action_verbs: most experience bullets start with a strong action verb (Built, Led, Increased), not "Responsible for".
   - achievements: bullets describe results and outcomes, not just duties.
   - spelling_grammar: no spelling or grammar mistakes.

2. findings: the 4–8 most important problems, most severe first.
   - line and quote: the exact line number and words copied from it (max 200 characters). Never paraphrase the quote.
   - severity: critical = likely to get the CV rejected; major = clearly weakens it; minor = polish.
   - problem (1 sentence), why_it_hurts (1–2 sentences: the concrete effect on recruiters or applicant tracking systems), fix_hint (1 sentence).
   - Do not repeat formatting issues about contact details, page count or date formats; other checks cover those.

3. questions: 3–6 questions whose answers would let a writer make this CV much stronger without inventing anything.
   Ask for missing numbers (team size, users, revenue, time saved, number of clients), results, tools used, the target role, or context behind vague lines.
   One question per idea, short and easy to answer. Point related_line at the CV line it is about.
   example_answer must be obviously an example (e.g. "e.g. about 20 clients over 2 years").
