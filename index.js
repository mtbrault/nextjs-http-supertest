const http = require('http');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const { apiResolver } = require('next/dist/server/api-utils/node');

const rootPath = path.resolve('.');
const nextPagesDirectory = fs.existsSync(`${rootPath}/pages`) ? `${rootPath}/pages` : `${rootPath}/src/pages`;

const handlers = glob.sync(`${nextPagesDirectory}/api/**/*.+(ts|js)`).map((handler) => handler.slice(nextPagesDirectory.length, -3));

const mapping = {};
handlers.forEach((handler) => {
    const key = handler.endsWith('/index') ? handler.slice(0, -6) : handler; // handle index routes 
    mapping[key] = require(`${nextPagesDirectory}${handler}`);
});

function getHandler(url){
  const handler = mapping[url];
    
  if(handler) {
    return { handler };
  }

  const lastSlashIndex = url.lastIndexOf('/');
  const basePath = url.slice(0, lastSlashIndex + 1);
  const keys = Object.keys(mapping);
  const key = keys.find(key => key.startsWith(basePath + '[') && key.endsWith(']')); // handle dynamic routes 

  if(key) {
    const routeParameterKey = key.split('[')[1].replace(']', '');
    const routeParameterValue = url.slice(lastSlashIndex + 1);

    return {
      handler: mapping[key],
      routeParams: {
        [routeParameterKey]: routeParameterValue
      }
    };
  }
}

const requestHandler = (
    request,
    response,
) => {
    const [url, queryParams] = request.url.split('?');
    const params = new URLSearchParams(queryParams);
    const query = Object.fromEntries(params);
    const { handler, routeParams } = getHandler(url);
    
    return apiResolver(
        Object.assign(request, { connection: { remoteAddress: '127.0.0.1' } }),
        response,
        { ...query, ...routeParams },
        handler,
        undefined,
        true,
    );
};

const server = http.createServer(requestHandler);

module.exports = server;
