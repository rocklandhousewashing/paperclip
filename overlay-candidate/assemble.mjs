import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.dirname(artifactDir);
const installedRoot = "/home/ubuntu/paperclip/lib/node_modules";
const priorArtifact = "/home/ubuntu/jarvis-system/release-artifacts/paperclip-worktree-repair";
const verifier = "/home/ubuntu/jarvis-system/scripts/paperclip-package-overlay.js";
const parent = "2828f1a0507d5ba8e05287fa0693c81a676313c8";
const child = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(child ?? "")) throw new Error("Pass the exact committed source child SHA.");
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
git("merge-base", "--is-ancestor", parent, child);
const modules = JSON.parse(fs.readFileSync(path.join(artifactDir, "modules.json"), "utf8"));
if (git("diff", child, "--", ...modules.map((entry) => entry.source))) {
  throw new Error("Runtime sources differ from the declared source child.");
}
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const suffixes = [".js", ".js.map", ".d.ts", ".d.ts.map"];
const entries = [];
let diffs = "";
for (const module of modules) {
  for (const suffix of suffixes) {
    const relative = module.prefix + suffix;
    const source = path.join(repo, module.output + suffix);
    const before = path.join(installedRoot, relative);
    const target = path.join(artifactDir, "tree", relative);
    const bytes = fs.readFileSync(source);
    const installed = fs.readFileSync(before);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes, { mode: 0o644 });
    fs.chmodSync(target, 0o644);
    entries.push({ path: relative, sha256: sha(bytes), installed_sha256: sha(installed), bytes: bytes.length, mode: "0644", changed: !bytes.equals(installed) });
    if (suffix === ".js" || suffix === ".d.ts") {
      const diff = spawnSync("diff", ["-u", "--label", `installed/${relative}`, "--label", `candidate/${relative}`, before, target], { encoding: "utf8" });
      if (diff.status !== 0 && diff.status !== 1) throw new Error(diff.stderr);
      diffs += diff.stdout;
    }
  }
}
const verifierText = fs.readFileSync(verifier, "utf8");
const existingPrefixes = JSON.parse(verifierText.match(/const ENTRY_PREFIXES = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));
const packages = [...new Set(modules.map(({ prefix }) => prefix.split("/").slice(0, 2).join("/")))].sort();
const manifest = {
  schema_version: 1,
  purpose: "PC-457 r2 review candidate; not a deployable manifest for the existing fixed-closure verifier",
  source_parent_sha: parent,
  source_child_sha: child,
  pnpm_lock_sha256: sha(fs.readFileSync(path.join(repo, "pnpm-lock.yaml"))),
  toolchain: { node: process.version, node_sha256: sha(fs.readFileSync(process.execPath)), pnpm: execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim(), typescript: JSON.parse(fs.readFileSync(path.join(repo, "node_modules/typescript/package.json"))).version },
  existing_overlay_manifest_sha256: sha(fs.readFileSync(path.join(priorArtifact, "manifest.json"))),
  existing_overlay_verifier_sha256: sha(Buffer.from(verifierText)),
  modules,
  entry_prefix_additions: modules.map(({ prefix }) => prefix).filter((prefix) => !existingPrefixes.includes(prefix)).sort(),
  entries: entries.sort((a, b) => a.path.localeCompare(b.path)),
  package_anchors: packages.map((pkg) => {
    const relative = pkg + "/package.json";
    const bytes = fs.readFileSync(path.join(installedRoot, relative));
    return { path: relative, sha256: sha(bytes), version: JSON.parse(bytes).version };
  }),
};
fs.writeFileSync(path.join(artifactDir, "manifest-draft.json"), JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(path.join(artifactDir, "installed-runtime.diff"), diffs);
console.log(JSON.stringify({ modules: modules.length, files: entries.length, newPrefixes: manifest.entry_prefix_additions.length, sourceChild: child }));
