# nextjs-http-supertest

This package do several things:
* Parse the file under your `pages/api` nextJS folder
* Link your handler with the HTTP endpoint
* When performing a request with `supertest`, parsing the URL and the query parameters to call the correct handler.

Requirement: Your api handlers must be located under `pages/api` or `src/pages/api` at the root of your nextJS repository.

It returns an http server instance (do not forget to close it after running your test suite).

Example below in a `toto.test.js` jest file.

```javascript
import request from 'supertest';
import server from 'nextjs-http-supertest';

describe('my super test suite', () => {

    afterAll(() => {
        server.close(); // don't forget to close your server after your tests
    })

    it('200: Should return a toto array', async () => {
        const r = await request(server).get('/api/toto').query({ offset: 0, limit: 10 });
        expect(r.statusCode).toEqual(200);
        expect(r.body.length).toEqual(10);
    })
})
```

It handles typescript
