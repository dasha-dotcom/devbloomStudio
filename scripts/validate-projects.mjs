import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");

const resolveAliasPath = (specifier) => {
  const relativePath = specifier.slice(2);
  const basePath = path.join(projectRoot, relativePath);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    basePath,
  ];

  return candidates.find((candidate) => existsSync(candidate) && !statSync(candidate).isDirectory());
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolvedPath = resolveAliasPath(specifier);

      if (!resolvedPath) {
        throw new Error(`Could not resolve alias import "${specifier}".`);
      }

      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }

    return nextResolve(specifier, context);
  },
});

const { getProjectIntegrityIssues, validateProjectsOrThrow } = await import(
  "../lib/projects/validate.ts"
);

try {
  validateProjectsOrThrow();
  console.log(`Project validation passed (${getProjectIntegrityIssues().length} issues).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
