import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { resolveManagedGitWorktreeSandboxMetadata, type RealizedExecutionWorkspace } from "../services/workspace-runtime.js";
import { resolveManagedGitWorktreeSandboxPaths } from "@paperclipai/adapter-utils/local-process-sandbox";

const run = promisify(execFile);
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

async function fixture(): Promise<RealizedExecutionWorkspace> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-server-git-sandbox-"));
  roots.push(root);
  const baseCwd = path.join(root, "base");
  const cwd = path.join(root, "worktree");
  await fs.mkdir(baseCwd);
  const git = (args: string[]) => run("git", args, { cwd: baseCwd });
  await git(["init", "-b", "main"]);
  await git(["-c", "user.name=Paperclip Test", "-c", "user.email=test@paperclip.invalid", "commit", "--allow-empty", "-m", "base"]);
  await git(["worktree", "add", "-b", "sandbox-test", cwd]);
  return { baseCwd, cwd, worktreePath: cwd, strategy: "git_worktree", source: "project_primary",
    projectId: null, workspaceId: null, repoUrl: null, repoRef: null, branchName: "sandbox-test",
    warnings: [], created: true, branchCreatedByRuntime: true };
}

describe("managed Git worktree sandbox metadata", () => {
  it("validates registered server metadata through the adapter mount boundary", async () => {
    const workspace = await fixture();
    const metadata = await resolveManagedGitWorktreeSandboxMetadata(workspace);
    expect(metadata).toMatchObject({ version: 1, worktreePath: await fs.realpath(workspace.cwd),
      commonDir: await fs.realpath(path.join(workspace.baseCwd, ".git")) });
    expect(metadata!.gitDir.startsWith(path.join(metadata!.commonDir, "worktrees") + path.sep)).toBe(true);
    await expect(resolveManagedGitWorktreeSandboxPaths({ ...workspace, managedGitWorktree: metadata }, workspace.cwd))
      .resolves.toEqual([{ path: metadata!.commonDir, access: "rw" }]);
  });

  it("adds no administration metadata for an ordinary project workspace", async () => {
    const workspace = await fixture();
    await expect(resolveManagedGitWorktreeSandboxMetadata({ ...workspace, strategy: "project_primary" })).resolves.toBeNull();
  });

  it("rejects a cwd differing from the recorded managed workspace", async () => {
    const workspace = await fixture();
    await expect(resolveManagedGitWorktreeSandboxMetadata({ ...workspace, cwd: workspace.baseCwd }))
      .rejects.toMatchObject({ code: "workspace_validation_failed", resultJson: {
        workspaceValidation: { reason: "git_worktree_sandbox_cwd_mismatch" } } });
  });

  it("rejects a worktree belonging to another base repository", async () => {
    const workspace = await fixture();
    const other = await fixture();
    await expect(resolveManagedGitWorktreeSandboxMetadata({ ...workspace, baseCwd: other.baseCwd }))
      .rejects.toMatchObject({ code: "workspace_validation_failed", resultJson: {
        workspaceValidation: { reason: "git_worktree_sandbox_not_registered" } } });
  });
});
