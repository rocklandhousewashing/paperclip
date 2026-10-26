const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "co593-bwrap-check-"));
const provider = path.join(root, "provider");
const skills = path.join(provider, "skills");
const skillFile = path.join(skills, "SKILL.md");
fs.mkdirSync(skills, { recursive: true });
fs.writeFileSync(skillFile, "safe");
try {
  const child = spawnSync("bwrap", [
    "--ro-bind", "/", "/",
    "--bind", provider, provider,
    "--ro-bind", skills, skills,
    "--", process.execPath, "-e",
    `const fs=require("node:fs");const file=process.argv[1];const read=fs.readFileSync(file,"utf8")==="safe";let writeCode="none";try{fs.appendFileSync(file,"bad")}catch(error){writeCode=error.code}console.log(JSON.stringify({read,writeCode}));if(!read||writeCode!=="EROFS")process.exit(1)`,
    skillFile,
  ], { encoding: "utf8" });
  process.stdout.write(child.stdout);
  process.stderr.write(child.stderr);
  if (child.status !== 0) process.exitCode = child.status ?? 1;
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
