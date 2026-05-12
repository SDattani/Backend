declare module "jsr:@supabase/functions-js/edge-runtime.d.ts" {
  export {};
}

declare namespace Deno {
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
  function env.get(key: string): string | undefined;
}
