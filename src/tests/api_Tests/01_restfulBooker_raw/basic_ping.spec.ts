import { test, expect } from '@playwright/test';

test('Ping request', async ({ request }) => { // request is a built-in fixture provided by Playwright Test for making HTTP requests
    const responseData = await request.get('/ping'); // /ping is the endpoint, base URL is set in playwright.config.ts
    console.log(responseData); 
    expect(responseData.status()).toBe(201);
});