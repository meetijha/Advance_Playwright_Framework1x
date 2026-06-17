import {test,expect,request} from '@playwright/test'

test('new context for isolated headers', async ()=> {

    const ctx= await request.newContext({

        baseURL: "https://gorest.in/public/v2/users",
        extraHTTPHeaders: {'X-Trace-Id': 'demo-123'},
        timeout: 15_000

 });
 const ping =await ctx.get('?page=1&per_page=10');
 expect(ping.status()).toBe(200);

 await ctx.dispose();
});