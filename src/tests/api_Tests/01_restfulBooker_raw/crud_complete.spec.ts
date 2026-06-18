// This test suite demonstrates a complete CRUD flow for the Restful Booker API using Playwright Test.
// It creates a token, creates a booking, updates the booking, and verifies the update.
// The tests are run in serial to ensure that the state is maintained across tests.

import { test, expect } from '@playwright/test';
import { logger } from '@utils/logger';

// Interfaces help in maintaining the structure and type consistency of the data being sent and received from the API.
interface BookingDates {
    checkin: string;
    checkout: string;
}

interface BookingPayload {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: BookingDates; // Seperate BookingDates interface present
    additionalneeds: string;
}

interface AuthTokenResponse {
    token: string;
}

interface CreateBookingResponse {
    bookingid: number;
    booking: BookingPayload;
}

interface BookingFlowState {
    token?: string;
    bookingId?: number;
}

test.describe.serial('Restful Booker CRUD API', () => {

    // Base URL and headers are defined here for reuse across tests.
    const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    // This object will hold the state of the booking flow across tests. 
    // Example: token and bookingId will be stored here after creation for use in subsequent tests.
    // BookingFlowState is also an interface.

    const bookingFlowState: BookingFlowState = {};
    const payload: BookingPayload = {
        firstname: 'Meeti',
        lastname: 'Jha',
        totalprice: 111,
        depositpaid: true,
        bookingdates: {
            checkin: '2018-01-01',
            checkout: '2019-01-01',
        },
        additionalneeds: 'Breakfast',
    };

    const updatedPayload: BookingPayload = {
    ...payload,
    firstname: 'UpdatedMeeti',
    lastname: 'UpdatedJha',
    additionalneeds: 'Lunch',
    };

    // Step 1: Create a token for authentication. This token will be used in the subsequent requests to update the booking.
    test('TC#1 @p0 - Create token', async ({ request }) => {
        await test.step('Create token', async () => {

    // for post we are using entire URL with baseUrl and endpoint /auth 
    // but we can also use request.post('/auth') if baseURL is set in playwright.config.ts

            const responseData = await request.post(`${baseUrl}/auth`, {
                headers,
                data: {
                    username: 'admin',
                    password: 'password123',
                },
            });

            expect(responseData.status()).toBe(200);

            // Parse the response to extract the token and store it in the bookingFlowState object for use in subsequent tests.
            //as -> Fetch JSON and treat it as AuthTokenResponse (without verifying it)
            const data = await responseData.json() as AuthTokenResponse;
            expect(data.token).toBeTruthy();

            bookingFlowState.token = data.token;
            logger.info('Created auth token for CRUD flow');
        });
    });

    // Step 2: Create a booking.
    test('TC#2 @p0 - Create booking', async ({ request }) => {
        await test.step('Create booking', async () => {
            const responseData = await request.post(`${baseUrl}/booking`, {
                headers,
                data: payload,
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as CreateBookingResponse;
            expect(data.bookingid).toBeTruthy();
            expect(data.booking.firstname).toBe(payload.firstname);
            expect(data.booking.lastname).toBe(payload.lastname);

            bookingFlowState.bookingId = data.bookingid;
            logger.info(`Created booking id for CRUD flow: ${bookingFlowState.bookingId}`);
        });
    });

    // Step 3: Get all booking ids and verify the created booking id is present in the list of all booking ids.
    test('TC#3 @p0 - Get all booking ids and verify created booking id is present', async ({ request }) => {
        await test.step('Get all booking ids', async () => {
            const responseData = await request.get(`${baseUrl}/booking`, {
                headers,
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as { bookingid: number }[];
            const bookingIds = data.map((booking) => booking.bookingid);

            expect(bookingIds).toContain(bookingFlowState.bookingId);
            logger.info(`Verified created booking id ${bookingFlowState.bookingId} is present in the list of all booking ids`);
        });
    });

    // Step 4: Update the booking using the created token and booking ID.
    test('TC#4 @p0 - Update booking', async ({ request }) => {
        await test.step('Update booking', async () => {
            const token = bookingFlowState.token;
            const bookingId = bookingFlowState.bookingId;

            if (!token || !bookingId) {
                throw new Error('Create token and create booking tests must pass before update booking.');
            }

            // ...headers → keeps existing headers
            // Cookie → adds authentication example: Cookie: `token=${token}` is used to authenticate the request with the token obtained from the previous step.
            const responseData = await request.put(`${baseUrl}/booking/${bookingId}`, {               
                headers: {
                    ...headers, 
                    Cookie: `token=${token}`, 
                }, 
                data: updatedPayload,
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as BookingPayload;
            expect(data.firstname).toBe(updatedPayload.firstname);
            expect(data.lastname).toBe(updatedPayload.lastname);
            expect(data.additionalneeds).toBe(updatedPayload.additionalneeds);

            expect(data.firstname).not.toBe(payload.firstname);
            expect(data.lastname).not.toBe(payload.lastname);
            expect(data.additionalneeds).not.toBe(payload.additionalneeds);

            logger.info(`Updated booking id ${bookingId}: ${data.firstname} ${data.lastname}`);
        });
    });

    // Step 5: Delete the booking using the created token and booking ID.
    test('TC#5 @p0 - Delete booking', async ({ request }) => {
        await test.step('Delete booking', async () => {
            const token = bookingFlowState.token;
            const bookingId = bookingFlowState.bookingId;

            if (!token || !bookingId) {
                throw new Error('Create token and create booking tests must pass before delete booking.');
            }

            const responseData = await request.delete(`${baseUrl}/booking/${bookingId}`, {
                headers: {
                    ...headers,
                    Cookie: `token=${token}`,
                },
            });

            expect(responseData.status()).toBe(201);
            logger.info(`Deleted booking id ${bookingId}`);
        });

    });

    // Step 6: Verify the booking has been deleted by attempting to fetch it and expecting a 404 response.
    test('TC#6 @p0 - Verify booking deletion', async ({ request }) => {
        await test.step('Verify booking deletion', async () => {
            const bookingId = bookingFlowState.bookingId;

            if (!bookingId) {
                throw new Error('Create booking test must pass before verifying deletion.');
            }

            const responseData = await request.get(`${baseUrl}/booking/${bookingId}`, {
                headers,
            });

            expect(responseData.status()).toBe(404);
            logger.info(`Verified deletion of booking id ${bookingId} with 404 response`);  
        });   

    });
    
});