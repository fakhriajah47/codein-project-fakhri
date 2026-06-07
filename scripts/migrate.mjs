import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

function loadLocalEnv() {
  const envFiles = [".env", ".env.local"];
  let loaded = false;
  
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      loaded = true;
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

  if (!loaded) {
    console.log("No .env or .env.local file found. Please create one based on .env.example.");
  }
}

async function runMigrations() {
  loadLocalEnv();

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error("=============================================================");
    console.error("ERROR: DATABASE_URL or SUPABASE_DB_URL is not defined.");
    console.error("=============================================================");
    console.error("Please add your Supabase connection string to .env.local:");
    console.error("DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres?sslmode=require");
    console.error("\nYou can find this in your Supabase Dashboard:");
    console.error("Project Settings -> Database -> Connection string -> URI");
    console.error("=============================================================");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes("supabase.co") || connectionString.includes("supabase.com")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected successfully.");

    const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      console.log(`\nExecuting migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      // We run the SQL file content.
      // Note: multiple SQL statements can be run in a single client.query call in pg.
      await client.query(sql);
      console.log(`Finished executing ${file}.`);
    }

    console.log("\n=============================================================");
    console.log("SUCCESS: All migrations have been applied successfully!");
    console.log("=============================================================");
  } catch (err) {
    console.error("\n=============================================================");
    console.error("ERROR running migrations:", err.message);
    console.error("=============================================================");
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
