import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const demoEmail = process.env.SUPER_ADMIN_EMAIL || "el@mail.com";
const demoPassword = process.env.SUPER_ADMIN_PW || "11223344";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  console.log("Logging in as:", demoEmail);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  if (authError) {
    console.error("Auth failed:", authError.message);
    return;
  }

  const session = authData.session;
  console.log("Login successful! User ID:", authData.user.id);

  // Fetch workspaces for this user
  const { data: workspaces, error: wsError } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(name)")
    .eq("user_id", authData.user.id)
    .eq("status", "active");

  if (wsError || !workspaces || workspaces.length === 0) {
    console.error("Failed to fetch workspaces or none found:", wsError?.message);
    return;
  }

  const workspaceId = workspaces[0].workspace_id;
  const workspaceName = workspaces[0].workspaces.name;
  console.log(`Using Workspace: ${workspaceName} (${workspaceId})`);

  // Construct cookies
  // Next.js Supabase SSR client expects cookie format e.g. sb-ixzaxpzcbdqzwwcbqarh-auth-token
  const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)[1];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = JSON.stringify(session);
  const cookieHeader = `${cookieName}=${encodeURIComponent(cookieValue)}`;

  console.log("Calling POST /api/ai/daily-focus...");
  try {
    const response = await fetch("http://localhost:3000/api/ai/daily-focus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
      body: JSON.stringify({
        workspaceId,
        limit: 3,
        forceRegenerate: true,
      }),
    });

    console.log("Response Status:", response.status);
    const data = await response.json();
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Request failed:", err);
  }
}

run();
