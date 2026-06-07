{
  "deck_metadata": {
    "title": "Project Management Command Center",
    "subtitle": "AI-assisted workspace untuk mengelola project, team, risiko, laporan, dan komunikasi client dari satu sistem terpadu",
    "version": "1.0",
    "language": "id-ID",
    "audience": "Client, founder, CEO, project manager, product owner, dan stakeholder non-teknis",
    "tone": "professional, friendly, confident, clear, and closing-oriented",
    "duration_estimate_minutes": 35,
    "created_for": "Client presentation and business closing",
    "source_project": "codein-project-fakhri",
    "recommended_format": "16:9 presentation, web slide, or PDF",
    "design_style": {
      "visual_personality": "modern command center, clean SaaS dashboard, practical, premium, and easy to understand",
      "color_direction": "white base, strong black text, blue for trust, green for progress, yellow for warning, red for risk, purple for AI",
      "typography_direction": "large clear headings, short bullet points, readable body text, strong section labels",
      "layout_direction": "one main idea per slide, use simple cards, data callouts, workflow arrows, and product screenshots where possible"
    }
  },
  "slide_generation_rules": {
    "primary_goal": "Membuat client memahami bahwa aplikasi ini bukan hanya project tracker, tetapi operational command center yang siap dipakai untuk meningkatkan kontrol, transparansi, kecepatan eksekusi, dan kualitas komunikasi project.",
    "conversion_hint": "Setiap slide object bisa dirender sebagai satu halaman. Gunakan title sebagai H1, subtitle sebagai supporting copy, content_blocks sebagai body, speaker_notes sebagai narasi presenter, dan visual_direction sebagai instruksi desain.",
    "content_density": "Detail komprehensif tetapi tetap simple. Jangan memadatkan semua teks dalam satu area; pecah content_blocks menjadi card atau column.",
    "image_hint": "Gunakan screenshot dashboard, kanban, project detail, AI panel, integrations, activity log, my-work, team workspace, dan reports jika tersedia."
  },
  "slides": [
    {
      "id": 1,
      "section": "Opening",
      "title": "Project Management Command Center",
      "subtitle": "Satu platform untuk mengelola project, pekerjaan team, AI insight, laporan eksekutif, dan integrasi komunikasi client.",
      "content_blocks": [
        {
          "type": "hero_points",
          "items": [
            "Dibangun sebagai aplikasi kerja nyata, bukan sekadar mockup dashboard.",
            "Menggabungkan workflow project management, AI assistant, Supabase database, dan third-party integrations.",
            "Dirancang untuk agency, software team, founder, dan client-facing project delivery.",
            "Tujuan utama: pekerjaan lebih terkontrol, risiko lebih cepat terlihat, dan komunikasi stakeholder lebih rapi."
          ]
        },
        {
          "type": "value_statement",
          "heading": "Janji utama produk",
          "body": "Client tidak hanya melihat daftar task. Client melihat sistem operasional end-to-end yang membantu project berjalan, terukur, terdokumentasi, dan siap dipertanggungjawabkan."
        }
      ],
      "speaker_notes": "Buka presentasi dengan positioning yang kuat: ini bukan tools kecil untuk catatan task, tetapi command center. Tekankan bahwa semua modul saling terhubung dari workspace, project, team, AI, reporting, sampai notifikasi.",
      "visual_direction": "Gunakan tampilan hero dengan mockup dashboard besar. Tambahkan 4 badge kecil: AI, Supabase, Integrations, Executive Reports."
    },
    {
      "id": 2,
      "section": "Problem",
      "title": "Masalah Umum Dalam Delivery Project",
      "subtitle": "Banyak project gagal bukan karena team tidak bekerja, tetapi karena informasi tercecer dan keputusan terlambat.",
      "content_blocks": [
        {
          "type": "problem_list",
          "items": [
            "Task tersebar di chat, spreadsheet, notes, dan tools berbeda.",
            "Client sulit mengetahui status progress yang benar-benar terbaru.",
            "Manager baru sadar project bermasalah ketika deadline sudah dekat.",
            "Laporan ke CEO atau client dibuat manual dan memakan waktu.",
            "Team tidak selalu jelas siapa mengerjakan apa, prioritas mana yang harus didahulukan, dan risiko apa yang perlu diekskalasi.",
            "Notifikasi penting sering tenggelam di percakapan harian."
          ]
        },
        {
          "type": "impact",
          "heading": "Dampaknya",
          "items": [
            "Timeline meleset.",
            "Komunikasi client tidak konsisten.",
            "Beban kerja team tidak terlihat.",
            "Keputusan penting terlambat.",
            "Kepercayaan stakeholder menurun."
          ]
        }
      ],
      "speaker_notes": "Gunakan slide ini untuk membuat client merasa relate. Jangan terlalu teknis. Fokus pada masalah bisnis: kontrol, transparansi, deadline, trust, dan efisiensi komunikasi.",
      "visual_direction": "Tampilkan diagram chaos: chat, spreadsheet, email, notes, task list terpisah menuju satu masalah besar: kurang kontrol."
    },
    {
      "id": 3,
      "section": "Solution",
      "title": "Solusi: Satu Sistem Terpadu Dari Hulu Ke Hilir",
      "subtitle": "Aplikasi ini menyatukan planning, execution, monitoring, AI analysis, reporting, dan communication dalam satu workspace.",
      "content_blocks": [
        {
          "type": "solution_flow",
          "steps": [
            "Workspace dibuat untuk mengelola organisasi atau client account.",
            "Project dibuat dengan scope, client, tipe project, priority, timeline, progress, dan health status.",
            "Task dan milestone disusun agar pekerjaan terpecah jelas.",
            "Team member diberi role dan assignment.",
            "Dashboard memantau health, workload, overdue task, dan activity.",
            "AI membantu membaca data project, memberi rekomendasi, membuat task, membaca risiko, dan menyusun report.",
            "Integrasi Discord, Telegram, dan Gmail mengirim update ke channel yang tepat.",
            "Activity log menyimpan jejak aksi nyata untuk audit dan accountability."
          ]
        },
        {
          "type": "client_takeaway",
          "heading": "Takeaway untuk client",
          "body": "Semua orang melihat sumber kebenaran yang sama. Tidak ada lagi status project yang simpang siur."
        }
      ],
      "speaker_notes": "Jelaskan alur dari awal sampai akhir. Pastikan client menangkap bahwa sistem ini bukan modul terpisah, tetapi satu ekosistem yang saling mengalir.",
      "visual_direction": "Gunakan horizontal pipeline: Workspace -> Project -> Task -> Team -> AI -> Reports -> Notifications -> Audit Log."
    },
    {
      "id": 4,
      "section": "Product Overview",
      "title": "Apa Yang Sudah Ada Di Dalam Aplikasi",
      "subtitle": "Fitur inti sudah mencakup kebutuhan operasional project modern.",
      "content_blocks": [
        {
          "type": "feature_grid",
          "items": [
            {
              "feature": "Dashboard Utama",
              "description": "Melihat project aktif, task selesai, overdue task, project risk, workload team, AI advisor, dan log aktivitas terbaru."
            },
            {
              "feature": "Katalog Proyek",
              "description": "Mengelola daftar project berdasarkan status, priority, health, client, dan timeline."
            },
            {
              "feature": "Detail Project",
              "description": "Menyediakan overview, kanban board, milestone, AI assistant, activity log, dan project settings."
            },
            {
              "feature": "Pekerjaan Saya",
              "description": "Membantu setiap user fokus pada task yang assigned ke dirinya, termasuk priority dan daily focus."
            },
            {
              "feature": "Team Workspace",
              "description": "Mengelola member, role, invitation, dan akses workspace."
            },
            {
              "feature": "Laporan Eksekutif",
              "description": "Membuat dan mengirim report formal untuk CEO, client, internal team, atau stakeholder."
            },
            {
              "feature": "Integrasi Sistem",
              "description": "Menghubungkan Discord, Telegram, dan Gmail untuk notifikasi dan komunikasi formal."
            },
            {
              "feature": "Log Aktivitas",
              "description": "Mencatat aksi nyata seperti create project, update task, AI command, notification sent, dan role changes."
            }
          ]
        }
      ],
      "speaker_notes": "Slide ini adalah map produk. Berikan gambaran cepat sebelum masuk ke detail. Client akan melihat bahwa aplikasi sudah memiliki struktur produk yang lengkap.",
      "visual_direction": "Gunakan 2x4 feature card grid dengan icon sederhana untuk setiap modul."
    },
    {
      "id": 5,
      "section": "Architecture",
      "title": "Arsitektur Modern Yang Siap Dikembangkan",
      "subtitle": "Dibangun dengan stack yang relevan, scalable, dan cocok untuk produk SaaS internal maupun client-facing.",
      "content_blocks": [
        {
          "type": "architecture_stack",
          "items": [
            {
              "layer": "Frontend",
              "technology": "Next.js 16 App Router, React 19, Tailwind CSS",
              "benefit": "UI cepat, modern, modular, dan siap dikembangkan menjadi SaaS."
            },
            {
              "layer": "Backend API",
              "technology": "Next.js Route Handlers",
              "benefit": "API server-side untuk workspace, project, task, report, AI, integrations, dan notifications."
            },
            {
              "layer": "Database & Auth",
              "technology": "Supabase Auth, Postgres, RLS-ready schema",
              "benefit": "User login, workspace membership, data relational, dan akses berbasis role."
            },
            {
              "layer": "AI Engine",
              "technology": "Google Gemini API",
              "benefit": "AI task generation, risk analysis, executive summary, daily focus, dan conversational data query."
            },
            {
              "layer": "Integrations",
              "technology": "Discord Webhook, Telegram Bot, Gmail SMTP/OAuth-ready",
              "benefit": "Update project dapat keluar dari aplikasi ke channel kerja dan stakeholder."
            },
            {
              "layer": "Validation",
              "technology": "Zod schemas",
              "benefit": "Input API lebih aman dan konsisten."
            }
          ]
        }
      ],
      "speaker_notes": "Tekankan bahwa stack ini bukan teknologi lama. Next.js, Supabase, dan Gemini adalah kombinasi modern yang cepat untuk delivery produk, tetapi tetap kuat untuk scale-up.",
      "visual_direction": "Buat diagram layer vertikal: UI, API, Services, Supabase, AI, Integrations."
    },
    {
      "id": 6,
      "section": "Workspace",
      "title": "Workspace Sebagai Pusat Operasi",
      "subtitle": "Semua data project, team, integrasi, laporan, dan aktivitas dikunci dalam konteks workspace.",
      "content_blocks": [
        {
          "type": "explanation",
          "heading": "Kenapa workspace penting",
          "body": "Workspace membuat aplikasi fleksibel untuk berbagai skenario: satu agency dengan banyak client, satu perusahaan dengan banyak divisi, atau satu founder dengan beberapa product initiative."
        },
        {
          "type": "capabilities",
          "items": [
            "User bisa memiliki dan berpindah antar workspace.",
            "Setiap workspace memiliki member aktif dan role berbeda.",
            "Project, task, activity, report, integration setting, dan notification log terhubung ke workspace.",
            "Role workspace dipakai untuk menentukan siapa yang bisa membuat project, mengubah member, menjalankan AI action, dan mengelola integrasi.",
            "Workspace menjadi batas data utama agar project client tidak tercampur."
          ]
        }
      ],
      "speaker_notes": "Jelaskan workspace dengan bahasa mudah: seperti kantor digital untuk satu organisasi atau satu client account. Semua modul mengikuti workspace aktif.",
      "visual_direction": "Tampilkan satu container besar bernama Workspace, berisi Project, Team, AI, Reports, Integrations, Activity."
    },
    {
      "id": 7,
      "section": "Project Management",
      "title": "Project Dibangun Dengan Data Yang Lengkap",
      "subtitle": "Setiap project tidak hanya punya nama, tetapi juga status, client, priority, progress, health, risk score, timeline, dan owner.",
      "content_blocks": [
        {
          "type": "data_model",
          "items": [
            "Project name dan slug untuk identitas project.",
            "Description untuk scope dan konteks pekerjaan.",
            "Client name untuk kebutuhan agency atau vendor.",
            "Project type seperti website development, landing page, web application, mobile application, atau branding.",
            "Status: planning, active, on_hold, completed, cancelled.",
            "Priority: low, medium, high, urgent.",
            "Start date dan due date untuk timeline.",
            "Progress berdasarkan task completion.",
            "Health status: healthy, at_risk, critical, completed.",
            "Risk score untuk membaca kondisi project secara cepat."
          ]
        },
        {
          "type": "business_value",
          "heading": "Nilai bisnis",
          "body": "Client bisa melihat project secara professional: bukan hanya task list, tetapi status operasional lengkap yang bisa dijadikan dasar keputusan."
        }
      ],
      "speaker_notes": "Slide ini menunjukkan kedalaman data project. Tekankan bahwa data yang rapi membuat automation, AI insight, dan reporting menjadi mungkin.",
      "visual_direction": "Gunakan mockup card project dengan fields utama: client, status, priority, progress, risk score, due date."
    },
    {
      "id": 8,
      "section": "Execution",
      "title": "Task Dan Kanban Untuk Eksekusi Harian",
      "subtitle": "Pekerjaan dipecah menjadi task yang jelas, bisa diassign, diprioritaskan, dan dipantau statusnya.",
      "content_blocks": [
        {
          "type": "kanban_columns",
          "columns": [
            "Backlog",
            "To Do",
            "In Progress",
            "In Review",
            "Done",
            "Blocked"
          ]
        },
        {
          "type": "task_fields",
          "items": [
            "Title dan description untuk konteks kerja.",
            "Status untuk posisi task di workflow.",
            "Priority untuk menentukan urgensi.",
            "Assignee untuk ownership yang jelas.",
            "Reporter untuk accountability.",
            "Due date untuk deadline.",
            "Estimated hours dan actual hours untuk kontrol effort.",
            "Acceptance criteria agar output lebih objektif.",
            "AI generated flag untuk membedakan task yang dibuat AI."
          ]
        }
      ],
      "speaker_notes": "Sampaikan bahwa kanban bukan sekadar visual. Setiap perubahan status memicu recalculation progress, update health, dan activity log.",
      "visual_direction": "Gunakan screenshot atau ilustrasi board dengan 6 kolom. Highlight blocked dan urgent task dengan warna berbeda."
    },
    {
      "id": 9,
      "section": "Milestones",
      "title": "Milestone Membuat Project Lebih Terstruktur",
      "subtitle": "Project besar dapat dipecah menjadi fase yang lebih mudah dipahami oleh team dan client.",
      "content_blocks": [
        {
          "type": "milestone_examples",
          "items": [
            "Planning & Design: requirement, sitemap, wireframe, dan visual direction.",
            "Frontend & Integration: implementation, form integration, API, dan third-party setup.",
            "QA & Launch: testing, responsive review, deployment, dan final client approval."
          ]
        },
        {
          "type": "why_it_matters",
          "items": [
            "Client bisa melihat progress per fase, bukan hanya angka global.",
            "Manager bisa tahu fase mana yang tertahan.",
            "AI bisa membuat breakdown task lebih logis berdasarkan milestone.",
            "Report menjadi lebih mudah dipahami oleh stakeholder non-teknis."
          ]
        }
      ],
      "speaker_notes": "Gunakan contoh project website company profile. Jelaskan bahwa milestone membuat project delivery terasa rapi dan profesional.",
      "visual_direction": "Timeline horizontal tiga fase dengan progress indicator."
    },
    {
      "id": 10,
      "section": "Dashboard",
      "title": "Dashboard Utama: Semua Kondisi Penting Terlihat Cepat",
      "subtitle": "Dashboard menyatukan metric, workload, health project, AI advisor, dan activity log dalam satu layar.",
      "content_blocks": [
        {
          "type": "dashboard_metrics",
          "items": [
            "Jumlah project aktif dibanding total project.",
            "Task selesai dibanding total task.",
            "Jumlah task overdue.",
            "Jumlah project berisiko.",
            "Workload team berdasarkan assigned task dan completed task.",
            "Project health distribution: healthy, at risk, critical, completed.",
            "Recent activity untuk melihat aksi terbaru."
          ]
        },
        {
          "type": "client_takeaway",
          "heading": "Kesan yang ingin diberikan ke client",
          "body": "Client langsung melihat bahwa project dikelola dengan data, bukan feeling."
        }
      ],
      "speaker_notes": "Dashboard adalah slide yang kuat untuk closing. Tunjukkan bahwa stakeholder bisa membuka satu halaman dan langsung paham kondisi project.",
      "visual_direction": "Gunakan layout dashboard: metric cards di atas, workload dan health di tengah, activity log di sisi kanan."
    },
    {
      "id": 11,
      "section": "Team",
      "title": "Team Workspace: Role, Member, Dan Accountability",
      "subtitle": "Aplikasi menyediakan management team agar beban kerja dan akses tidak menggantung di satu orang.",
      "content_blocks": [
        {
          "type": "role_matrix",
          "items": [
            {
              "role": "Owner",
              "permission": "Kontrol penuh workspace, role member, integrasi, dan project."
            },
            {
              "role": "Manager",
              "permission": "Mengelola project, task, report, integrasi tertentu, dan koordinasi operasional."
            },
            {
              "role": "Member",
              "permission": "Mengerjakan task, update status, dan berkolaborasi di project."
            },
            {
              "role": "Viewer",
              "permission": "Melihat progress tanpa mengubah data operasional."
            }
          ]
        },
        {
          "type": "capabilities",
          "items": [
            "Melihat daftar anggota workspace.",
            "Mengundang user terdaftar ke workspace.",
            "Mengubah role member oleh owner.",
            "Menghapus member dengan guard agar owner terakhir tidak terhapus.",
            "Activity log mencatat invite, role update, dan removal."
          ]
        }
      ],
      "speaker_notes": "Jawab concern client tentang kontrol akses. Produk ini bukan dashboard bebas akses; role dan ownership sudah dipikirkan.",
      "visual_direction": "Gunakan table role matrix yang mudah dibaca."
    },
    {
      "id": 12,
      "section": "My Work",
      "title": "Pekerjaan Saya: Fokus Harian Untuk Setiap User",
      "subtitle": "Setiap anggota team dapat melihat pekerjaan yang relevan untuk dirinya, bukan seluruh noise project.",
      "content_blocks": [
        {
          "type": "personal_work_sections",
          "items": [
            "Today focus: task yang paling penting untuk dikerjakan.",
            "Overdue tasks: pekerjaan yang sudah melewati deadline.",
            "High priority tasks: pekerjaan urgent/high yang butuh perhatian.",
            "In progress tasks: pekerjaan yang sedang dikerjakan.",
            "Completed tasks: bukti output yang sudah selesai."
          ]
        },
        {
          "type": "why_it_matters",
          "items": [
            "Mengurangi kebingungan anggota team.",
            "Membuat daily standup lebih cepat.",
            "Mendorong ownership karena task assigned terlihat jelas.",
            "Manager bisa memberi arahan lebih tepat."
          ]
        }
      ],
      "speaker_notes": "Tekankan bahwa aplikasi tidak hanya untuk manager. Setiap individual contributor juga mendapat halaman kerja yang practical.",
      "visual_direction": "Gunakan screenshot My Work dengan highlight high priority dan overdue."
    },
    {
      "id": 13,
      "section": "AI",
      "title": "AI Workspace Advisor Dengan Gemini",
      "subtitle": "AI membaca kondisi workspace dan memberi insight operasional yang bisa langsung dipakai.",
      "content_blocks": [
        {
          "type": "ai_capabilities",
          "items": [
            "Menilai workspace health: Excellent, Good, Needs Attention, atau Critical.",
            "Memberi health score 0 sampai 100.",
            "Membuat advisory note dalam bahasa yang mudah dipahami.",
            "Menampilkan key alerts seperti project critical, task overdue, atau workload imbalance.",
            "Memberi rekomendasi tindakan dengan urgency: low, medium, high, atau urgent."
          ]
        },
        {
          "type": "data_sources",
          "heading": "Data yang dibaca AI",
          "items": [
            "Project stats.",
            "Project health distribution.",
            "Workload member.",
            "Project detail.",
            "Recent activity."
          ]
        }
      ],
      "speaker_notes": "Jelaskan bahwa AI bukan gimmick. AI memproses data workspace dan membantu manager menemukan prioritas.",
      "visual_direction": "Gunakan card AI advisor dengan score besar dan list rekomendasi."
    },
    {
      "id": 14,
      "section": "AI",
      "title": "Conversational Project Data Query",
      "subtitle": "User bisa bertanya ke data project dalam bahasa natural dan mendapatkan jawaban dari Supabase plus bantuan Gemini.",
      "content_blocks": [
        {
          "type": "example_queries",
          "items": [
            "Berapa project aktif sekarang?",
            "Task mana yang urgent dan belum selesai?",
            "Siapa member yang workload-nya paling tinggi?",
            "Project mana yang berisiko?",
            "Apa fokus utama hari ini?",
            "Buat task Review final integrasi sistem urgent di project Website Company Profile assign ke saya."
          ]
        },
        {
          "type": "important_detail",
          "heading": "Kenapa ini powerful",
          "body": "AI tidak hanya menjawab. Untuk perintah yang jelas, AI dapat menjalankan aksi langsung seperti membuat task atau project melalui service aplikasi."
        }
      ],
      "speaker_notes": "Ini fitur yang dapat membuat client amaze. Tunjukkan contoh command yang langsung membuat task, lalu activity log mencatat aksi tersebut.",
      "visual_direction": "Gunakan chat/input command di kiri dan hasil created task di kanan."
    },
    {
      "id": 15,
      "section": "AI Automation",
      "title": "AI Dapat Membantu Membuat Pekerjaan, Bukan Hanya Memberi Saran",
      "subtitle": "Aplikasi mendukung AI-assisted execution agar manager tidak perlu selalu membuat semua task manual.",
      "content_blocks": [
        {
          "type": "automation_modes",
          "items": [
            "Generate task breakdown dari brief project.",
            "Menyimpan task rekomendasi AI menjadi task nyata.",
            "Membuat task langsung dari conversational command.",
            "Membuat project langsung dari instruksi user yang jelas.",
            "Menandai task AI-generated untuk transparansi.",
            "Tetap menggunakan validasi role agar viewer tidak bisa membuat task."
          ]
        },
        {
          "type": "governance",
          "heading": "Kontrol tetap aman",
          "items": [
            "Mutation melewati service resmi aplikasi.",
            "Activity log mencatat tindakan AI.",
            "Supabase menyimpan data final.",
            "Fallback lokal menjaga workflow tetap berjalan saat AI rate limit."
          ]
        }
      ],
      "speaker_notes": "Tekankan balance antara automation dan governance. AI mempercepat pekerjaan, tetapi tetap berada dalam aturan aplikasi.",
      "visual_direction": "Diagram: User command -> AI parser -> validation -> ProjectService/TaskService -> Supabase -> Activity log."
    },
    {
      "id": 16,
      "section": "Risk",
      "title": "AI Risk Analysis Untuk Deteksi Masalah Lebih Awal",
      "subtitle": "Project tidak menunggu gagal dulu baru terlihat. Sistem membaca sinyal risiko dari data operasional.",
      "content_blocks": [
        {
          "type": "risk_inputs",
          "items": [
            "Deadline project.",
            "Progress project.",
            "Jumlah task overdue.",
            "Jumlah task blocked.",
            "Task urgent/high yang belum selesai.",
            "Milestone progress.",
            "Recent activity count."
          ]
        },
        {
          "type": "risk_outputs",
          "items": [
            "Risk level: low, medium, high, atau critical.",
            "Risk score numerik.",
            "Alasan risiko.",
            "Rekomendasi tindakan.",
            "Escalation message yang bisa dikirim ke stakeholder."
          ]
        }
      ],
      "speaker_notes": "Jelaskan bahwa risk analysis membantu client merasa aman karena masalah diangkat lebih cepat. Ini sangat penting untuk deadline-sensitive project.",
      "visual_direction": "Gunakan risk radar atau score gauge dengan callout overdue, blocked, urgent."
    },
    {
      "id": 17,
      "section": "Reports",
      "title": "Laporan Eksekutif Yang Siap Dikirim",
      "subtitle": "Aplikasi membantu membuat report formal untuk CEO, client, internal team, dan stakeholder.",
      "content_blocks": [
        {
          "type": "report_types",
          "items": [
            "Daily report untuk update cepat.",
            "Weekly report untuk progress berkala.",
            "Executive summary untuk CEO atau founder.",
            "Client report untuk komunikasi eksternal.",
            "Risk report untuk eskalasi masalah."
          ]
        },
        {
          "type": "report_content",
          "items": [
            "Summary kondisi project.",
            "Completed work.",
            "Pending work.",
            "Risks.",
            "Next actions.",
            "Target audience.",
            "Status draft, sent, atau archived."
          ]
        }
      ],
      "speaker_notes": "Report adalah fitur yang membantu closing karena client sering membutuhkan bukti komunikasi profesional. Tekankan bahwa report bisa dikirim via Gmail.",
      "visual_direction": "Tampilkan contoh report preview dengan sections: summary, completed, pending, risks, next actions."
    },
    {
      "id": 18,
      "section": "Integrations",
      "title": "Integrasi Sistem: Discord, Telegram, Gmail",
      "subtitle": "Project update tidak berhenti di dashboard. Informasi penting bisa mengalir ke channel kerja dan stakeholder.",
      "content_blocks": [
        {
          "type": "integration_roles",
          "items": [
            {
              "provider": "Discord",
              "role": "Channel update untuk team teknis, task completed, task blocked, dan project at risk."
            },
            {
              "provider": "Telegram",
              "role": "Alert cepat untuk founder, manager, atau channel critical project."
            },
            {
              "provider": "Gmail",
              "role": "Report formal untuk CEO, client, dan stakeholder eksternal."
            }
          ]
        },
        {
          "type": "configuration",
          "items": [
            "Default integrasi dibaca dari environment variables.",
            "Config sensitif dimask saat dikirim ke client.",
            "Test connection tersedia untuk validasi setup.",
            "Notification log mencatat status pending, sent, atau failed.",
            "Activity log mencatat integrasi connect, disconnect, dan notification action."
          ]
        }
      ],
      "speaker_notes": "Jelaskan fungsi berbeda setiap channel. Discord untuk team, Telegram untuk alert cepat, Gmail untuk formal report.",
      "visual_direction": "Tiga card provider dengan icon dan flow dari aplikasi ke channel masing-masing."
    },
    {
      "id": 19,
      "section": "Data Flow",
      "title": "Aliran Data Sinkron Dari UI Ke Supabase Ke Integrasi",
      "subtitle": "Setiap aksi penting mengalir melalui service layer agar data tetap konsisten dan bisa diaudit.",
      "content_blocks": [
        {
          "type": "flow_steps",
          "steps": [
            "User melakukan aksi di UI, misalnya membuat task atau update status.",
            "Frontend memanggil API route Next.js.",
            "API melakukan auth check dan workspace role validation.",
            "Schema Zod memvalidasi payload.",
            "Service layer menulis data ke Supabase.",
            "Progress dan health project dihitung ulang jika diperlukan.",
            "ActivityService mencatat aksi nyata.",
            "NotificationService mengirim update ke Discord atau Telegram jika enabled.",
            "ReportService dan Gmail integration digunakan untuk komunikasi formal.",
            "Dashboard dan pages lain membaca kembali data fresh dari Supabase."
          ]
        }
      ],
      "speaker_notes": "Slide ini untuk client teknis atau stakeholder yang ingin yakin sistemnya benar. Tunjukkan bahwa data tidak asal tempel di UI; semuanya lewat alur yang rapi.",
      "visual_direction": "Buat sequence diagram sederhana: UI -> API -> Validation -> Service -> Supabase -> AI/Integrations -> Activity Log."
    },
    {
      "id": 20,
      "section": "Audit",
      "title": "Log Aktivitas Real Actual By Action",
      "subtitle": "Setiap aksi penting tercatat sebagai jejak audit yang bisa dibaca manusia.",
      "content_blocks": [
        {
          "type": "tracked_actions",
          "items": [
            "workspace.created dan workspace.updated.",
            "project.created, project.updated, project.deleted.",
            "task.created, task.updated, task.status_changed, task.deleted.",
            "task.comment_added dan task.attachment_added.",
            "member.invited, member.role_updated, member.removed.",
            "ai.risk_analyzed, ai.tasks_saved, ai.executive_summary_generated, ai.daily_focus_generated.",
            "ai.project_query_answered dan ai.project_command_executed.",
            "notification.risk_alert_sent dan notification.manual_update_sent.",
            "integration.disconnected.",
            "report.sent."
          ]
        },
        {
          "type": "benefit",
          "heading": "Manfaat",
          "body": "Client, manager, dan team dapat melihat siapa melakukan apa, kapan, dan pada entity apa. Ini meningkatkan transparansi dan accountability."
        }
      ],
      "speaker_notes": "Tegaskan bahwa activity log bukan dummy. Log berasal dari service saat aksi terjadi.",
      "visual_direction": "Timeline vertical dengan actor, action label, timestamp, dan metadata ringkas."
    },
    {
      "id": 21,
      "section": "Security",
      "title": "Security Dan Data Governance",
      "subtitle": "Sistem dirancang agar data sensitif dan aksi penting tidak terbuka sembarangan.",
      "content_blocks": [
        {
          "type": "security_points",
          "items": [
            "Supabase Auth untuk user authentication.",
            "Workspace membership check di API route.",
            "Role-based permissions untuk owner, manager, member, dan viewer.",
            "Viewer tidak bisa melakukan mutation penting.",
            "Owner guard mencegah owner terakhir terhapus.",
            "Integration secret dimask di API response.",
            "Notification log tidak menyimpan token/webhook mentah.",
            "Server-side routes menjaga secret tetap di server.",
            "Zod validation mencegah payload invalid masuk ke service."
          ]
        }
      ],
      "speaker_notes": "Jelaskan dengan tenang dan jelas. Security bukan hanya password; yang penting adalah role, access boundary, secret masking, dan server-side handling.",
      "visual_direction": "Gunakan shield visual dengan 4 pilar: Auth, Role, Secret Masking, Audit."
    },
    {
      "id": 22,
      "section": "Client Experience",
      "title": "Pengalaman Client: Lebih Transparan, Lebih Percaya",
      "subtitle": "Client mendapat rasa aman karena project terlihat rapi, status jelas, dan report mudah dipahami.",
      "content_blocks": [
        {
          "type": "client_benefits",
          "items": [
            "Client bisa melihat progress project tanpa menunggu update manual.",
            "Status project lebih objektif karena berbasis data task dan milestone.",
            "Risiko muncul lebih awal lewat AI risk analysis.",
            "Report eksekutif membuat komunikasi lebih formal dan rapi.",
            "Integrasi email membuat laporan bisa langsung dikirim.",
            "Activity log memberi bukti bahwa team benar-benar bergerak."
          ]
        },
        {
          "type": "closing_angle",
          "heading": "Efek bisnis",
          "body": "Semakin rapi sistem delivery, semakin tinggi trust client, semakin mudah mempertahankan project dan membuka peluang kerja lanjutan."
        }
      ],
      "speaker_notes": "Ini slide emosional bisnis. Hubungkan fitur teknis dengan outcome: trust, confidence, dan repeat project.",
      "visual_direction": "Gunakan before-after: manual update vs command center."
    },
    {
      "id": 23,
      "section": "Demo",
      "title": "Demo Flow Yang Bisa Dipresentasikan Ke Client",
      "subtitle": "Alur demo dirancang agar client melihat manfaat dari awal sampai akhir dalam waktu singkat.",
      "content_blocks": [
        {
          "type": "demo_script",
          "steps": [
            "Login ke aplikasi dan buka Dashboard Utama.",
            "Tunjukkan metric project aktif, task, overdue, risk, dan workload team.",
            "Buka Katalog Proyek dan pilih project aktif.",
            "Tunjukkan overview project: progress, health, risk score, timeline, dan client name.",
            "Buka Kanban Board dan update satu task status.",
            "Tunjukkan progress/health terupdate dan activity log mencatat aksi.",
            "Buka AI Assistant dan jalankan risk analysis.",
            "Gunakan Conversational Project Data Query untuk bertanya jumlah task atau membuat task baru.",
            "Buka Team Workspace dan jelaskan role/access.",
            "Buka Integrasi Sistem dan jelaskan Telegram/Gmail/Discord.",
            "Buka Laporan Eksekutif dan tunjukkan report preview.",
            "Tutup dengan Activity Log sebagai bukti audit end-to-end."
          ]
        }
      ],
      "speaker_notes": "Gunakan demo flow ini untuk menjaga presentasi tetap rapi. Jangan lompat-lompat fitur. Ikuti alur dari dashboard ke project, AI, integrasi, report, dan audit.",
      "visual_direction": "Checklist demo dengan nomor besar 1 sampai 12."
    },
    {
      "id": 24,
      "section": "Differentiation",
      "title": "Kenapa Produk Ini Menonjol",
      "subtitle": "Bukan hanya karena fiturnya banyak, tetapi karena fiturnya saling terhubung dalam workflow yang masuk akal.",
      "content_blocks": [
        {
          "type": "differentiators",
          "items": [
            "AI bukan tempelan, tetapi membaca data project dan dapat menjalankan action.",
            "Supabase menjadi single source of truth untuk workspace, project, task, team, report, dan logs.",
            "Integrasi third-party membuat update tidak terkurung di aplikasi.",
            "Role dan membership membuat akses lebih aman.",
            "Activity log memberi audit trail yang jelas.",
            "Report membuat komunikasi client lebih professional.",
            "My Work membantu eksekusi personal, bukan hanya monitoring manager.",
            "Dashboard memberi visibility untuk founder, PM, dan stakeholder."
          ]
        },
        {
          "type": "positioning",
          "body": "Produk ini berada di antara project management, AI operations assistant, dan client communication system."
        }
      ],
      "speaker_notes": "Gunakan slide ini untuk membedakan produk dari Trello sederhana atau spreadsheet. Kekuatan utamanya adalah integrasi workflow.",
      "visual_direction": "Gunakan Venn diagram: Project Management, AI Operations, Client Communication."
    },
    {
      "id": 25,
      "section": "Business Value",
      "title": "Nilai Bisnis Yang Langsung Terasa",
      "subtitle": "Aplikasi ini membantu team bekerja lebih rapi dan membantu client merasa project dikendalikan secara profesional.",
      "content_blocks": [
        {
          "type": "business_outcomes",
          "items": [
            "Mengurangi waktu membuat laporan manual.",
            "Mengurangi risiko missed deadline karena overdue dan blocked task terlihat.",
            "Meningkatkan transparansi status project.",
            "Membuat komunikasi ke client lebih konsisten.",
            "Membantu founder atau manager mengambil keputusan lebih cepat.",
            "Membuat handover lebih mudah karena semua activity tercatat.",
            "Meningkatkan kualitas delivery dan trust client."
          ]
        },
        {
          "type": "roi_message",
          "heading": "ROI naratif",
          "body": "Jika project lebih cepat terdeteksi risikonya, report lebih cepat dibuat, dan komunikasi client lebih rapi, maka biaya koordinasi turun dan peluang closing atau repeat order naik."
        }
      ],
      "speaker_notes": "Jangan hanya menjual fitur. Jual outcome: efisiensi, kontrol, trust, dan repeat business.",
      "visual_direction": "Gunakan 4 KPI cards: Visibility, Speed, Trust, Control."
    },
    {
      "id": 26,
      "section": "Implementation Readiness",
      "title": "Kesiapan Implementasi",
      "subtitle": "Produk sudah memiliki fondasi teknis dan workflow yang cukup kuat untuk demo, pilot, dan pengembangan lanjutan.",
      "content_blocks": [
        {
          "type": "readiness_checklist",
          "items": [
            "Authentication dan workspace selection tersedia.",
            "Project CRUD dan project detail tersedia.",
            "Task, kanban, milestone, comments, attachments-ready flow tersedia.",
            "Dashboard, My Work, Team Workspace, Reports, Integrations, dan Activity tersedia.",
            "AI services tersedia untuk task generation, risk analysis, executive summary, daily focus, workspace advisor, dan project query.",
            "Supabase schema mendukung relational data antar workspace, project, task, member, activity, report, integration, dan notification logs.",
            "Build production Next.js berhasil.",
            "Demo seed tersedia untuk menjalankan presentasi dengan data realistis."
          ]
        }
      ],
      "speaker_notes": "Sampaikan bahwa aplikasi ini sudah bisa ditunjukkan sebagai working product. Untuk production, tinggal finalisasi konfigurasi, QA, deployment, dan hardening sesuai kebutuhan client.",
      "visual_direction": "Checklist readiness dengan status completed untuk modul utama."
    },
    {
      "id": 27,
      "section": "Future Roadmap",
      "title": "Roadmap Pengembangan Lanjutan",
      "subtitle": "Fondasi yang ada bisa dikembangkan menjadi produk SaaS yang lebih besar.",
      "content_blocks": [
        {
          "type": "roadmap",
          "items": [
            {
              "phase": "Phase 1: Production Hardening",
              "scope": "Final QA, error handling polish, deployment, domain, logging, backup, dan environment secret management."
            },
            {
              "phase": "Phase 2: Client Portal",
              "scope": "Portal khusus client untuk melihat progress, report, approval, dan feedback tanpa mengakses area internal."
            },
            {
              "phase": "Phase 3: Advanced AI Operations",
              "scope": "AI meeting summary, AI project estimation, AI capacity planning, dan proactive risk notification."
            },
            {
              "phase": "Phase 4: Billing & SaaS Model",
              "scope": "Subscription plan, organization billing, usage quota, dan multi-tenant management."
            },
            {
              "phase": "Phase 5: Analytics & Forecasting",
              "scope": "Delivery performance dashboard, forecast delay, team velocity, dan client health score."
            }
          ]
        }
      ],
      "speaker_notes": "Roadmap membuat client melihat masa depan produk. Jangan terlalu teknis; gunakan bahasa growth dan business scalability.",
      "visual_direction": "Timeline 5 fase dari kiri ke kanan."
    },
    {
      "id": 28,
      "section": "Closing",
      "title": "Kesimpulan: Sistem Ini Siap Menjadi Pusat Kendali Project",
      "subtitle": "Project Management Command Center memberi client visibility, control, AI assistance, report, integration, dan audit dalam satu platform.",
      "content_blocks": [
        {
          "type": "summary_points",
          "items": [
            "Satu sumber data utama melalui Supabase.",
            "Workflow project lengkap dari planning sampai reporting.",
            "AI membantu analisis, rekomendasi, dan eksekusi task/project.",
            "Team management dan role menjaga akses tetap rapi.",
            "Integrasi Discord, Telegram, dan Gmail membuat komunikasi lebih cepat dan formal.",
            "Activity log memastikan setiap aksi penting bisa diaudit.",
            "Client mendapat pengalaman yang lebih transparan, profesional, dan meyakinkan."
          ]
        },
        {
          "type": "closing_statement",
          "body": "Dengan sistem ini, project tidak lagi dikelola berdasarkan ingatan dan chat yang tercecer. Project dikelola sebagai operasi yang terukur, terdokumentasi, dan siap dipresentasikan ke stakeholder kapan saja."
        }
      ],
      "speaker_notes": "Tutup dengan percaya diri. Tekankan bahwa produk ini membantu client bukan hanya melihat progress, tetapi merasa yakin bahwa delivery berada di bawah kontrol.",
      "visual_direction": "Gunakan final slide yang clean dengan tagline besar: From scattered work to controlled delivery."
    },
    {
      "id": 29,
      "section": "Appendix",
      "title": "Lampiran: Modul Dan Endpoint Utama",
      "subtitle": "Referensi teknis singkat untuk menunjukkan kelengkapan sistem.",
      "content_blocks": [
        {
          "type": "endpoint_groups",
          "items": [
            {
              "group": "Workspace",
              "examples": [
                "GET /api/workspaces",
                "POST /api/workspaces",
                "GET /api/workspaces/[workspaceId]",
                "GET /api/workspaces/[workspaceId]/role"
              ]
            },
            {
              "group": "Project",
              "examples": [
                "GET /api/workspaces/[workspaceId]/projects",
                "POST /api/workspaces/[workspaceId]/projects",
                "GET /api/projects/[projectId]",
                "PATCH /api/projects/[projectId]",
                "DELETE /api/projects/[projectId]"
              ]
            },
            {
              "group": "Task And Kanban",
              "examples": [
                "GET /api/projects/[projectId]/tasks",
                "POST /api/projects/[projectId]/tasks",
                "PATCH /api/tasks/[taskId]",
                "PATCH /api/tasks/[taskId]/status",
                "POST /api/kanban/tasks/[taskId]/move"
              ]
            },
            {
              "group": "AI",
              "examples": [
                "POST /api/ai/generate-tasks",
                "POST /api/ai/risk-analysis",
                "POST /api/ai/executive-summary",
                "POST /api/ai/daily-focus",
                "POST /api/ai/workspace-advisor",
                "POST /api/ai/project-query"
              ]
            },
            {
              "group": "Integrations And Reports",
              "examples": [
                "POST /api/integrations/discord",
                "POST /api/integrations/telegram",
                "POST /api/integrations/gmail/test",
                "GET /api/workspaces/[workspaceId]/notification-logs",
                "GET /api/workspaces/[workspaceId]/reports",
                "POST /api/reports/[reportId]/send-gmail"
              ]
            }
          ]
        }
      ],
      "speaker_notes": "Appendix ini opsional untuk client teknis. Bisa dilewati saat presentasi bisnis, tetapi berguna jika client bertanya apakah sistemnya benar-benar punya API lengkap.",
      "visual_direction": "Gunakan technical appendix table dengan group dan endpoint examples."
    },
    {
      "id": 30,
      "section": "Appendix",
      "title": "Lampiran: Data Entity Utama",
      "subtitle": "Struktur data inti yang membuat sistem bisa berjalan end-to-end.",
      "content_blocks": [
        {
          "type": "entity_list",
          "items": [
            {
              "entity": "profiles",
              "purpose": "Menyimpan identitas user seperti full name, avatar, job title, dan timezone."
            },
            {
              "entity": "workspaces",
              "purpose": "Container organisasi atau client account."
            },
            {
              "entity": "workspace_members",
              "purpose": "Menghubungkan user ke workspace dengan role dan status."
            },
            {
              "entity": "projects",
              "purpose": "Data utama project, client, status, progress, health, dan risk."
            },
            {
              "entity": "project_members",
              "purpose": "Menghubungkan user ke project tertentu."
            },
            {
              "entity": "milestones",
              "purpose": "Fase kerja project."
            },
            {
              "entity": "tasks",
              "purpose": "Unit eksekusi harian yang bisa diassign dan dipantau."
            },
            {
              "entity": "task_comments",
              "purpose": "Kolaborasi dan diskusi task."
            },
            {
              "entity": "task_attachments",
              "purpose": "Dokumen atau file pendukung task."
            },
            {
              "entity": "activity_logs",
              "purpose": "Audit trail untuk semua aksi penting."
            },
            {
              "entity": "ai_generations",
              "purpose": "Riwayat output AI dan status generasi."
            },
            {
              "entity": "reports",
              "purpose": "Executive/client/internal report."
            },
            {
              "entity": "integration_settings",
              "purpose": "Konfigurasi provider seperti Discord, Telegram, Gmail."
            },
            {
              "entity": "notification_logs",
              "purpose": "Riwayat pengiriman notifikasi dan statusnya."
            }
          ]
        }
      ],
      "speaker_notes": "Gunakan appendix ini hanya jika client ingin melihat kedalaman database. Ini menunjukkan fondasi produk bukan asal UI.",
      "visual_direction": "Gunakan entity relationship style atau clean table."
    }
  ],
  "closing_message_for_presenter": "Arahkan presentasi pada outcome: project lebih terkendali, komunikasi lebih profesional, risiko lebih cepat terlihat, dan client lebih percaya. Jangan terlalu lama di detail teknis kecuali client memang meminta. Gunakan demo nyata untuk membuktikan fitur AI, activity log, team management, integrations, dan reports."
}
