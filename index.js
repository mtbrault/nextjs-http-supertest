const http = require('http');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const { apiResolver } = require('next/dist/server/api-utils/node');
const { inspect } = require('node:util')

const rootPath = path.resolve('.').replace(/\\/g, '/');
const nextPagesDirectory = fs.existsSync(`${rootPath}/pages`) ? `${rootPath}/pages` : `${rootPath}/src/pages`;

const handlers = glob.sync(`${nextPagesDirectory}/api/**/*.+(ts|js)`).map((handler) => handler.slice(nextPagesDirectory.length, -3));

const mapping = {};
handlers.forEach((handler) => {
  const key = handler.endsWith('/index') ? handler.slice(0, -6) : handler; // handle index routes
  mapping[key] = require(`${nextPagesDirectory}${handler}`);
});

const getDynamicRoute = (routes, url) => {
  const urlSplit = url.split('/');

  for (const route of routes) {
    const routeParams = {};
    const routeSplit = route.split('/');

    if (routeSplit.length !== urlSplit.length) {
      continue;
    }

    for (let index = 0; index < routeSplit.length; index++) {
      const routePath = routeSplit[index];
      const urlPath = urlSplit[index];

      if (routePath.startsWith('[') && routePath.endsWith(']')) { // if its a dynamic sub-path extend the route params
        routeParams[routePath.substring(1, routePath.length - 1)] = urlPath;
      } else if (routePath !== urlPath) {
        break; // if the path does not match, check a new route
      }

      if (index === routeSplit.length - 1) {
        return {
          route,
          routeParams
        };
      }
    }
  }
}

const getHandler = (url) => {
  const handler = mapping[url];

  if (handler) {
    return { handler };
  }
  
  const routes = Object.keys(mapping);
  const dynamicRoutes = routes.filter(route => route.includes('[') && route.includes(']'));
  dynamicRoutes.sort((a, b) => b.length - a.length) // Most specific routes take precedence

  const { route, routeParams } = getDynamicRoute(dynamicRoutes, url);
  
  return {
    handler: mapping[route],
    routeParams,
  };
}

const requestHandler = (
  request,
  response,
) => {
  try {
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
  } catch (err) {
    const message = `Error handling request in nextjs-http-supertest: ${inspect(
      err,
    )}`;
    console.error(message);
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message }));
  }
};

const server = http.createServer(requestHandler);

module.exports = server;
