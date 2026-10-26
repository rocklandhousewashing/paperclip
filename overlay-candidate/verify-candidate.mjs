// Run with Node 24: node --experimental-import-meta-resolve overlay-candidate/verify-candidate.mjs
// Static verification only: never imports or executes installed Paperclip modules.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const live = "/home/ubuntu/paperclip/lib/node_modules";
const manifest = JSON.parse(fs.readFileSync(path.join(artifactDir, "manifest-draft.json"), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function inventory(root, relative = "") {
  return fs.readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected artifact symlink: ${child}`);
    if (entry.isDirectory()) return inventory(root, child);
    if (!entry.isFile()) throw new Error(`Unexpected artifact entry: ${child}`);
    return [child];
  });
}
if (JSON.stringify(inventory(path.join(artifactDir, "tree")).sort()) !== JSON.stringify(manifest.entries.map((entry) => entry.path).sort())) {
  throw new Error("Artifact inventory does not exactly match manifest entries.");
}
const candidateByLive = new Map(manifest.entries.map(({ path: relative }) => [path.join(live, relative), path.join(artifactDir, "tree", relative)]));
const { parse: parseJs } = createRequire(path.join(artifactDir, "../server/package.json"))("acorn");
const parse = (filename) => parseJs(fs.readFileSync(filename, "utf8"), { ecmaVersion: "latest", sourceType: "module" });
const readTarget = (filename) => candidateByLive.get(filename) ?? filename;
const importEdges = [];
const newBindings = [];
const declarations = [];
const sourceMaps = [];
function imports(filename) {
  return parse(filename).body.filter((node) => node.type === "ImportDeclaration").map((node) => ({
    specifier: node.source.value,
    names: node.specifiers.filter((item) => item.type === "ImportSpecifier").map((item) => item.imported.name),
  }));
}
function exportNames(filename, seen = new Set()) {
  if (seen.has(filename)) return new Set();
  seen.add(filename);
  if (filename.endsWith(".d.ts")) {
    return new Set([...fs.readFileSync(readTarget(filename), "utf8").matchAll(/export\s+(?:declare\s+)?(?:function|const|class|interface|type)\s+(\w+)/g)].map((match) => match[1]));
  }
  const names = new Set();
  for (const node of parse(readTarget(filename)).body) {
    if (node.type === "ExportNamedDeclaration") {
      for (const entry of node.specifiers) names.add(entry.exported.name);
      if (node.declaration?.id) names.add(node.declaration.id.name);
      for (const entry of node.declaration?.declarations ?? []) if (entry.id.type === "Identifier") names.add(entry.id.name);
    } else if (node.type === "ExportDefaultDeclaration") names.add("default");
    else if (node.type === "ExportAllDeclaration") {
      const target = fileURLToPath(import.meta.resolve(node.source.value, pathToFileURL(filename).href));
      for (const name of exportNames(target, seen)) names.add(name);
    }
  }
  return names;
}
for (const entry of manifest.entries) {
  const filename = path.join(artifactDir, "tree", entry.path);
  const installed = path.join(live, entry.path);
  if (hash(fs.readFileSync(filename)) !== entry.sha256) throw new Error(`Candidate hash drift: ${entry.path}`);
  if (hash(fs.readFileSync(installed)) !== entry.installed_sha256) throw new Error(`Installed hash drift: ${entry.path}`);
  if ((fs.statSync(filename).mode & 0o777) !== 0o644) throw new Error(`Candidate mode mismatch: ${entry.path}`);
  if (entry.path.endsWith(".map")) {
    const before = JSON.parse(fs.readFileSync(installed, "utf8"));
    const after = JSON.parse(fs.readFileSync(filename, "utf8"));
    const changedKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
    if (changedKeys.some((key) => key !== "mappings")) {
      throw new Error(`Unexpected source map change: ${entry.path}: ${changedKeys}`);
    }
    sourceMaps.push({ path: entry.path, changedKeys });
  }
  if (entry.path.endsWith(".js")) {
    execFileSync(process.execPath, ["--check", filename], { stdio: "pipe" });
    const oldImports = imports(installed);
    for (const item of imports(filename)) {
      const resolved = import.meta.resolve(item.specifier, pathToFileURL(installed).href);
      if (resolved.startsWith("node:")) continue;
      const target = fileURLToPath(resolved);
      if (!fs.statSync(readTarget(target)).isFile()) throw new Error(`Missing import: ${entry.path}: ${item.specifier}`);
      importEdges.push({ from: entry.path, specifier: item.specifier, resolved: target, candidate: candidateByLive.has(target) });
      const previousNames = oldImports.filter((prior) => prior.specifier === item.specifier).flatMap((prior) => prior.names);
      for (const name of item.names.filter((name) => !previousNames.includes(name))) {
        if (!exportNames(target).has(name)) throw new Error(`Missing new export ${name} in ${target}`);
        newBindings.push({ from: entry.path, specifier: item.specifier, name });
      }
    }
  }
  if (entry.path.endsWith(".d.ts")) {
    // Read the installed declaration without selecting its candidate counterpart.
    candidateByLive.delete(installed);
    const before = exportNames(installed);
    candidateByLive.set(installed, filename);
    const after = exportNames(installed);
    const removed = [...before].filter((name) => !after.has(name));
    if (removed.length) throw new Error(`Removed exports: ${entry.path}: ${removed}`);
    declarations.push({ path: entry.path, byteIdentical: !entry.changed, addedExports: [...after].filter((name) => !before.has(name)), removedExports: removed });
  }
}
for (const anchor of manifest.package_anchors) {
  if (hash(fs.readFileSync(path.join(live, anchor.path))) !== anchor.sha256) throw new Error(`Package anchor drift: ${anchor.path}`);
}
const report = { status: "pass", sourceChild: manifest.source_child_sha, files: manifest.entries.length, syntaxCheckedModules: manifest.modules.length, resolvedImports: importEdges.length, newBindings, declarations, sourceMaps, importEdges };
fs.writeFileSync(path.join(artifactDir, "compatibility-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ status: report.status, files: report.files, modules: report.syntaxCheckedModules, resolvedImports: report.resolvedImports, newBindings: newBindings.length }));
