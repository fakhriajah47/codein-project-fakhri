import { ActivityLog } from "@/types";

export function formatActivityActionLabel(action: string): string {
  const labels: Record<string, string> = {
    "workspace.created": "BUAT WORKSPACE",
    "workspace.updated": "UPDATE WORKSPACE",
    "project.created": "BUAT PROYEK",
    "project.updated": "UPDATE PROYEK",
    "project.deleted": "HAPUS PROYEK",
    "project.member_added": "TAMBAH MEMBER PROYEK",
    "task.created": "BUAT TUGAS",
    "task.updated": "UPDATE TUGAS",
    "task.status_changed": "STATUS TUGAS",
    "task.deleted": "HAPUS TUGAS",
    "task.assigned": "ASSIGN TUGAS",
    "task.comment_added": "KOMENTAR TUGAS",
    "task.attachment_added": "LAMPIRAN TUGAS",
    "task.attachment_deleted": "HAPUS LAMPIRAN",
    "member.invited": "UNDANG MEMBER",
    "member.role_updated": "UPDATE ROLE",
    "member.removed": "HAPUS MEMBER",
    "milestone.created": "BUAT MILESTONE",
    "milestone.updated": "UPDATE MILESTONE",
    "milestone.deleted": "HAPUS MILESTONE",
    "ai.risk_generated": "AI RISK",
    "ai.risk_analyzed": "AI RISK",
    "ai.tasks_saved": "AI TASKS",
    "ai.executive_summary_generated": "AI SUMMARY",
    "ai.daily_focus_generated": "AI FOCUS",
    "ai.project_query_answered": "AI QUERY",
    "ai.project_command_executed": "AI COMMAND",
    "notification.risk_alert_sent": "NOTIF RISK",
    "notification.manual_update_sent": "NOTIF UPDATE",
    "integration.connected": "INTEGRASI AKTIF",
    "integration.disconnected": "INTEGRASI OFF",
    "report.created": "BUAT REPORT",
    "report.sent": "KIRIM REPORT",
  };

  return labels[action] || action.replaceAll(".", " ").toUpperCase();
}

export function formatActivityMetadata(activity: ActivityLog): string | null {
  const meta = (activity.metadata || {}) as Record<string, any>;
  if (meta.projectName) return `Project: ${meta.projectName}`;
  if (meta.taskTitle && meta.fromStatus && meta.toStatus) {
    return `Task: ${meta.taskTitle} (${translateStatus(meta.fromStatus)} -> ${translateStatus(meta.toStatus)})`;
  }
  if (meta.taskTitle) return `Task: ${meta.taskTitle}`;
  if (meta.invitedEmail) return `Member: ${meta.invitedEmail} (${meta.role || "member"})`;
  if (meta.from && meta.to) return `Role: ${meta.from} -> ${meta.to}`;
  if (meta.provider) return `Provider: ${meta.provider}`;
  if (Array.isArray(meta.providers)) {
    const sent = Array.isArray(meta.sent) ? meta.sent.join(", ") : "";
    const failed = Array.isArray(meta.failed) ? meta.failed.join(", ") : "";
    return `Channel: ${meta.providers.join(", ")}${sent ? ` | Sent: ${sent}` : ""}${failed ? ` | Failed: ${failed}` : ""}`;
  }
  if (meta.created && typeof meta.created === "object") {
    const created = meta.created as Record<string, any>;
    return created.type === "project"
      ? `Project: ${created.name || created.id}`
      : `Task: ${created.title || created.id}`;
  }
  if (meta.focusTaskCount !== undefined) return `Focus task: ${meta.focusTaskCount}`;
  if (meta.title || meta.name) return `Nama: ${meta.title || meta.name}`;
  return null;
}

export function formatActivityDescription(activity: ActivityLog): string {
  const meta = (activity.metadata || {}) as Record<string, any>;

  switch (activity.action) {
    case "project.created":
      return `membuat proyek baru: "${meta.projectName || "Proyek Tanpa Nama"}"`;
    case "project.updated":
      return `memperbarui parameter proyek: "${meta.projectName || "Proyek"}"`;
    case "task.created":
      return `membuat tugas baru: "${meta.taskTitle || "Tugas Tanpa Nama"}"`;
    case "task.status_changed": {
      const fromStatus = meta.fromStatus ? translateStatus(meta.fromStatus) : "";
      const toStatus = meta.toStatus ? translateStatus(meta.toStatus) : "";
      return `mengubah status tugas "${meta.taskTitle || "Tugas"}"${fromStatus ? ` dari ${fromStatus}` : ""} menjadi "${toStatus}"`;
    }
    case "task.updated": {
      const fields = Array.isArray(meta.changedFields) ? meta.changedFields : [];
      const fieldsStr = fields.length > 0 ? ` (${fields.join(", ")})` : "";
      return `memperbarui rincian tugas "${meta.taskTitle || "Tugas"}"${fieldsStr}`;
    }
    case "task.assigned":
      return `menugaskan tugas "${meta.taskTitle || "Tugas"}" kepada "${meta.assigneeName || "Anggota Tim"}"`;
    case "task.comment_added":
      return `menambahkan komentar pada tugas "${meta.taskTitle || "Tugas"}"`;
    case "milestone.created":
      return `membuat milestone baru: "${meta.milestoneTitle || "Milestone Tanpa Nama"}"`;
    case "milestone.updated":
      return `memperbarui milestone: "${meta.milestoneTitle || "Milestone"}"`;
    case "milestone.deleted":
      return `menghapus milestone: "${meta.milestoneTitle || "Milestone"}"`;
    case "ai.risk_generated":
      return `menghasilkan analisis risiko AI (Skor Risiko: ${meta.riskScore || 0}, Tingkat: ${meta.riskLevel || "normal"})`;
    case "ai.risk_analyzed":
      return `menghasilkan analisis risiko AI (Skor Risiko: ${meta.riskScore || 0}, Tingkat: ${meta.riskLevel || "normal"})`;
    case "ai.tasks_saved":
      return `menyimpan tugas rekomendasi AI (${meta.tasksCreated || 0} tugas dalam ${meta.milestonesCreated || 0} milestone)`;
    case "ai.executive_summary_generated":
      return `menghasilkan ringkasan eksekutif AI untuk target audiens: ${meta.targetAudience || "CEO"}`;
    case "ai.daily_focus_generated":
      return `menghasilkan fokus kerja harian AI (${meta.focusTaskCount || 0} task prioritas)`;
    case "ai.project_query_answered":
      return `menjawab query data project melalui AI`;
    case "ai.project_command_executed":
      return `menjalankan perintah project melalui AI`;
    case "notification.risk_alert_sent":
      return `mengirim notifikasi peringatan risiko proyek melalui ${Array.isArray(meta.providers) ? meta.providers.join(", ") : "saluran terkonfigurasi"}`;
    case "notification.manual_update_sent":
      return `mengirim update proyek manual melalui ${Array.isArray(meta.providers) ? meta.providers.join(", ") : "saluran terkonfigurasi"}`;
    case "integration.connected":
      return `menghubungkan integrasi pihak ketiga: ${meta.provider || "Penyedia"}`;
    case "integration.disconnected":
      return `memutuskan integrasi pihak ketiga: ${meta.provider || "Penyedia"}`;
    case "member.invited":
      return `menambahkan anggota workspace ${meta.invitedEmail || ""}`;
    case "member.role_updated":
      return `mengubah role anggota workspace dari ${meta.from || "-"} menjadi ${meta.to || "-"}`;
    case "member.removed":
      return `menghapus anggota workspace`;
    case "workspace.created":
      return `membuat workspace baru: "${meta.workspaceName || "Workspace"}"`;
    case "workspace.updated":
      return `memperbarui workspace`;
    default:
      // Fallback behavior based on action names
      if (activity.action.includes("create")) {
        return `membuat ${activity.entity_type} baru`;
      }
      if (activity.action.includes("update") || activity.action.includes("status")) {
        return `memperbarui ${activity.entity_type}`;
      }
      if (activity.action.includes("delete")) {
        return `menghapus ${activity.entity_type}`;
      }
      return `melakukan operasi pada ${activity.entity_type}`;
  }
}

function translateStatus(status: string): string {
  switch (status) {
    case "backlog": return "Backlog";
    case "todo": return "Rencana (To Do)";
    case "in_progress": return "Dikerjakan (In Progress)";
    case "in_review": return "Ditinjau (In Review)";
    case "done": return "Selesai (Done)";
    case "blocked": return "Terhambat (Blocked)";
    default: return status;
  }
}
