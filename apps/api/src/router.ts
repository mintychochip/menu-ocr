export type Handler<Env = unknown> = (
  request: Request & { params: Record<string, string> },
  env: Env,
  ctx: ExecutionContext
) => Promise<Response> | Response

export type Middleware<Env = unknown> = (
  request: Request & { params: Record<string, string> },
  env: Env,
  ctx: ExecutionContext,
  next: () => Promise<Response>
) => Promise<Response> | Response

type Route<Env = unknown> = {
  method: string
  pattern: URLPattern
  handler: Handler<Env>
  paramNames: string[]
}

export class Router<Env = unknown> {
  private routes: Route<Env>[] = []
  private middlewares: Middleware<Env>[] = []

  use(middleware: Middleware<Env>) {
    this.middlewares.push(middleware)
  }

  get(path: string, handler: Handler<Env>) {
    this.addRoute('GET', path, handler)
  }

  post(path: string, handler: Handler<Env>) {
    this.addRoute('POST', path, handler)
  }

  put(path: string, handler: Handler<Env>) {
    this.addRoute('PUT', path, handler)
  }

  delete(path: string, handler: Handler<Env>) {
    this.addRoute('DELETE', path, handler)
  }

  private addRoute(method: string, path: string, handler: Handler<Env>) {
    const paramNames: string[] = []
    const pattern = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name)
      return '*'
    })

    this.routes.push({
      method,
      pattern: new URLPattern({ pathname: pattern }),
      handler,
      paramNames
    })
  }

  async handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    for (const route of this.routes) {
      if (route.method !== request.method) continue
      
      const match = route.pattern.exec(url)
      if (!match) continue

      const params: Record<string, string> = {}
      const pathname = match.pathname
      
      if (pathname.groups) {
        route.paramNames.forEach((name, i) => {
          const value = pathname.groups[i]
          if (value) params[name] = value
        })
      }

      const req = Object.assign(request, { params })

      // Apply middlewares
      const executeMiddleware = async (index: number): Promise<Response> => {
        if (index >= this.middlewares.length) {
          return route.handler(req, env, ctx)
        }
        
        return this.middlewares[index](req, env, ctx, () => executeMiddleware(index + 1))
      }

      return executeMiddleware(0)
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
