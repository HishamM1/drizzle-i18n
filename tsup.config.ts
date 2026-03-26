import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    pg: "src/pg.ts",
    mysql: "src/mysql.ts",
    sqlite: "src/sqlite.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["drizzle-orm"],
});
