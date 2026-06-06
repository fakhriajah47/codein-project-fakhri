import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

loadLocalEnv();

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const demoEmail = process.env.DEMO_EMAIL || "demo@projectmanagement.ai";
const demoPassword = process.env.DEMO_PASSWORD || "DemoPassword123";
const demoName = process.env.DEMO_FULL_NAME || "Fakhri Rimbawan";

async function getOrCreateDemoUser() {
  const { data: userPage, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = userPage.users.find((user) => user.email === demoEmail);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email: demoEmail,
    password: demoPassword,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function upsertIntegration(workspaceId, userId, provider, config) {
  if (!Object.keys(config).length) return;

  const { error } = await supabase.from("integration_settings").upsert(
    {
      workspace_id: workspaceId,
      provider,
      config,
      is_enabled: true,
      created_by: userId,
    },
    { onConflict: "workspace_id,provider" }
  );
  if (error) throw error;
}

async function runSeed() {
  const userId = await getOrCreateDemoUser();

  await supabase.from("profiles").upsert(
    {
      user_id: userId,
      full_name: demoName,
      job_title: "Project Owner",
      timezone: "Asia/Jakarta",
    },
    { onConflict: "user_id" }
  );

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .upsert(
      {
        name: "Sohibdigi Studio",
        slug: "sohibdigi-studio",
        description: "Workspace demo untuk project digital agency",
        owner_id: userId,
      },
      { onConflict: "slug" }
    )
    .select()
    .single();
  if (workspaceError) throw workspaceError;

  await supabase.from("workspace_members").upsert(
    {
      workspace_id: workspace.id,
      user_id: userId,
      role: "owner",
      status: "active",
      joined_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,user_id" }
  );

  await upsertIntegration(workspace.id, userId, "discord", {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL_DEFAULT,
  });
  await upsertIntegration(workspace.id, userId, "telegram", {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_DEFAULT_CHAT_ID,
  });
  await upsertIntegration(workspace.id, userId, "gmail", {
    connectedEmail: process.env.SMTP_USER || process.env.GMAIL_CONNECTED_EMAIL || demoEmail,
  });

  const projects = [
    {
      name: "Website Company Profile PT Maju Digital",
      slug: "website-company-profile-pt-maju-digital",
      description: "Pembuatan website company profile modern untuk client.",
      client_name: "PT Maju Digital",
      project_type: "Website Development",
      status: "active",
      priority: "high",
      start_date: "2026-06-10",
      due_date: "2026-07-01",
      progress: 62,
      health_status: "at_risk",
      risk_score: 64,
    },
    {
      name: "Landing Page Campaign Travel Umroh",
      slug: "landing-page-campaign-travel-umroh",
      description: "Campaign landing page untuk lead generation travel umroh.",
      client_name: "Nusantara Travel",
      project_type: "Landing Page",
      status: "active",
      priority: "medium",
      start_date: "2026-06-15",
      due_date: "2026-08-30",
      progress: 22,
      health_status: "healthy",
      risk_score: 15,
    },
    {
      name: "Internal Dashboard Finance Tracker",
      slug: "internal-dashboard-finance-tracker",
      description: "Dashboard internal untuk monitoring finance operations.",
      client_name: "Internal",
      project_type: "Web Application",
      status: "active",
      priority: "urgent",
      start_date: "2026-05-01",
      due_date: "2026-06-15",
      progress: 10,
      health_status: "critical",
      risk_score: 85,
    },
  ];

  const seededProjects = [];
  for (const project of projects) {
    const { data, error } = await supabase
      .from("projects")
      .upsert(
        {
          ...project,
          workspace_id: workspace.id,
          created_by: userId,
        },
        { onConflict: "workspace_id,slug" }
      )
      .select()
      .single();
    if (error) throw error;
    seededProjects.push(data);
  }

  const mainProject = seededProjects[0];
  await supabase.from("tasks").delete().eq("project_id", mainProject.id);
  await supabase.from("milestones").delete().eq("project_id", mainProject.id);

  const milestoneRows = [
    ["Planning & Design", "Requirement, sitemap, and UI design.", "completed", "2026-06-15", 100],
    ["Frontend & Integration", "Next.js implementation and backend integration.", "in_progress", "2026-06-25", 62],
    ["QA & Launch", "Testing, deployment, and final client review.", "not_started", "2026-07-01", 0],
  ];

  const milestones = [];
  for (const [title, description, status, dueDate, progress] of milestoneRows) {
    const { data, error } = await supabase
      .from("milestones")
      .insert({
        project_id: mainProject.id,
        title,
        description,
        status,
        due_date: dueDate,
        progress,
      })
      .select()
      .single();
    if (error) throw error;
    milestones.push(data);
  }

  const tasks = [
    ["Create sitemap", "done", "high", "2026-06-11", milestones[0].id],
    ["Design homepage wireframe", "done", "high", "2026-06-12", milestones[0].id],
    ["Approve visual direction", "done", "urgent", "2026-06-15", milestones[0].id],
    ["Build hero section", "done", "medium", "2026-06-19", milestones[1].id],
    ["Build service section", "done", "medium", "2026-06-20", milestones[1].id],
    ["Integrate contact form", "in_progress", "high", "2026-06-01", milestones[1].id],
    ["Build portfolio section", "todo", "high", "2026-06-03", milestones[1].id],
    ["Configure notification webhook", "blocked", "urgent", "2026-06-24", milestones[1].id],
    ["QA responsive mobile", "todo", "urgent", "2026-06-28", milestones[2].id],
    ["Deploy to Vercel", "todo", "urgent", "2026-07-01", milestones[2].id],
  ];

  for (const [title, status, priority, dueDate, milestoneId] of tasks) {
    await supabase.from("tasks").insert({
      workspace_id: workspace.id,
      project_id: mainProject.id,
      milestone_id: milestoneId,
      title,
      description: `${title} for ${mainProject.name}.`,
      status,
      priority,
      assignee_id: userId,
      reporter_id: userId,
      due_date: dueDate,
      acceptance_criteria: ["Output meets approved scope", "Reviewed by project lead"],
      ai_generated: false,
      completed_at: status === "done" ? new Date().toISOString() : null,
    });
  }

  await supabase.from("project_members").upsert(
    {
      project_id: mainProject.id,
      user_id: userId,
      role: "lead",
    },
    { onConflict: "project_id,user_id" }
  );

  await supabase.from("activity_logs").insert([
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      actor_id: userId,
      action: "project.created",
      entity_type: "project",
      entity_id: mainProject.id,
      metadata: { projectName: mainProject.name },
    },
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      actor_id: userId,
      action: "ai.risk_generated",
      entity_type: "project",
      entity_id: mainProject.id,
      metadata: { riskScore: 64, riskLevel: "medium" },
    },
  ]);

  await supabase.from("reports").insert({
    workspace_id: workspace.id,
    project_id: mainProject.id,
    created_by: userId,
    title: "Executive Summary - Website Company Profile PT Maju Digital",
    type: "executive",
    target_audience: "ceo",
    content: {
      progress: 62,
      summary: "Project berjalan cukup baik, tetapi QA dan deployment perlu diprioritaskan.",
      completedWork: ["Sitemap selesai", "UI direction approved", "Hero section selesai"],
      pendingWork: ["Contact form integration", "QA responsive mobile", "Deployment Vercel"],
      risks: ["Deadline semakin dekat", "Webhook integration masih blocked"],
      nextActions: ["Assign owner untuk deployment", "Prioritaskan QA mobile"],
    },
    status: "draft",
  });

  console.log(`Demo seed ready. Login with ${demoEmail} / ${demoPassword}`);
}

runSeed().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});
