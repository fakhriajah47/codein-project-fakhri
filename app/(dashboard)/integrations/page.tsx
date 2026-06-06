"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalAlert } from "@/components/ui/brutal-alert";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Settings2, Link2Off } from "lucide-react";

interface IntegrationConfig {
  webhookUrl?: string;
  botToken?: string;
  chatId?: string;
  connectedEmail?: string;
}

interface IntegrationSetting {
  provider: string;
  is_enabled: boolean;
  config: IntegrationConfig;
}

export default function IntegrationsPage() {
  const { activeWorkspace, workspaceRole } = useWorkspace();

  const [settings, setSettings] = useState<IntegrationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  // Loading states per button
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionMessage, setActionMessage] = useState<Record<string, { text: string; type: "success" | "danger" }>>({});

  const isEditable = workspaceRole && ["owner", "manager"].includes(workspaceRole);

  const fetchIntegrations = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/integrations`);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setError(resData.message || "Gagal memuat pengaturan integrasi.");
        setLoading(false);
        return;
      }

      const list: IntegrationSetting[] = resData.data;
      setSettings(list);

      // Prepopulate
      const discord = list.find((s) => s.provider === "discord");
      if (discord && discord.config?.webhookUrl) {
        setDiscordWebhook(discord.config.webhookUrl);
      } else {
        setDiscordWebhook("");
      }

      const telegram = list.find((s) => s.provider === "telegram");
      if (telegram && telegram.config?.botToken) {
        setTelegramToken(telegram.config.botToken);
        setTelegramChatId(telegram.config.chatId || "");
      } else {
        setTelegramToken("");
        setTelegramChatId("");
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [activeWorkspace]);

  const setButtonLoading = (key: string, val: boolean) => {
    setActionLoading((prev) => ({ ...prev, [key]: val }));
  };

  const setButtonMessage = (key: string, text: string, type: "success" | "danger") => {
    setActionMessage((prev) => ({ ...prev, [key]: { text, type } }));
    // Clear message after 5 seconds
    setTimeout(() => {
      setActionMessage((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }, 5000);
  };

  const handleSaveDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setButtonLoading("discord_save", true);

    try {
      const response = await fetch(`/api/integrations/discord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          webhookUrl: discordWebhook,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setButtonMessage("discord_save", resData.message || "Gagal menyimpan integrasi Discord.", "danger");
      } else {
        setButtonMessage("discord_save", "Pengaturan Discord berhasil disimpan!", "success");
        fetchIntegrations();
      }
    } catch (err: any) {
      setButtonMessage("discord_save", err?.message || "Koneksi gagal.", "danger");
    } finally {
      setButtonLoading("discord_save", false);
    }
  };

  const handleTestDiscord = async () => {
    if (!activeWorkspace) return;
    setButtonLoading("discord_test", true);

    try {
      const response = await fetch(`/api/integrations/discord/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          webhookUrl: discordWebhook,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setButtonMessage("discord_test", resData.message || "Uji coba Discord gagal.", "danger");
      } else {
        setButtonMessage("discord_test", "Uji coba webhook berhasil dikirim ke Discord!", "success");
      }
    } catch (err: any) {
      setButtonMessage("discord_test", err?.message || "Uji coba gagal.", "danger");
    } finally {
      setButtonLoading("discord_test", false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setButtonLoading("telegram_save", true);

    try {
      const response = await fetch(`/api/integrations/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          botToken: telegramToken,
          chatId: telegramChatId,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setButtonMessage("telegram_save", resData.message || "Gagal menyimpan integrasi Telegram.", "danger");
      } else {
        setButtonMessage("telegram_save", "Pengaturan Telegram berhasil disimpan!", "success");
        fetchIntegrations();
      }
    } catch (err: any) {
      setButtonMessage("telegram_save", err?.message || "Koneksi gagal.", "danger");
    } finally {
      setButtonLoading("telegram_save", false);
    }
  };

  const handleTestTelegram = async () => {
    if (!activeWorkspace) return;
    setButtonLoading("telegram_test", true);

    try {
      const response = await fetch(`/api/integrations/telegram/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          botToken: telegramToken,
          chatId: telegramChatId,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setButtonMessage("telegram_test", resData.message || "Uji coba Telegram gagal.", "danger");
      } else {
        setButtonMessage("telegram_test", "Pesan uji coba bot Telegram berhasil dikirim!", "success");
      }
    } catch (err: any) {
      setButtonMessage("telegram_test", err?.message || "Uji coba gagal.", "danger");
    } finally {
      setButtonLoading("telegram_test", false);
    }
  };

  const handleConnectGmail = async () => {
    if (!activeWorkspace) return;
    setButtonLoading("gmail_connect", true);

    try {
      const response = await fetch(`/api/integrations/gmail/auth-url?workspaceId=${activeWorkspace.id}`);

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setButtonMessage("gmail_connect", resData.message || "Koneksi Gmail gagal.", "danger");
      } else {
        window.location.href = resData.data.authUrl;
      }
    } catch (err: any) {
      setButtonMessage("gmail_connect", err?.message || "Inisiasi OAuth gagal.", "danger");
    } finally {
      setButtonLoading("gmail_connect", false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!activeWorkspace) return;
    if (!confirm(`Apakah Anda yakin ingin memutuskan integrasi ${provider}?`)) return;

    setButtonLoading(`${provider}_disconnect`, true);
    try {
      const response = await fetch(`/api/integrations/${provider}?workspaceId=${activeWorkspace.id}`, {
        method: "DELETE",
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        alert(resData.message || "Gagal memutuskan integrasi.");
      } else {
        alert("Pengaturan integrasi berhasil dihapus.");
        fetchIntegrations();
      }
    } catch (err: any) {
      alert(err?.message || "Gagal terhubung ke server.");
    } finally {
      setButtonLoading(`${provider}_disconnect`, false);
    }
  };

  if (!activeWorkspace) {
    return (
      <EmptyState
        title="Tidak Ada Ruang Kerja yang Terpilih"
        description="Silakan pilih atau ganti ke ruang kerja aktif pada bar navigasi atas untuk mengonfigurasi integrasi notifikasi pihak ketiga."
      />
    );
  }

  if (loading && settings.length === 0) {
    return <LoadingState message="Memeriksa status integrasi..." />;
  }

  if (error) {
    return <ErrorState title="Gagal Memuat Integrasi" description={error} />;
  }

  const isDiscordConnected = settings.some((s) => s.provider === "discord" && s.is_enabled);
  const isTelegramConnected = settings.some((s) => s.provider === "telegram" && s.is_enabled);
  const gmailSetting = settings.find((s) => s.provider === "gmail" && s.is_enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black flex items-center gap-2">
          <Settings2 size={28} className="text-brutal-blue" />
          Integrasi Sistem
        </h1>
        <p className="text-gray-600 font-bold">
          Hubungkan ruang kerja Anda dengan Discord, Telegram, dan Gmail untuk mengaktifkan notifikasi dan laporan otomatis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Discord Card */}
        <BrutalCard className="bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b-2 border-dashed border-gray-200 pb-2 mb-2">
              <div>
                <h3 className="text-lg font-black text-brutal-black">Discord Webhook</h3>
                <p className="text-xs font-bold text-gray-500">Untuk log aktivitas tim internal</p>
              </div>
              <span
                className={`text-[9px] font-black uppercase border border-brutal-black px-2 py-0.5 rounded ${
                  isDiscordConnected ? "bg-brutal-mint" : "bg-gray-100"
                }`}
              >
                {isDiscordConnected ? "Aktif" : "Terputus"}
              </span>
            </div>

            {actionMessage.discord_save && (
              <BrutalAlert variant={actionMessage.discord_save.type}>
                {actionMessage.discord_save.text}
              </BrutalAlert>
            )}
            {actionMessage.discord_test && (
              <BrutalAlert variant={actionMessage.discord_test.type}>
                {actionMessage.discord_test.text}
              </BrutalAlert>
            )}

            <form onSubmit={handleSaveDiscord} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Webhook URL</label>
                <BrutalInput
                  type="text"
                  required
                  disabled={!isEditable}
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                />
              </div>

              {isEditable && (
                <BrutalButton
                  type="submit"
                  variant="primary"
                  className="w-full font-black uppercase py-2"
                  isLoading={actionLoading.discord_save}
                >
                  Simpan Pengaturan
                </BrutalButton>
              )}
            </form>
          </div>

          <div className="mt-6 border-t-2 border-dashed border-gray-200 pt-4 flex gap-2">
            <BrutalButton
              onClick={handleTestDiscord}
              variant="secondary"
              className="flex-1 uppercase font-black py-1.5 text-xs"
              isLoading={actionLoading.discord_test}
            >
              Uji Coba
            </BrutalButton>
            {isDiscordConnected && isEditable && (
              <BrutalButton
                onClick={() => handleDisconnect("discord")}
                variant="danger"
                className="shrink-0 py-1.5 px-2 bg-brutal-coral text-white"
                isLoading={actionLoading.discord_disconnect}
              >
                <Link2Off size={16} />
              </BrutalButton>
            )}
          </div>
        </BrutalCard>

        {/* Telegram Card */}
        <BrutalCard className="bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b-2 border-dashed border-gray-200 pb-2 mb-2">
              <div>
                <h3 className="text-lg font-black text-brutal-black">Bot Telegram</h3>
                <p className="text-xs font-bold text-gray-500">Untuk notifikasi risiko proyek penting</p>
              </div>
              <span
                className={`text-[9px] font-black uppercase border border-brutal-black px-2 py-0.5 rounded ${
                  isTelegramConnected ? "bg-brutal-mint" : "bg-gray-100"
                }`}
              >
                {isTelegramConnected ? "Aktif" : "Terputus"}
              </span>
            </div>

            {actionMessage.telegram_save && (
              <BrutalAlert variant={actionMessage.telegram_save.type}>
                {actionMessage.telegram_save.text}
              </BrutalAlert>
            )}
            {actionMessage.telegram_test && (
              <BrutalAlert variant={actionMessage.telegram_test.type}>
                {actionMessage.telegram_test.text}
              </BrutalAlert>
            )}

            <form onSubmit={handleSaveTelegram} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Bot Token</label>
                <BrutalInput
                  type="text"
                  required
                  disabled={!isEditable}
                  placeholder="Contoh: 123456789:ABCdefGhI..."
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Chat ID</label>
                <BrutalInput
                  type="text"
                  required
                  disabled={!isEditable}
                  placeholder="Contoh: -100123456789 atau 98765432"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                />
              </div>

              {isEditable && (
                <BrutalButton
                  type="submit"
                  variant="primary"
                  className="w-full font-black uppercase py-2"
                  isLoading={actionLoading.telegram_save}
                >
                  Simpan Pengaturan
                </BrutalButton>
              )}
            </form>
          </div>

          <div className="mt-6 border-t-2 border-dashed border-gray-200 pt-4 flex gap-2">
            <BrutalButton
              onClick={handleTestTelegram}
              variant="secondary"
              className="flex-1 uppercase font-black py-1.5 text-xs"
              isLoading={actionLoading.telegram_test}
            >
              Uji Coba
            </BrutalButton>
            {isTelegramConnected && isEditable && (
              <BrutalButton
                onClick={() => handleDisconnect("telegram")}
                variant="danger"
                className="shrink-0 py-1.5 px-2 bg-brutal-coral text-white"
                isLoading={actionLoading.telegram_disconnect}
              >
                <Link2Off size={16} />
              </BrutalButton>
            )}
          </div>
        </BrutalCard>

        {/* Gmail Card */}
        <BrutalCard className="bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b-2 border-dashed border-gray-200 pb-2 mb-2">
              <div>
                <h3 className="text-lg font-black text-brutal-black">Laporan Gmail</h3>
                <p className="text-xs font-bold text-gray-500">Untuk mengirimkan laporan ringkasan eksekutif</p>
              </div>
              <span
                className={`text-[9px] font-black uppercase border border-brutal-black px-2 py-0.5 rounded ${
                  gmailSetting ? "bg-brutal-mint" : "bg-gray-100"
                }`}
              >
                {gmailSetting ? "Terhubung" : "Terputus"}
              </span>
            </div>

            {actionMessage.gmail_connect && (
              <BrutalAlert variant={actionMessage.gmail_connect.type}>
                {actionMessage.gmail_connect.text}
              </BrutalAlert>
            )}

            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-600 leading-normal">
                Menghubungkan Gmail memungkinkan sistem untuk membuat draf, melihat pratinjau, dan mengirimkan laporan ringkasan proyek secara otomatis ke email klien atau pemangku kepentingan.
              </p>
              {gmailSetting && (
                <div className="p-3 bg-gray-50 border border-brutal-black rounded-lg text-xs font-mono font-bold text-gray-500">
                  Akun Terhubung: {gmailSetting.config?.connectedEmail || "Siap"}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t-2 border-dashed border-gray-200 pt-4 flex gap-2">
            {!gmailSetting ? (
              <BrutalButton
                onClick={handleConnectGmail}
                variant="primary"
                className="w-full uppercase font-black py-2 text-xs"
                isLoading={actionLoading.gmail_connect}
              >
                Hubungkan Akun Gmail
              </BrutalButton>
            ) : (
              isEditable && (
                <BrutalButton
                  onClick={() => handleDisconnect("gmail")}
                  variant="danger"
                  className="w-full uppercase font-black py-2 text-xs"
                  isLoading={actionLoading.gmail_disconnect}
                >
                  Putuskan Sambungan
                </BrutalButton>
              )
            )}
          </div>
        </BrutalCard>
      </div>
    </div>
  );
}
