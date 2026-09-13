"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Loader2, Send } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, SkeletonRows } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { cx, isValidPhone } from "@/lib/format";

const CHANNELS = [
  { key: "emailEnabled", label: "Email", desc: "Outage and recovery emails." },
  { key: "whatsappEnabled", label: "WhatsApp", desc: "Fastest for on-call response." },
  { key: "smsEnabled", label: "SMS", desc: "Fallback when data is down." },
  { key: "callEnabled", label: "Voice call", desc: "Only for prolonged outages." },
];

function Switch({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-emerald-500" : "bg-zinc-300"
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

/** Mounted only after settings load, so useState initializers carry server values. */
function SettingsForm({ initial }) {
  const [form, setForm] = useState(() => ({
    emailEnabled: !!initial.emailEnabled,
    whatsappEnabled: initial.whatsappEnabled ?? true,
    smsEnabled: !!initial.smsEnabled,
    callEnabled: !!initial.callEnabled,
    language: initial.language || "en",
    cooldownMinutes: initial.cooldownMinutes ?? 15,
    onlyOnStatusChange: initial.onlyOnStatusChange ?? true,
  }));
  const [phones, setPhones] = useState(() =>
    Array.isArray(initial.phones) ? initial.phones.join(", ") : initial.phones || ""
  );
  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");
  const [testChannel, setTestChannel] = useState("whatsapp");
  const saveTimer = useRef(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validatePhones = (raw) => {
    const list = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return { list, bad: list.filter((p) => !isValidPhone(p)) };
  };

  const persist = async (nextForm, rawPhones, { silent = true } = {}) => {
    const { list, bad } = validatePhones(rawPhones);
    if (bad.length) {
      setPhoneError(`Invalid phone numbers: ${bad.join(", ")}. Use E.164, e.g. +15551234567.`);
      return false;
    }
    setPhoneError("");
    setSaving(true);
    try {
      await api.updateAlertSettings({ ...nextForm, phones: list });
      if (!silent) toast("Alert settings saved.");
      return true;
    } catch (err) {
      toast(err?.message || "Could not save settings.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save on toggle/slider/language change.
  const update = (patch) => {
    const next = { ...form, ...patch };
    set(patch);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(next, phones), 600);
  };

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const saveNow = () => persist(form, phones, { silent: false });

  const sendTest = async () => {
    setTesting(testChannel);
    try {
      await api.testAlert(testChannel);
      toast(`Test ${testChannel} alert sent.`);
    } catch (err) {
      toast(err?.message || "Test alert failed.", "error");
    } finally {
      setTesting("");
    }
  };

  return (
    <>
      <Card className="divide-y divide-zinc-100 p-0">
        <div className="flex items-center gap-3 px-5 py-4">
          <Bell className="h-4 w-4 text-zinc-400" />
          <p className="text-sm font-semibold">Channels</p>
          {saving ? (
            <span className="ml-auto text-xs tabular-nums text-zinc-400">Saving…</span>
          ) : null}
        </div>
        {CHANNELS.map((c) => (
          <div key={c.key} className="flex items-center gap-3 px-5 py-3.5">
            <Switch on={form[c.key]} onChange={(v) => update({ [c.key]: v })} label={c.label} />
            <div>
              <p className="text-sm font-medium text-zinc-900">{c.label}</p>
              <p className="text-xs text-zinc-500">{c.desc}</p>
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Language</label>
          <select
            value={form.language}
            onChange={(e) => update({ language: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="hi">Hindi</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Phone numbers <span className="font-normal text-zinc-500">(comma-separated, E.164)</span>
          </label>
          <input
            value={phones}
            onChange={(e) => setPhones(e.target.value)}
            placeholder="+15551234567, +15557654321"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-500 focus:outline-none"
          />
          {phoneError ? <p className="mt-1 text-xs text-rose-600">{phoneError}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium tabular-nums text-zinc-700">
            Cooldown: {form.cooldownMinutes} min
          </label>
          <input
            type="range"
            min={1}
            max={120}
            value={form.cooldownMinutes}
            onChange={(e) => update({ cooldownMinutes: Number(e.target.value) })}
            className="w-full accent-zinc-950"
          />
          <p className="text-xs text-zinc-500">No repeat alerts for the same outage within this window.</p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            on={form.onlyOnStatusChange}
            onChange={(v) => update({ onlyOnStatusChange: v })}
            label="Only on status change"
          />
          <div>
            <p className="text-sm font-medium text-zinc-900">Only on status change</p>
            <p className="text-xs text-zinc-500">Skip repeat alerts while a site stays down.</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={saveNow}
          disabled={saving}
          className={cx(
            "inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800",
            saving && "opacity-70"
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save settings
        </motion.button>
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold">Test alert</p>
        <p className="mt-0.5 text-xs text-zinc-500">Sends a test message on the chosen channel.</p>
        <div className="mt-3 flex gap-2">
          <select
            value={testChannel}
            onChange={(e) => setTestChannel(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="call">Voice call</option>
          </select>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={sendTest}
            disabled={!!testing}
            className={cx(
              "inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50",
              testing && "opacity-70"
            )}
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {testing ? "Sending…" : "Send test"}
          </motion.button>
        </div>
      </Card>
    </>
  );
}

export default function AlertSettingsPage() {
  const { data, loading, error, retry } = useApi(() => api.getAlertSettings());
  const initial = data ? data.settings || data : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Alert settings</h1>
          <p className="text-sm text-zinc-500">Channels, escalation numbers and spam protection.</p>
        </div>

        {loading && !initial ? (
          <SkeletonRows rows={6} />
        ) : error && !initial ? (
          <ErrorState message={error.message} onRetry={retry} />
        ) : initial ? (
          <SettingsForm key="alert-settings" initial={initial} />
        ) : null}
      </div>
    </AppShell>
  );
}
