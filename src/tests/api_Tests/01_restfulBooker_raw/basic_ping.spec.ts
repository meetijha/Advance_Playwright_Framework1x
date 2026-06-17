import {test,expect} from '@playwright/test'
import { request } from 'https'

test('Ping request', async ({request})=> {

    const responseData= await request.get('/ping');
    expect (responseData.status()).toBe(201);
    
});