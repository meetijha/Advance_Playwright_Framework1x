import {test, expect} from '@playwright/test';
import {ApiHelper} from '../../../utils/ApiHelper';
import { createLogger } from '@utils/logger';
import { visualStep } from '@utils/visualStep';

interface CreateBookingResponse {
    bookingid: number;
    booking: {
        firstname: string;
        lastname: string;
        totalprice: number;
        depositpaid: boolean;
        bookingdates: {
            checkin: string;
            checkout: string;
        };
        additionalneeds: string;
    }
}


const log = createLogger('create_Booking.spec.ts');

test.describe('@P0 @regression Level 2 (APIHelper) -POST create booking', () => {
    
    test('POST /booking creates a booking and echoes it back', async ({request, page}) => {

        const api = new ApiHelper(request);
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

        let response: any;
        let body: CreateBookingResponse;

        // Step 1: Send POST /booking request
        await visualStep(page, 'Send POST /booking request', async () => {
            log.info('Sending POST /booking request with payload');
            response = await api.post('/booking', payload);
            log.info(`Response status: ${response.status()}`);
            expect(api.isSuccess(response)).toBe(true);
        });

        // Step 2: Validate response body
        await visualStep(page, 'Validate booking response body', async () => {
            log.info('Parsing response and validating booking details');
            body = await api.parseJsonResponse<CreateBookingResponse>(response as any);

            expect(body.booking.firstname).toBe(payload.firstname);
            expect(body.booking.lastname).toBe(payload.lastname);
            expect(body.booking.totalprice).toBe(payload.totalprice);
            expect(body.booking.depositpaid).toBe(payload.depositpaid);
            expect(body.booking.bookingdates.checkin).toBe(payload.bookingdates.checkin);
            expect(body.booking.bookingdates.checkout).toBe(payload.bookingdates.checkout);
            expect(body.booking.additionalneeds).toBe(payload.additionalneeds);
            log.info('All booking assertions passed');
        });
    });
});