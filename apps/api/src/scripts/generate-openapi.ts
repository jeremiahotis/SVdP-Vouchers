import { writeFile } from "node:fs/promises";
import Fastify from "fastify";
import { registerOpenApi } from "../openapi";
import { registerRoutes } from "../routes";

const app = Fastify({ logger: false });

await registerOpenApi(app);
registerRoutes(app);

await app.ready();

const spec = app.swagger();

function splitSpec(targetTag: string) {
  const paths: Record<string, unknown> = {};

  for (const [path, ops] of Object.entries(spec.paths ?? {})) {
    const opRecord = ops as Record<string, { tags?: string[] }>;
    const hasTag = Object.values(opRecord).some((op) => op?.tags?.includes(targetTag));
    if (hasTag) {
      paths[path] = ops;
    }
  }

  return {
    ...spec,
    info: {
      ...spec.info,
      description:
        targetTag === "admin"
          ? "Internal. No compatibility guarantees."
          : spec.info?.description,
    },
    paths,
  };
}

const publicSpec = splitSpec("public");
const adminSpec = splitSpec("admin");

await writeFile(new URL("../../openapi.public.json", import.meta.url), JSON.stringify(publicSpec, null, 2));
await writeFile(new URL("../../openapi.admin.json", import.meta.url), JSON.stringify(adminSpec, null, 2));
