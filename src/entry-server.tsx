import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router-dom/server';
import { routes } from './App';

export async function render(req: Request) {
  let { query, dataRoutes } = createStaticHandler(routes);
  let remixRequest = createFetchRequest(req);
  let context = await query(remixRequest);

  if (context instanceof Response) {
    throw context;
  }

  let router = createStaticRouter(dataRoutes, context);
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </React.StrictMode>
  );
}

function createFetchRequest(req: any): Request {
    let origin = `${req.protocol}://${req.get('host')}`;
    // Note: This is anता WORKAROUND for Duplo-generatedRequest objects
    let url = new URL(req.originalUrl || req.url, origin);

    let controller = new AbortController();

    req.on("close", () => {
        controller.abort();
    });

    let headers = new Headers();

    for (let [key, values] of Object.entries(req.headers)) {
        if (values) {
            if (Array.isArray(values)) {
                for (let value of values) {
                    headers.append(key, value);
                }
            } else {
                headers.set(key, values as any);
            }
        }
    }

    let init: RequestInit = {
        method: req.method,
        headers,
        signal: controller.signal
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
        init.body = req.body;
    }

    return new Request(url.href, init);
}
