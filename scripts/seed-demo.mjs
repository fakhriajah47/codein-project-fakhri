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

const demoEmail = process.env.SUPER_ADMIN_EMAIL || process.env.DEMO_EMAIL || "el@mail.com";
const demoPassword = process.env.SUPER_ADMIN_PW || process.env.DEMO_PASSWORD || "11223344";
const demoName = process.env.DEMO_FULL_NAME || "Fakhri Rimbawan";
const demoUsers = [
  {
    email: demoEmail,
    password: demoPassword,
    fullName: demoName,
    jobTitle: "Project Owner",
    role: "owner",
  },
  {
    email: process.env.DEMO_MANAGER_EMAIL || "manager@projectpilot.ai",
    password: process.env.DEMO_MANAGER_PASSWORD || "DemoPassword123",
    fullName: "Alya Prameswari",
    jobTitle: "Project Manager",
    role: "manager",
  },
  {
    email: process.env.DEMO_MEMBER_EMAIL || "developer@projectpilot.ai",
    password: process.env.DEMO_MEMBER_PASSWORD || "DemoPassword123",
    fullName: "Rafi Maulana",
    jobTitle: "Frontend Developer",
    role: "member",
  },
  {
    email: process.env.DEMO_DESIGNER_EMAIL || "designer@projectpilot.ai",
    password: process.env.DEMO_DESIGNER_PASSWORD || "DemoPassword123",
    fullName: "Nadia Kirana",
    jobTitle: "UI Designer",
    role: "member",
  },
  {
    email: process.env.DEMO_VIEWER_EMAIL || "client@projectpilot.ai",
    password: process.env.DEMO_VIEWER_PASSWORD || "DemoPassword123",
    fullName: "Bima Santoso",
    jobTitle: "Client Stakeholder",
    role: "viewer",
  },
];

async function getOrCreateDemoUser(email = demoEmail, password = demoPassword) {
  const { data: userPage, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = userPage.users.find((user) => user.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function upsertIntegration(workspaceId, userId, provider, config) {
  const cleanedConfig = Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  const isReady =
    provider === "discord"
      ? Boolean(cleanedConfig.webhookUrl)
      : provider === "telegram"
        ? Boolean(cleanedConfig.botToken && cleanedConfig.chatId)
        : provider === "gmail"
          ? Boolean(cleanedConfig.connectedEmail)
          : Object.keys(cleanedConfig).length > 0;

  const { error } = await supabase.from("integration_settings").upsert(
    {
      workspace_id: workspaceId,
      provider,
      config: cleanedConfig,
      is_enabled: isReady,
      created_by: userId,
    },
    { onConflict: "workspace_id,provider" }
  );
  if (error) throw error;
}

async function runSeed() {
  const seededUsers = [];
  for (const demoUser of demoUsers) {
    const userId = await getOrCreateDemoUser(demoUser.email, demoUser.password);
    seededUsers.push({ ...demoUser, id: userId });

    await supabase.from("profiles").upsert(
      {
        user_id: userId,
        full_name: demoUser.fullName,
        job_title: demoUser.jobTitle,
        timezone: "Asia/Jakarta",
      },
      { onConflict: "user_id" }
    );
  }

  const owner = seededUsers.find((user) => user.role === "owner");
  const manager = seededUsers.find((user) => user.role === "manager");
  const developer = seededUsers.find((user) => user.email.includes("developer"));
  const designer = seededUsers.find((user) => user.email.includes("designer"));
  const viewer = seededUsers.find((user) => user.role === "viewer");

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .upsert(
      {
        name: "Sohibdigi Studio",
        slug: "sohibdigi-studio",
        description: "Workspace demo untuk project digital agency",
        owner_id: owner.id,
      },
      { onConflict: "slug" }
    )
    .select()
    .single();
  if (workspaceError) throw workspaceError;

  for (const demoUser of seededUsers) {
    await supabase.from("workspace_members").upsert(
      {
        workspace_id: workspace.id,
        user_id: demoUser.id,
        role: demoUser.role,
        status: "active",
        invited_by: demoUser.role === "owner" ? null : owner.id,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,user_id" }
    );
  }

  await Promise.all([
    supabase.from("activity_logs").delete().eq("workspace_id", workspace.id),
    supabase.from("notification_logs").delete().eq("workspace_id", workspace.id),
    supabase.from("ai_generations").delete().eq("workspace_id", workspace.id),
  ]);

  await upsertIntegration(workspace.id, owner.id, "discord", {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL_DEFAULT || process.env.DISCORD_WEBHOOK_URL,
  });
  await upsertIntegration(workspace.id, owner.id, "telegram", {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || process.env.TELEGRAM_CHAT_ID,
  });
  await upsertIntegration(workspace.id, owner.id, "gmail", {
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
    {
      name: "Mobile App Booking Barber",
      slug: "mobile-app-booking-barber",
      description: "Aplikasi booking appointment untuk jaringan barber lokal.",
      client_name: "BarberHub",
      project_type: "Mobile Application",
      status: "completed",
      priority: "medium",
      start_date: "2026-04-05",
      due_date: "2026-05-30",
      progress: 100,
      health_status: "completed",
      risk_score: 0,
    },
    {
      name: "Brand Refresh Kopi Nusantara",
      slug: "brand-refresh-kopi-nusantara",
      description: "Refresh brand identity, landing page, dan asset campaign.",
      client_name: "Kopi Nusantara",
      project_type: "Branding",
      status: "on_hold",
      priority: "low",
      start_date: "2026-06-01",
      due_date: "2026-09-15",
      progress: 35,
      health_status: "healthy",
      risk_score: 12,
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
          created_by: owner.id,
        },
        { onConflict: "workspace_id,slug" }
      )
      .select()
      .single();
    if (error) throw error;
    seededProjects.push(data);
  }

  const mainProject = seededProjects[0];
  for (const project of seededProjects) {
    await supabase.from("project_members").upsert(
      [
        { project_id: project.id, user_id: owner.id, role: "owner" },
        { project_id: project.id, user_id: manager.id, role: "lead" },
        { project_id: project.id, user_id: developer.id, role: "contributor" },
        { project_id: project.id, user_id: designer.id, role: "contributor" },
        { project_id: project.id, user_id: viewer.id, role: "viewer" },
      ],
      { onConflict: "project_id,user_id" }
    );
  }

  await supabase.from("tasks").delete().eq("project_id", mainProject.id);
  await supabase.from("milestones").delete().eq("project_id", mainProject.id);
  await supabase.from("reports").delete().eq("project_id", mainProject.id);

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

  for (const [index, [title, status, priority, dueDate, milestoneId]] of tasks.entries()) {
    const assigneeId =
      title === "Deploy to Vercel"
        ? null
        : (title === "Configure notification webhook" || title === "QA responsive mobile")
          ? owner.id
          : index % 2 === 0
            ? developer.id
            : designer.id;

    await supabase.from("tasks").insert({
      workspace_id: workspace.id,
      project_id: mainProject.id,
      milestone_id: milestoneId,
      title,
      description: `${title} for ${mainProject.name}.`,
      status,
      priority,
      assignee_id: assigneeId,
      reporter_id: manager.id,
      due_date: dueDate,
      acceptance_criteria: ["Output meets approved scope", "Reviewed by project lead"],
      ai_generated: false,
      completed_at: status === "done" ? new Date().toISOString() : null,
    });
  }

  await supabase.from("project_members").upsert(
    {
      project_id: mainProject.id,
      user_id: owner.id,
      role: "lead",
    },
    { onConflict: "project_id,user_id" }
  );

  await supabase.from("activity_logs").insert([
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      actor_id: owner.id,
      action: "project.created",
      entity_type: "project",
      entity_id: mainProject.id,
      metadata: { projectName: mainProject.name },
    },
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      actor_id: manager.id,
      action: "ai.risk_generated",
      entity_type: "project",
      entity_id: mainProject.id,
      metadata: { riskScore: 64, riskLevel: "medium" },
    },
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      actor_id: developer.id,
      action: "task.status_changed",
      entity_type: "task",
      entity_id: mainProject.id,
      metadata: { taskTitle: "Build hero section", fromStatus: "in_progress", toStatus: "done" },
    },
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      actor_id: manager.id,
      action: "notification.risk_alert_sent",
      entity_type: "notification",
      entity_id: mainProject.id,
      metadata: { providers: ["telegram"], sent: ["telegram"], failed: [] },
    },
  ]);

  await supabase.from("ai_generations").insert([
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      user_id: manager.id,
      type: "risk_analysis",
      prompt: "Demo risk analysis for Website Company Profile PT Maju Digital",
      response: {
        riskLevel: "medium",
        riskScore: 64,
        summary: "Project membutuhkan perhatian pada deployment dan webhook integration.",
        reasons: ["Deadline dekat", "Ada task blocked", "Ada task urgent belum punya owner"],
        recommendations: ["Assign deployment owner", "Escalate webhook issue"],
        escalationMessage: "Mohon review task blocked hari ini agar timeline tetap aman.",
      },
      status: "success",
    },
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      user_id: manager.id,
      type: "executive_summary",
      prompt: "Demo executive summary for CEO",
      response: {
        title: "Executive Summary",
        progress: 62,
        status: "At Risk",
        summary: "Project berjalan, namun butuh fokus pada QA dan deployment.",
      },
      status: "success",
    },
  ]);

  await supabase.from("notification_logs").insert([
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      provider: "discord",
      event_type: "task.completed",
      payload: { message: "Task completed update sent to Discord." },
      status: "sent",
      sent_at: new Date().toISOString(),
    },
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      provider: "telegram",
      event_type: "ai.risk_generated",
      payload: { message: "Medium risk alert sent to Telegram." },
      status: "sent",
      sent_at: new Date().toISOString(),
    },
    {
      workspace_id: workspace.id,
      project_id: mainProject.id,
      provider: "gmail",
      event_type: "report.sent",
      payload: { reportTitle: "Executive Summary", to: "ceo@majudigital.com" },
      status: "failed",
      error_message: "Demo SMTP credentials are not configured.",
    },
  ]);

  await supabase.from("reports").insert({
    workspace_id: workspace.id,
    project_id: mainProject.id,
    created_by: manager.id,
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
  console.log(`Additional demo users: ${demoUsers.slice(1).map((user) => user.email).join(", ")}`);
}

runSeed().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});
