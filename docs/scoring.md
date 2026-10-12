# Scoring (rubric v1.0)

The LLM never makes up the score.

- Each check has a fixed ID, weight and pass rule. "Rule" checks are plain Python; "LLM" checks return pass/fail plus evidence, and the evidence checker must confirm the quote.
- Section score = 100 × (weights of passed checks) / (weights of applicable checks).
- Presence = 0.35 × LinkedIn + 0.30 × Website + 0.25 × CV + 0.10 × Consistency (re-balanced when a source is missing).
- Consistency = max(0, 100 − 25 × critical − 10 × major − 3 × minor).
- Results are cached by `contentHash + rubricVersion + model`, so unchanged content gets the same score.

The full check list with weights is implemented in `services/api/app/scoring/` (milestone 4).
