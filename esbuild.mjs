import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  target: "esnext",
  plugins: [nodeExternalsPlugin()],
});

esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.cjs.js",
  bundle: true,
  format: "cjs",
  target: "esnext",
  plugins: [nodeExternalsPlugin()],
});
