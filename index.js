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

const getDynamicRounte = (routes, url) => {
  const urlSplit = url.split('/');

  routes.forEach((route) => {
    const routeParams = {};
    const routeSplit = route.split('/');

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
  });
}

const getHandler = (url) => {
  const handler = mapping[url];

  if (handler) {
    return { handler };
  }
  
  const routes = Object.keys(mapping);
  const dynamicRoutes = routes.filter(route => route.includes('[') && route.includes(']'));

  const { route, routeParams } = getDynamicRounte(dynamicRoutes, url);
  
  return {
    handler: mapping[route],
    routeParams,
  };
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
