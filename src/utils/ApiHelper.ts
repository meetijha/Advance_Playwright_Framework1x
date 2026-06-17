// APIs Helper is a utility class that provides methods to interact with the API endpoints of the application. It encapsulates the logic for making HTTP requests and handling responses, making it easier to perform API testing and integration within the Playwright framework.

import { Page, APIRequestContext, APIResponse } from '@playwright/test';

export type ApiContext = Page | APIRequestContext;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request Modification
export interface ApiRequestOptions {
    url: string;
    method: HttpMethod;
    headers?: Record<string, string>;
    data?: unknown; //payload , body
    params?: Record<string, string>; //query params
    timeout?: number; //timeout in milliseconds
}

// ? - Optional parameters

// Retry mechanism for API requests
export interface RetryOptions {

    condition: (response: APIResponse) => Promise<boolean> | boolean; // Condition to determine if a retry is needed
    pollinginterval?: number;
    retryCount?: number;
}

export class ApiHelper {
    private context: ApiContext;

    constructor(context: ApiContext) {
        this.context = context;
    }


    /**
     * Get the request object from context
     */

    private getRequest(): APIRequestContext {
        if ('request' in this.context) {
            return this.context.request;
        }

        return this.context as APIRequestContext;
    }

    /**
     * Build full URL with query parameters
     */

    private buildUrl(url: string, params?: Record<string, string>): string {
        if (!params) return url;

        const searchParams = new URLSearchParams(params);
        return `${url}?${searchParams.toString()}`;
    }

    /**
     * Perform an HTTP API request
     */

    async callApi(options: ApiRequestOptions): Promise<APIResponse> {
        const { url, method, headers, data, params, timeout } = options;
        const fullUrl = this.buildUrl(url, params);

        switch (method) {
            case 'GET':
                return await this.getRequest().get(fullUrl, { headers, timeout });
            case 'POST':
                return await this.getRequest().post(fullUrl, { headers, data, timeout });
            case 'PUT':
                return await this.getRequest().put(fullUrl, { headers, data, timeout });
            case 'DELETE':
                return await this.getRequest().delete(fullUrl, { headers, timeout });
            case 'PATCH':
                return await this.getRequest().patch(fullUrl, { headers, data, timeout });
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
    }


/**
 * Call API with retry logic
 */

async callApiWithRetry(
    options: ApiRequestOptions, 
    retryOptions: RetryOptions
): Promise<APIResponse> {

    const { condition, pollinginterval = 5000, retryCount = 3 } = retryOptions;
    let lastResponse: APIResponse | null = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
        lastResponse = await this.callApi(options);

        if (await condition(lastResponse)) {
            return lastResponse;
        }

        if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, pollinginterval));
        }
    }

    return lastResponse!;
}

/**
 * Convenience method for GET requests
 */

async get (url: string, options?: Omit<ApiRequestOptions, 'url' | 'method'>): Promise<APIResponse> {
    return this.callApi({ url, method: 'GET', ...options });
}

/**
 * Convenience method for POST requests
 */
async post(url: string, data: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
    return this.callApi({ url, method: 'POST', data, ...options });
}

/**
 * Convenience method for PUT requests
 */
async put(url: string, data: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
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
async patch(url: string,data: unknown, options?: Omit<ApiRequestOptions, 'url' | 'method' | 'data'>): Promise<APIResponse> {
    return this.callApi({ url, method: 'PATCH', data, ...options });
}
 
/**
 * Parse JSON response with type safety
 */

async parseJsonResponse<T>(response: APIResponse): Promise<T> {
    return await response.json() as T;

}

/**
 * Check if response is successful (status code 2xx)
 */
 isSuccess(response: APIResponse): boolean{
   const status = response.status();
   return status >= 200 && status < 300;
}

/**
 * Check if response is a client error (status code 4xx)
 */
 isfailure(response: APIResponse): boolean{
   const status = response.status();
   return status >= 400 && status < 500;
}


}