import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const npmCmd = "npm";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    const status = result.status ?? result.signal ?? "unknown";
    throw new Error(output || `${command} ${args.join(" ")} failed with code ${status}`);
  }

  return result.stdout.trim();
}

async function main() {
  const pkg = JSON.parse(
    await readFile(path.join(rootDir, "package.json"), "utf8"),
  );

  const drizzleVersion = pkg.devDependencies?.["drizzle-orm"];
  if (!drizzleVersion) {
    throw new Error("Expected drizzle-orm in devDependencies for pack smoke test.");
  }

  const packJson = run(npmCmd, ["pack", "--json", "--silent"], rootDir);
  const [{ filename }] = JSON.parse(packJson);
  const tarballPath = path.join(rootDir, filename);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), `${pkg.name}-pack-smoke-`));

  try {
    run(npmCmd, ["init", "-y"], tempDir);
    run(
      npmCmd,
      ["install", tarballPath, `drizzle-orm@${drizzleVersion}`],
      tempDir,
    );

    const smokeScript = `
      const root = await import(${JSON.stringify(pkg.name)});
      const pg = await import(${JSON.stringify(`${pkg.name}/pg`)});
      const mysql = await import(${JSON.stringify(`${pkg.name}/mysql`)});
      const sqlite = await import(${JSON.stringify(`${pkg.name}/sqlite`)});

      const checks = [
        ['root.exportTranslations', typeof root.exportTranslations === 'function'],
        ['root.importTranslations', typeof root.importTranslations === 'function'],
        ['root.localizeResults', typeof root.localizeResults === 'function'],
        ['pg.createI18n', typeof pg.createI18n === 'function'],
        ['pg.translationTable', typeof pg.translationTable === 'function'],
        ['pg.jsonTranslations', typeof pg.jsonTranslations === 'function'],
        ['mysql.createI18n', typeof mysql.createI18n === 'function'],
        ['mysql.translationTable', typeof mysql.translationTable === 'function'],
        ['mysql.jsonTranslations', typeof mysql.jsonTranslations === 'function'],
        ['sqlite.createI18n', typeof sqlite.createI18n === 'function'],
        ['sqlite.translationTable', typeof sqlite.translationTable === 'function'],
        ['sqlite.jsonTranslations', typeof sqlite.jsonTranslations === 'function'],
      ];

      const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
      if (failed.length > 0) {
        throw new Error('Smoke test failed for exports: ' + failed.join(', '));
      }

      console.log('Tarball smoke test passed.');
    `;

    const smokeResult = spawnSync(process.execPath, ["--input-type=module", "--eval", smokeScript], {
      cwd: tempDir,
      encoding: "utf8",
      stdio: "pipe",
    });

    if (smokeResult.status !== 0) {
      const output = [smokeResult.stdout, smokeResult.stderr]
        .filter(Boolean)
        .join("\n")
        .trim();
      throw new Error(output || "Node import smoke test failed.");
    }

    process.stdout.write(smokeResult.stdout);
  } finally {
    await unlink(tarballPath).catch(() => {});
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
