import pg from "pg";
import fs from "node:fs";
import path from "node:path";

function loadLocalEnv() {
  const envFiles = [".env", ".env.local"];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (!match) continue;
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadLocalEnv();

const connectionString = process.env.DATABASE_URL;
const { Client } = pg;
const client = new Client({
  connectionString,
});

async function run() {
  await client.connect();
  console.log("Connected.");

  const res = await client.query(`
    select pg_get_functiondef(p.oid) as def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'uid' and n.nspname = 'auth';
  `);
  console.log(res.rows[0]?.def);

  await client.end();
}

run().catch(console.error);
