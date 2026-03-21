# TESTING.md — ApplyPilot Test Suite

## Quick Start

### 1. Install dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
npx playwright install chromium   # for E2E tests
```

---

## Backend Tests (Python / pytest)

All tests live in `backend/tests/`. No real database or network required — Supabase is mocked.

### Run all backend tests
```bash
cd backend
pytest
```

### Run with coverage report
```bash
pytest --cov=. --cov-report=term-missing --cov-omit="tests/*,seed.py"
```

### Run a specific category
```bash
pytest -m unit          # pure unit tests
pytest -m integration   # API + DB flow tests
pytest -m security      # auth & isolation tests
pytest -m regression    # bug-regression guards
```

### Run a single file
```bash
pytest tests/test_regression.py -v
pytest tests/test_security.py -v
```

---

## Test Files — Backend

| File | Category | What it tests |
|---|---|---|
| `tests/conftest.py` | Setup | Fixtures, mock DB helpers, fake AuthUser |
| `tests/test_encryption.py` | Unit | `encrypt()`, `decrypt()`, `rotate_key()` |
| `tests/test_essays.py` | Integration | All `/api/essays` endpoints |
| `tests/test_applications.py` | Integration | All `/api/applications` endpoints |
| `tests/test_agent_jobs.py` | Integration | All `/api/agent-jobs` endpoints |
| `tests/test_deadlines.py` | Integration | All `/api/deadlines` endpoints |
| `tests/test_documents.py` | Integration | All `/api/documents` endpoints |
| `tests/test_security.py` | Security | Auth required, cross-agency isolation, body injection |
| `tests/test_regression.py` | Regression | One test per fixed bug — prevents reintroduction |

---

## Frontend Tests (Jest + React Testing Library)

### Run unit & component tests
```bash
cd frontend
npm test
```

### Run with coverage
```bash
npm run test:coverage
```

---

## E2E Tests (Playwright)

Requires the dev server running OR will start it automatically:

### Run all E2E tests
```bash
cd frontend
npm run test:e2e
```

### Run smoke tests only
```bash
npm run test:smoke
```

### Run with visible browser (debug mode)
```bash
npx playwright test --headed
```

### E2E with credentials (required for auth tests)
```bash
E2E_TEST_EMAIL=staff@youragency.com \
E2E_TEST_PASSWORD=yourpassword \
npm run test:e2e
```

> **Note:** Auth E2E tests will auto-skip if credentials aren't set.

---

## Test Files — Frontend

| File | Type | What it tests |
|---|---|---|
| `__tests__/components/AnalyticsCharts.test.tsx` | Component | SparkLine (BUG-007), DonutChart, compliance gauge |
| `__tests__/e2e/smoke.spec.ts` | Smoke | Homepage, login page, dashboard redirect, 404 |
| `__tests__/e2e/user-journeys.spec.ts` | E2E | Login flow, nav, accept-invite link (BUG-009) |

---

## What Each Test Category Covers

| Category | What it proves |
|---|---|
| **Unit** | Encryption is correct, round-trips work, bad tokens raise errors |
| **Integration** | Every endpoint returns the right status codes and shapes |
| **Security** | 401 without JWT, 404 on cross-agency data, agency_id from token only |
| **Regression** | Every bug that was fixed can't silently come back |
| **Component** | React components render without crashing in all edge cases |
| **Smoke** | App isn't catastrophically broken after a deploy |
| **E2E** | Real user journeys work in a browser |

---

## CI/CD Integration

Add to your CI pipeline (GitHub Actions example):

```yaml
- name: Backend tests
  run: |
    cd backend
    pip install -r requirements.txt
    pytest --tb=short

- name: Frontend component tests
  run: |
    cd frontend
    npm ci
    npm test -- --ci --passWithNoTests

- name: Playwright smoke tests (staging)
  run: |
    cd frontend
    npx playwright install --with-deps chromium
    E2E_BASE_URL=https://staging.applypilot.co npm run test:smoke
```
