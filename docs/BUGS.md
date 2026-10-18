# Bug log

Severity: **Critical** = wrong role, privacy leak, crash, or blocked round. **Major** = playable but
confusing. **Minor** = cosmetic. A fix counts only once its test is re-run on the iPhone.

| ID | Date | Severity | Steps | Expected | Actual | Fixed in | Verified on device |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | 2026-10-17 | Minor | Open any screen with big display text in Playwright WebKit on Windows | Condensed capitals, evenly spaced | Letters overlap: the width axis changes spacing but not letter shapes | Open: check on the iPhone first (likely a Windows WebKit quirk) | no |
