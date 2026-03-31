# Testing Guide

## Run Tests

```bash
python -m pytest -q
```

## Current Coverage Focus

- store resolve and token validation
- store home and product APIs
- cart and order flow
- async order push success and retry

## Recommended Next Additions

- cross-shop isolation regression tests
- manual repush audit assertions
- integration callback contract tests
- performance smoke tests for list endpoints
