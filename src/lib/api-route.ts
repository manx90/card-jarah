import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export interface RouteContext {
  params?: Promise<Record<string, string>>;
}

function clientIp(request: Request): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

/** يسجّل كل طلب API في logs/*-access.log والأخطاء في logs/*-error.log */
export function withApiHandler<C extends RouteContext = RouteContext>(
  routeName: string,
  handler: (request: Request, context: C) => Promise<Response>,
): (request: Request, context: C) => Promise<Response> {
  return async (request: Request, context: C) => {
    const start = Date.now();
    const url = new URL(request.url);
    const ip = clientIp(request);

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - start;
      const status = response.status;

      await logger.access(`${request.method} ${url.pathname}`, {
        route: routeName,
        status,
        durationMs,
        ip,
        query: url.search || undefined,
      });

      if (status >= 500) {
        await logger.error(`API ${status} ${routeName}`, {
          route: routeName,
          status,
          path: url.pathname,
          method: request.method,
        });
      } else if (status >= 400) {
        await logger.warn(`API ${status} ${routeName}`, {
          route: routeName,
          status,
          path: url.pathname,
          method: request.method,
        });
      }

      return response;
    } catch (err) {
      const durationMs = Date.now() - start;
      await logger.routeError(routeName, err, {
        method: request.method,
        path: url.pathname,
        durationMs,
        ip,
      });
      return jsonError("SERVER_ERROR", "خطأ داخلي في الخادم", 500);
    }
  };
}
