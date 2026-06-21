// APIs Helper is a simple type of a class which can help you to make a different type of HTTP 
// We abstract the underlying HTTP request logic because it allows us to centralize and standardize how we interact with APIs across our test suite.
// This promotes code reuse, reduces duplication, and makes it easier to maintain and update our API interaction logic in one place.
// It also provides a layer of abstraction that can simplify test code and make it more readable.

import { Page, APIRequestContext, APIResponse } from '@playwright/test';

export type ApiContext = Page | APIRequestContext;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request Modifiction
export interface ApiRequestOptions {
    url: string;
    method: HttpMethod;
    headers?: Record<string, string>;
    data?: unknown; // payload, body
    params?: Record<string, string>;
    timeout?: number;
}

// ? - Optional Parameters 

// Retry Options interface defines the structure for configuring retry behavior when making API calls. 
// It includes a condition function to determine if a retry is needed, as well as optional parameters for polling interval and retry count.
// condition is in the form of a function that takes an APIResponse and returns a boolean or a Promise that resolves to a boolean.
export interface RetryOptions {
    condition: (response: APIResponse) => Promise<boolean> | boolean
    pollingInterval?: number;
    retryCount?: number;
}

export class ApiHelper {

    private context: ApiContext; // ApiContext can be either a Page or an APIRequestContext.
    constructor(context: ApiContext) {
        this.context = context;
    }

    /**
    * Get the request object from the context
    */


    private getRequest(): APIRequestContext {
        if ('request' in this.context) { // checks if the context is a Page (which has a request property) or an APIRequestContext (which does not).
            return this.context.request; // here this is a Page, so we return the request property of the Page.
        }
        return this.context as APIRequestContext; // here this is an APIRequestContext, so we return it directly.
    }

    /**
        * Build full URL with query parameters
        */

    // example1 -  https://example.com
    // example2 -  https://example.com/ param :  param1=abc&param2=xyz return-.  https://example.com/param1=abc&param2=xyz
    // exmaple3 - https://example.com/, params :  /student/1 -> https://example.com/student/1
    // builturl(example1)

    private buildUrl(url: string, params?: Record<string, string>): string {
        if (!params) return url;
        const searchParams = new URLSearchParams(params); // URLSearchParams is a built-in JavaScript class that provides utility methods to work with the query string of a URL. 
        return `${url}?${searchParams.toString()}`; 
    }

    /**
    * Perform an HTTP API request
    */
    async callApi(options: ApiRequestOptions): Promise<APIResponse> {
        const { url, method, headers, data, params, timeout } = options;
        const request = this.getRequest();
        const fullUrl = this.buildUrl(url, params);

        switch (method) {
            case 'GET':
                return await request.get(fullUrl, { headers, timeout });
            case 'POST':
                return await request.post(fullUrl, { headers, data, timeout });
            case 'PUT':
                return await request.put(fullUrl, { headers, data, timeout });
            case 'DELETE':
                return await request.delete(fullUrl, { headers, timeout });
            case 'PATCH':
                return await request.patch(fullUrl, { headers, data, timeout });
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
    }

    /**
     * Call API with retry logic
     */

    async callApiWithRetry(
        options: ApiRequestOptions,
        retryOptions: RetryOptions,
    ): Promise<APIResponse> {
        const { condition, pollingInterval = 5000, retryCount = 3 } = retryOptions;
        let lastResponse: APIResponse | null = null;

        for (let attempt = 1; attempt <= retryCount; attempt++) {
            lastResponse = await this.callApi(options);

            if (await condition(lastResponse)) {
                return lastResponse;
            }

            if (attempt < retryCount) {
                await new Promise(resolve => setTimeout(resolve, pollingInterval));
            }
        }

        return lastResponse!; // The exclamation mark (!) is a TypeScript non-null assertion operator. 
        // It tells the TypeScript compiler that you are certain that lastResponse will not be null or undefined at this point in the code, 
        // even though its type allows for it to be null. 
        // This is used here because, logically, if the loop has completed all attempts, lastResponse should have been assigned a value from the last call to callApi.
    }


    /**
     * Convenience method for GET requests
     */

    // Omit omits url and method from ApiRequestOptions because they are already provided in the callApi method. 
    // It prevents user from overriding url and method when calling get, post, put, delete, or patch methods.
    
    async get(url: string, options?: Omit<ApiRequestOptions, 'url' | 'method'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'GET', ...options });
    }
    /**
     * Convenience method for POST requests
     */
    async post(url: string, data?: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'POST', data, ...options });
    }

    /**
     * Convenience method for PUT requests
     */
    async put(url: string, data?: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'PUT', data, ...options });
    }

    /**
     * Convenience method for DELETE requests
     */
    async delete(url: string, options?: Omit<ApiRequestOptions, 'url' | 'method'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'DELETE', ...options });
    }

    /**
     * Convenience method for PATCH requests
     */
    async patch(url: string, data?: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
        return this.callApi({ url, method: 'PATCH', data, ...options });
    }

    /**
     * Parse JSON response with type safety
     */
    // T is a generic type parameter that allows the caller of parseJsonResponse to specify the expected type of the parsed JSON.
    async parseJsonResponse<T>(response: APIResponse): Promise<T> {
        return await response.json() as T;
    }

    /**
     * Check if response is successful (2xx status)
     */
    isSuccess(response: APIResponse): boolean {
        const status = response.status();
        return status >= 200 && status < 300;
    }
    /**
     * Check if response is successful (2xx status)
     */
    isFailureClient(response: APIResponse): boolean {
        const status = response.status();
        return status >= 400 && status < 500;
    }





}