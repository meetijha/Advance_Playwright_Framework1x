import { test, expect } from '@playwright/test';
import { logger } from '@utils/logger';

test.describe('Restful Booker booking API', () => {
    test('TC#2 @p0 - PUT : Verify that update the existing booking is working fine.', async ({ request }) => {
        const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };

        // Payload to create a new booking.
        const payload = {
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

        // Payload to update the existing booking.
        const updatedPayload = {
            ...payload,
            firstname: 'UpdatedMeeti',
            lastname: 'UpdatedJha',
            additionalneeds: 'Dinner',
        };

        let token = '';
        let bookingId = 0;

        await test.step('Create auth token', async () => {
            const responseData = await request.post(`${baseUrl}/auth`, {
                headers,
                data: {
                    username: 'admin',
                    password: 'password123',
                },
            });
            expect(responseData.status()).toBe(200);

            const data = await responseData.json();
            token = data.token;
            expect(token).toBeTruthy();
            logger.info('Created auth token for PUT booking flow');
        });

        await test.step('Create booking to update', async () => {
            const responseData = await request.post(`${baseUrl}/booking`, {
                headers,
                data: payload,
            });
            expect(responseData.status()).toBe(200);

            const data = await responseData.json();
            bookingId = data.bookingid;
            expect(bookingId).toBeTruthy();
            logger.info(`Created booking id for update: ${bookingId}`);
        });

        await test.step('Update booking', async () => {
            const responseData = await request.put(`${baseUrl}/booking/${bookingId}`, {
                headers: {
                    ...headers,
                    Cookie: `token=${token}`,
                },
                data: updatedPayload,
            });
            expect(responseData.status()).toBe(200);

            const data = await responseData.json();
            expect(data.firstname).toBe(updatedPayload.firstname);
            expect(data.lastname).toBe(updatedPayload.lastname);
            logger.info(`Updated booking id ${bookingId}: ${data.firstname} ${data.lastname}`);
        });
    });
});