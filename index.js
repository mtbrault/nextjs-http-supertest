const http = require('http');
const glob = require('glob');
const path = require('path');
const { apiResolver } = require('next/dist/server/api-utils/node');

module.exports = (nextPagesDirectory) => {
    handlers = glob.sync(`${nextPagesDirectory}/api/**/*.js`).map((handler) => handler.slice(nextPagesDirectory.length, -3));

    const mapping = {};
    handlers.forEach((handler) => {
        mapping[handler] = require(`${path.resolve('.')}/${nextPagesDirectory}${handler}`);
    });

    const requestHandler = (
        request,
        response,
    ) => {
        const [url, queryParams] = request.url.split('?');
        const params = new URLSearchParams(queryParams);
        const query = Object.fromEntries(params);
        return apiResolver(
            Object.assign(request, { connection: { remoteAddress: '127.0.0.1' } }),
            response,
            query,
            mapping[url],
            undefined,
            true,
        );
    };

    const server = http.createServer(requestHandler);

    return server;
}