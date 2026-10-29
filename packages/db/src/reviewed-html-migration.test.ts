import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyPendingMigrations, inspectMigrations } from "./client.js";
import { checkMigrationNumbering, ensureNoDuplicates } from "./check-migration-numbering.js";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "./test-embedded-postgres.js";

const migration = (name: string) => readFile(new URL(`./migrations/${name}`, import.meta.url), "utf8");
const hash = (content: string) => createHash("sha256").update(content).digest("hex");

describe("retained reviewed HTML migration policy", () => {
  it("pins both historical SQL files and the original custom journal entry", async () => {
    await expect(checkMigrationNumbering()).resolves.toBeUndefined();
  });
  it("permits only the exact shipped 0280 pair, never other collisions or duplicates", () => {
    expect(() => ensureNoDuplicates(["0280_quick_phalanx", "0280_unique_genesis"], "fixture")).not.toThrow();
    for (const values of [
      ["0280_quick_phalanx", "0280_quick_phalanx"],
      ["0280_quick_phalanx", "0280_new_collision"],
      ["0280_quick_phalanx", "0280_unique_genesis", "0280_unique_genesis"],
      ["0334_one", "0334_two"],
    ]) expect(() => ensureNoDuplicates(values, "fixture")).toThrow("Duplicate migration number");
  });
});

const support = await getEmbeddedPostgresTestSupport();
const describePostgres = support.supported ? describe : describe.skip;
describePostgres("reviewed HTML migration compatibility", () => {
  let fixture: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>>;
  let sql: ReturnType<typeof postgres>;
  beforeAll(async () => {
    fixture = await startEmbeddedPostgresTestDatabase("paperclip-review-migration-");
    sql = postgres(fixture.connectionString, { max: 1, onnotice: () => {} });
  }, 90_000);
  afterAll(async () => { await sql?.end(); await fixture?.cleanup(); });

  it("bootstraps both 0280 migrations and validates the fresh schema", async () => {
    expect((await inspectMigrations(fixture.connectionString)).status).toBe("upToDate");
    const rows = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='agents' AND column_name='appearance'`;
    expect(rows).toHaveLength(1);
    expect(await sql`SELECT * FROM issue_reviewed_html_reviews`).toHaveLength(0);
  });

  it("retains installed history and review data while applying all missing upstream migrations", async () => {
    // The fixture owns this disposable database. Rebuild only its public schema
    // and migration journal as an installed-fork-shaped pre-upgrade database.
    await sql.unsafe('DROP SCHEMA public CASCADE');
    await sql.unsafe('CREATE SCHEMA public');
    await sql.unsafe('DROP SCHEMA drizzle CASCADE');
    const journal = JSON.parse(await migration("meta/_journal.json"));
    const entries = journal.entries.filter((entry: { idx: number; tag: string }) => entry.idx < 280 || entry.tag === "0280_quick_phalanx");
    const directory = await mkdtemp(join(tmpdir(), "review-history-fixture-"));
    try {
      await mkdir(join(directory, "meta"));
      await writeFile(join(directory, "meta/_journal.json"), JSON.stringify({ ...journal, entries }));
      for (const entry of entries) await writeFile(join(directory, `${entry.tag}.sql`), await migration(`${entry.tag}.sql`));
      await migrate(drizzle(sql), { migrationsFolder: directory });
    } finally { await rm(directory, { recursive: true, force: true }); }
    await sql`INSERT INTO companies (id,name,issue_prefix) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional migration test','FIX')`;
    await sql`INSERT INTO issues (id,company_id,title,status,priority) VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fixture','todo','medium')`;
    await sql`INSERT INTO issue_reviewed_html_reviews (company_id,issue_id,review_version,html_attachment_id,files,total_bytes,reviewed_by_user_id)
      VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',1,'cccccccc-cccc-4ccc-8ccc-cccccccccccc','{"fixture":true}',9,'fictional-owner')`;
    const history = await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY id`;
    const reviews = await sql`SELECT * FROM issue_reviewed_html_reviews`;
    const before = await inspectMigrations(fixture.connectionString);
    expect(before.status).toBe("needsMigrations");
    if (before.status !== "needsMigrations") throw new Error("Missing upgrade migrations");
    for (let number = 280; number <= 287; number++) {
      expect(before.pendingMigrations.some((name) => name.startsWith(`0${number}_`))).toBe(true);
    }
    expect(before.pendingMigrations).not.toContain("0280_quick_phalanx.sql");
    await applyPendingMigrations(fixture.connectionString);
    expect((await inspectMigrations(fixture.connectionString)).status).toBe("upToDate");
    expect(await sql`SELECT * FROM issue_reviewed_html_reviews`).toEqual(reviews);
    const after = await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY id`;
    expect(after.slice(0, history.length)).toEqual(history);
    await applyPendingMigrations(fixture.connectionString);
    expect(await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY id`).toEqual(after);
  }, 90_000);

  it("fails closed on registry drift without recording validation or changing review bytes", async () => {
    const validation = await migration("0334_validate_reviewed_html_registry.sql");
    await sql`DELETE FROM drizzle.__drizzle_migrations WHERE hash=${hash(validation)}`;
    await sql.unsafe('DROP INDEX issue_reviewed_html_reviews_active_uq');
    const before = await sql`SELECT * FROM issue_reviewed_html_reviews`;
    await expect(applyPendingMigrations(fixture.connectionString)).rejects.toThrow("indexes differ");
    expect(await sql`SELECT * FROM drizzle.__drizzle_migrations WHERE hash=${hash(validation)}`).toHaveLength(0);
    expect(await sql`SELECT * FROM issue_reviewed_html_reviews`).toEqual(before);
  });
});
