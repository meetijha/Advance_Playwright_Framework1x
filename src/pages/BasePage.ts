import { Page } from '@playwright/test';
import { UtilElementLocator } from '@utils/UtilElementLocator.js';
import { createLogger, type Logger } from '@utils/logger.js';

/**
 * BasePage - shared scaffolding for every TTACart Page Object.
 *
 * The TTACart suite is intentionally thin. We only inherit:
 *  - `page`     -> Playwright Page handle
 *  - `el`       -> UtilElementLocator wrapper for actions
 *  - `log`      -> a per-page Logger (scope = the subclass name)
 *  - `goto(p)`  -> small navigation helper that respects baseURL
 *
 * Subclasses still declare their own `private readonly` Locator fields; the
 * base class deliberately does NOT pre-build any locators.
 */


export abstract class BasePage {
    protected readonly page: Page;        // direct access to the Playwright Page for advanced use cases
    protected readonly el: UtilElementLocator;      // a wrapper for common element actions, with built-in logging and error handling
    protected readonly log: Logger;       // a per-page logger with the scope set to the subclass name
    protected constructor(page: Page, scope: string) {
        this.page = page;
        this.el = new UtilElementLocator(page, scope);
        this.log = createLogger(scope);
    }

    protected async goto(relativePath: string): Promise<void> {
        await this.page.goto(relativePath);
        await this.page.waitForLoadState('domcontentloaded'); // ensure the page is ready before any further actions
    }

}