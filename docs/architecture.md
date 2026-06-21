# Playwright Test Automation Framework — Build Specification

> **ROLE:** You are a senior SDET. Build a complete, enterprise-grade Playwright + TypeScript test automation framework from scratch, exactly as specified below. Generate every file, folder, config, and example listed. Do not skip layers. Do not ask clarifying questions — make sensible decisions where details are unspecified and follow the conventions defined here.

---

## Objective

Produce a production-ready, scalable Playwright framework using a strict **3-layer separation**: Pages (locators only) → Modules (business logic) → Tests (specs). Add supporting layers for configuration, utilities, API testing, fixtures, reporting, and CI/CD. The framework must be runnable immediately after `npm install` and `npx playwright install`.

**Non-negotiable architectural rule:** Locators live ONLY in Pages. Business logic lives ONLY in Modules. Tests orchestrate Modules — never touch locators or `page.locator()` directly.

---

## Tech Stack

- Playwright Test (`@playwright/test`)
- TypeScript (strict mode)
- Node.js
- Path aliases via `tsconfig.json` (e.g. `@pages`, `@modules`, `@utils`, `@fixtures`, `@config`, `@api`)
- `dotenv` for environment management
- Faker (or equivalent) for test data generation

---

## Project Structure

Generate this exact tree:

```
Playwright_Framework/
├── playwright.config.ts          # Playwright configuration
├── tsconfig.json                 # TypeScript configuration + path aliases
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Template committed to repo
├── package.json                  # Scripts + dependencies
├── .gitignore
│
├── src/
│   ├── pages/                    # Layer 1: Locators & basic UI actions
│   │   ├── LoginPage.ts
│   │   ├── HomePage.ts
│   │   ├── ProductPage.ts
│   │   └── CheckoutPage.ts
│   │
│   ├── modules/                  # Layer 2: Business logic orchestration
│   │   ├── LoginModule.ts
│   │   ├── ProductModule.ts
│   │   └── CheckoutModule.ts
│   │
│   ├── tests/                    # Layer 3: Test specifications
│   │   ├── login.spec.ts
│   │   ├── product.spec.ts
│   │   └── checkout.spec.ts
│   │
│   ├── api/                      # API testing layer
│   │   ├── AuthApi.ts
│   │   ├── ProductApi.ts
│   │   └── OrderApi.ts
│   │
│   ├── utils/                    # Helper utilities
│   │   ├── Logger.ts
│   │   ├── WaitHelper.ts
│   │   ├── DataGenerator.ts
│   │   ├── ApiHelper.ts
│   │   └── CustomTTAReporter.ts
│   │
│   ├── fixtures/                 # Custom Playwright fixtures
│   │   ├── auth.fixture.ts
│   │   └── index.ts
│   │
│   ├── config/                   # Configuration management
│   │   ├── index.ts
│   │   ├── authors.ts
│   │   └── test-groups.ts
│   │
│   └── testdata/                 # Test data files (JSON)
│
├── tta-report/                   # TTA custom HTML reports
├── playwright-report/            # Default Playwright reports
└── test-results/                 # JSON results & artifacts
```

---

## Layer Specifications

### Layer 1 — Configuration

Files: `playwright.config.ts`, `tsconfig.json`, `.env`, `src/config/index.ts`

Requirements:
- **60s test timeout**, configurable via env.
- **Parallel execution** enabled (`fullyParallel: true`, multiple workers).
- **Multi-browser** projects: Chromium, Firefox, WebKit, plus a Mobile viewport project.
- `baseURL` driven by `BASE_URL` env var supporting `dev` / `staging` / `prod`.
- Retries on CI, screenshots on failure, video on failure, trace on first retry.
- `src/config/index.ts` centralizes typed access to all environment variables — no `process.env` reads scattered through the codebase.
- `tsconfig.json` defines path aliases consumed everywhere (no relative `../../` imports).

### Layer 2 — Pages (Locators Only)

Files: `LoginPage.ts`, `HomePage.ts`, `ProductPage.ts`, `CheckoutPage.ts`

Strict rules:
- Locators defined **as arrow functions** returning a `Locator`.
- Only simple, single-purpose UI actions (fill, click, read text).
- **No business logic, no conditionals driving flow, no orchestration.**
- A `private page: Page` constructor property.
- **Named exports only.** Single responsibility per class.

Reference template:

```typescript
export class LoginPage {
  constructor(private page: Page) {}

  // Locators as arrow functions
  usernameInput = () => this.page.locator('#username');
  passwordInput = () => this.page.locator('#password');
  submitBtn = () => this.page.getByRole('button', { name: 'Submit' });

  // Simple action methods
  async fillUsername(user: string) {
    await this.usernameInput().fill(user);
  }
  async fillPassword(pass: string) {
    await this.passwordInput().fill(pass);
  }
  async clickSubmit() {
    await this.submitBtn().click();
  }
}
```

### Layer 3 — Modules (Business Logic)

Files: `LoginModule.ts`, `ProductModule.ts`, `CheckoutModule.ts`

Strict rules:
- Consume **Page class methods** only — never call `page.locator()` or define locators.
- Hold all **business logic**: multi-step workflows, conditionals, validations.
- Fully `async/await`. Include error handling.
- Representative methods: `doLogin()`, `doLogout()`, `addProductToCart()`, `completeCheckout()`.

Reference template:

```typescript
export class LoginModule {
  constructor(
    private page: Page,
    private loginPage: LoginPage
  ) {}

  // Business logic orchestration
  async doLogin(user: string, pass: string) {
    await this.loginPage.fillUsername(user);
    await this.loginPage.fillPassword(pass);
    await this.loginPage.clickSubmit();
  }
}
```

### Layer 4 — Utilities

Files: `Logger.ts`, `WaitHelper.ts`, `DataGenerator.ts`, `ApiHelper.ts`

- `Logger.ts` — structured logging with levels (info/warn/error/debug). No raw `console.log` anywhere else in the framework.
- `WaitHelper.ts` — custom/explicit wait conditions beyond Playwright auto-waiting.
- `DataGenerator.ts` — random/dynamic test data generation.
- `ApiHelper.ts` — reusable request wrappers plus retry mechanisms.

### Layer 5 — API Testing

Files: `AuthApi.ts`, `ProductApi.ts`, `OrderApi.ts`

- `AuthApi.ts` — `login()`, `register()`.
- `ProductApi.ts` — `getProduct()`, `searchProducts()`.
- `OrderApi.ts` — `createOrder()`, `cancelOrder()`.
- Built on Playwright's `APIRequestContext`; used for setup/teardown and pure API tests.

### Layer 6 — Custom Fixtures

Files: `auth.fixture.ts`, `index.ts`

- Provide **page object fixtures** and **module fixtures** so specs receive ready instances by destructuring.
- Provide **pre-authenticated sessions** to skip repeated UI login.
- Exposed fixtures must include at least: `loginPage`, `authenticatedPage`, and module fixtures like `loginModule`.
- `index.ts` is the single import surface (`import { test } from '@fixtures'`).

### Layer 7 — Reporting

- HTML report → `playwright-report/`
- JSON report → `test-results/`
- Screenshots on failure, videos on failure, trace files.
- `CustomTTAReporter.ts` → custom HTML output in `tta-report/`.

### Layer 8 — CI/CD Integration

- Multi-browser execution across Chromium, Firefox, WebKit, Mobile.
- Environment selection via env vars.
- Artifact publishing (reports, screenshots, videos, traces).
- Parallel workers tuned for CI.

---

## Authors & Test Groups

Files: `src/config/authors.ts`, `src/config/test-groups.ts`

- Authors: `@pramod`, `@team`.
- Groups: `login`, `product`, `checkout`.
- Wire these into tags so tests are filterable by author and by functional group.

---

## Test Spec Conventions

Files: `login.spec.ts`, `product.spec.ts`, `checkout.spec.ts`

Every spec must:
- Import `test` from the fixtures barrel: `import { test } from '@fixtures';`
- Carry **tags** (e.g. `@P0`, `@Login`) for filtering.
- Wrap each logical action in `test.step()` for readable reporting.
- Use `beforeEach` / `afterEach` for setup and cleanup.
- Attach screenshots per step.
- Drive everything through **Modules** — never locators.

Reference template:

```typescript
import { test } from '@fixtures';

test.describe('@P0 Login', () => {
  test('should login successfully', async ({ loginModule }) => {
    await test.step('Login', async () => {
      await loginModule.doLogin('user', 'pass');
    });
  });
});
```

---

## Common Mistakes to Prevent (enforce in generated code)

| ❌ Wrong | ✅ Right |
|---------|---------|
| Locator inside a Module: `this.page.locator('#btn')` | Call the Page: `this.loginPage.submitBtn()` |
| Flow logic inside a Page: `if (condition) doSomething()` | Logic in the Module: `module.handleCondition()` |
| Bare actions: `await login(); await navigate();` | Wrapped: `await test.step('Login', async () => {...})` |

---

## Code Review Checklist (the generated framework must satisfy all)

**Page Class**
- [ ] Locators as arrow functions
- [ ] No business logic
- [ ] Private `page` property
- [ ] Named exports only
- [ ] Single responsibility

**Module Class**
- [ ] Uses Page class methods
- [ ] No direct locators
- [ ] Business logic only
- [ ] Async/await pattern
- [ ] Error handling

**Test Spec**
- [ ] Has tags (`@P0`, `@Login`)
- [ ] Uses `test.step()`
- [ ] Has `beforeEach` / `afterEach`
- [ ] Screenshots attached
- [ ] Proper cleanup

**General**
- [ ] Correct folder location
- [ ] Uses path aliases
- [ ] No hardcoded values
- [ ] JSDoc comments
- [ ] No `console.log`

---

## NPM Scripts (define in `package.json`)

```
npm test                  # Run all tests
npm run test:headed       # Visible browser
npm run test:ui           # Playwright UI mode
npm run test:debug        # Debug mode
npm run report            # Open Playwright report
```

Also support directly:
- `npx playwright test --grep "@P0"` — run by tag
- `npx playwright test --project=chromium` — run by browser
- `npx playwright codegen` — record tests
- `npx playwright show-report` — view HTML report
- `npx playwright show-trace` — inspect a trace

---

## Documentation to Generate

- `README.md` — setup, run instructions, structure overview.
- `CONTRIBUTING.md` — folder rules, Page/Module/Spec templates, naming conventions, code review checklist, best practices.
- `docs/QUICK_REFERENCE.md`, `docs/MULTI_BROWSER.md`, `docs/BROWSER_CONFIG.md`, `docs/API_HELPER.md`, `docs/FIXTURES.md`.

---

## Test Execution Flow (the architecture being built)

```
Test Specs → Fixtures → Modules → Pages → Browser → Reports
```

---

## Build Order (follow this sequence)

1. `package.json`, `tsconfig.json` (with aliases), `playwright.config.ts`, `.env.example`, `.gitignore`.
2. `src/config/` — `index.ts`, `authors.ts`, `test-groups.ts`.
3. `src/utils/` — Logger, WaitHelper, DataGenerator, ApiHelper, CustomTTAReporter.
4. `src/pages/` — all four Page classes.
5. `src/modules/` — all three Module classes.
6. `src/api/` — all three Api classes.
7. `src/fixtures/` — `auth.fixture.ts`, `index.ts`.
8. `src/tests/` — all three spec files using fixtures, tags, and `test.step()`.
9. Documentation files.
10. Verify: `npm install`, `npx playwright install`, then `npm test` runs green.

**Deliver the complete framework. Every file in the structure above must exist with working, lint-clean, strictly-typed code that honors the 3-layer separation.**

---

