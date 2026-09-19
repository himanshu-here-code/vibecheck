# Security Policy

## Reporting a vulnerability

If you discover a security issue in VibeCheck, please report it privately by
emailing **week.updates.with.himanshu@gmail.com** or opening a
[private security advisory](https://github.com/himanshu-here-code/vibecheck/security/advisories/new).

Please do not open a public issue for security problems.

I'll respond within 48 hours and credit you in the fix (unless you prefer to
stay anonymous).

## Scope

VibeCheck processes public GitHub repository URLs and displays the results.
The relevant attack surface:

- The `/api/scan` endpoint (URL parsing, GitHub API calls)
- The GitHub token used for read access

## Out of scope

- Denial of service through repeated scanning (this is a free tool, not a target)
- Issues in the scanned repositories themselves