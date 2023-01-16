# nextjs-http-supertest

This package do several things:
* Parse the file under your `pages/api` nextJS folder
* Link your handler with the HTTP endpoint
* When performing a request with `supertest`, parsing the URL and the query parameters to call the correct handler.

It returns a function which takes only one parameter: your `pages` nextJS folder.

Example below in a `toto.test.js` jest file.

```javascript
import request from 'supertest';
import getServer from 'nextjs-http-supertest';

const server = getServer('../src/pages');

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