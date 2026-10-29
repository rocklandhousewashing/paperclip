#!/usr/bin/env node
// Build-only October 2026 port packaging. Consumes already-built artifacts;
// never installs a runtime, publishes, starts a service, or changes source manifests.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { materializePublishManifest, prepareBundledPackage } from "./prepare-bundled-package.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [outputArgument, provenanceArgument, ...extra] = process.argv.slice(2);
if (!outputArgument || !provenanceArgument || extra.length) {
  throw new Error("Usage: node scripts/pack-port-artifacts.mjs <new-output-directory> <native-provenance.json>");
}
const output = resolve(outputArgument);
const fromRoot = relative(root, output);
if (!fromRoot || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot)) || existsSync(output)) {
  throw new Error("Output must be a new directory outside the source worktree");
}
const native = JSON.parse(readFileSync(resolve(provenanceArgument), "utf8"));
if (native.status !== "NOT-YET" || native.nativeSourceBuild !== false || native.archiveBinaryMatches !== true) {
  throw new Error("This provisional pack requires verified npm native-binary reuse provenance");
}
const nativePath = resolve(root, "server/dist/vendor/paperclip-runner/bin/paperclip-runnerd");
const hash = (bytes, algorithm = "sha256") => createHash(algorithm).update(bytes).digest("hex");
if (hash(readFileSync(nativePath)) !== native.sha256) throw new Error("Native artifact digest mismatch");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
if (git("status", "--porcelain")) throw new Error("Commit source changes before packaging");
const head = git("rev-parse", "HEAD");
if (JSON.parse(readFileSync(resolve(root, "server/dist/build-info.json"), "utf8")).commit !== head) {
  throw new Error("Server build stamp must match the clean source head");
}
const version = "2026.1023.0-jarvis.port.1";
const stage = resolve(output, "stage");
const dist = resolve(output, "dist");
mkdirSync(dist, { recursive: true });
mkdirSync(resolve(stage, "scripts"), { recursive: true });
const json = path => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const run = (program, args, cwd = root) => execFileSync(program, args, {
  cwd, stdio: "inherit",
  env: { ...process.env, npm_config_registry: "https://registry.npmjs.org/", npm_config_ignore_scripts: "true" },
});
const packages = json(resolve(root, "scripts/release-package-manifest.json")).filter(p => p.publishFromCi);
for (const script of ["generate-ui-package-json.mjs", "generate-plugin-package-json.mjs"]) {
  cpSync(resolve(root, "scripts", script), resolve(stage, "scripts", script));
}
// The release flow versions every public workspace together. Do that only in
// this private staging tree; source package.json files remain untouched.
for (const entry of packages) {
  const source = resolve(root, entry.dir);
  const target = resolve(stage, entry.dir);
  mkdirSync(target, { recursive: true });
  const pkg = json(resolve(source, "package.json"));
  pkg.version = version;
  writeJson(resolve(target, "package.json"), pkg);
  for (const path of new Set([...(pkg.files ?? ["dist"]), "README.md", "LICENSE", "LICENSE.md"])) {
    if (existsSync(resolve(source, path))) cpSync(resolve(source, path), resolve(target, path), { recursive: true });
  }
}
for (const dir of ["server", "packages/adapters/claude-local", "packages/adapters/codex-local"]) {
  cpSync(resolve(root, "skills"), resolve(stage, dir, "skills"), { recursive: true });
}
run(process.execPath, ["scripts/generate-npm-package-json.mjs", "--output", resolve(stage, "cli/package.json")]);
const cli = json(resolve(stage, "cli/package.json"));
cli.version = version;
cli.dependencies["@paperclipai/server"] = version;
writeJson(resolve(stage, "cli/package.json"), cli);
run(process.execPath, ["scripts/prepare-npm-readme.mjs", resolve(root, "README.md"), resolve(stage, "cli/README.md"), head]);
run(process.execPath, [resolve(stage, "scripts/generate-ui-package-json.mjs")]);
for (const entry of packages) {
  const original = json(resolve(root, entry.dir, "package.json"));
  if (original.scripts?.prepack?.includes("generate-plugin-package-json.mjs")) {
    run(process.execPath, [resolve(stage, "scripts/generate-plugin-package-json.mjs")], resolve(stage, entry.dir));
  }
  const path = resolve(stage, entry.dir, "package.json");
  writeJson(path, materializePublishManifest(json(path)));
}
const provenance = { status: "NOT-YET", version, sourceHead: head, native, packages: [] };
// Put the limitation beside the executable as well as beside the tarballs.
writeJson(resolve(stage, "server/dist/port-provenance.json"), { status: provenance.status, sourceHead: head, native });
for (const entry of packages) {
  let directory = resolve(stage, entry.dir);
  const manifest = json(resolve(directory, "package.json"));
  if ((manifest.bundleDependencies ?? manifest.bundledDependencies ?? []).length) {
    const bundled = resolve(output, "bundled", entry.name.replaceAll("/", "-"));
    prepareBundledPackage(directory, bundled, { sourceRoot: root });
    directory = bundled;
  }
  console.log(`Packing ${entry.name}@${version}`);
  const receipt = JSON.parse(execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", dist], {
    cwd: directory, encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, npm_config_registry: "https://registry.npmjs.org/", npm_config_ignore_scripts: "true" },
  }))[0];
  const archive = readFileSync(resolve(dist, receipt.filename));
  provenance.packages.push({ name: entry.name, version, filename: receipt.filename,
    size: archive.length, sha256: hash(archive), integrity: receipt.integrity,
    fileCount: receipt.entryCount, unpackedSize: receipt.unpackedSize });
  writeJson(resolve(dist, "MANIFEST.json"), provenance);
}
writeFileSync(resolve(dist, "README.md"), "Provisional build-only Paperclip port artifacts. NOT-YET.\nNative executable reused from the verified target npm package; Rust source was not rebuilt.\nNo installation or publication has been authorized by this artifact. See MANIFEST.json.\n");
console.log(`Packed ${provenance.packages.length} provisional artifacts at ${dist}`);
