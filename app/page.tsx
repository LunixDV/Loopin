"use client";

import { useActionState, useRef, useState } from "react";

import { ingestEvents } from "./actions";
import type { AppState } from "@/lib/event-types";

const initialState: AppState = {
  status: "idle",
  message: "Drop screenshots, flyers, or notes to extract events.",
  summary: "",
  timezone: "UTC",
  extractedEvents: [],
  syncedEvents: [],
};

export default function Home() {
  const [state, formAction, pending] = useActionState(ingestEvents, initialState);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const syncFiles = (nextFiles: File[]) => {
    const limited = nextFiles.slice(0, 3);
    setFiles(limited);

    if (inputRef.current) {
      const transfer = new DataTransfer();
      limited.forEach((file) => transfer.items.add(file));
      inputRef.current.files = transfer.files;
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    syncFiles(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/")));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    syncFiles(Array.from(event.currentTarget.files ?? []));
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#07111f]/90 shadow-[0_30px_120px_rgba(3,8,20,0.45)] backdrop-blur">
        <div className="grid flex-1 gap-0 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="relative overflow-hidden border-b border-white/10 px-6 py-8 sm:px-10 sm:py-10 lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(47,103,255,0.2),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(0,255,209,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
            <div className="relative flex h-full flex-col gap-8">
              <div className="max-w-2xl space-y-4">
                <p className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  Loopin planner
                </p>
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Turn messy notes, flyers, and screenshots into calendar events.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  A simple, free, OSS Next app that sends your uploads to Groq for extraction, then pushes the structured events into a Google Calendar you control.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["1", "Drop screenshots or paste text"],
                  ["2", "Groq extracts event details"],
                  ["3", "Syncs to your connected calendar"],
                ].map(([step, label]) => (
                  <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-cyan-200">Step {step}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-300">{label}</div>
                  </div>
                ))}
              </div>

              <form action={formAction} className="space-y-6">
                <label
                  htmlFor="images"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="group block cursor-pointer rounded-[28px] border border-dashed border-cyan-300/25 bg-white/5 p-6 transition hover:border-cyan-200/60 hover:bg-white/[0.07]"
                >
                  <input
                    ref={inputRef}
                    id="images"
                    name="images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-medium text-white">Drop images here</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Flyers, screenshots, whiteboards, receipts, or event posters. Up to 3 files.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-medium text-slate-200">
                      Choose files
                    </span>
                  </div>
                  {files.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {files.map((file) => (
                        <span
                          key={`${file.name}-${file.lastModified}`}
                          className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300"
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">Timezone</span>
                    <input
                      name="timezone"
                      defaultValue="UTC"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-300/60"
                      placeholder="America/New_York"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">Google Calendar ID</span>
                    <input
                      name="calendarId"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-300/60"
                      placeholder="primary or your-calendar-id@group.calendar.google.com"
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Paste notes or raw event text</span>
                  <textarea
                    name="sourceText"
                    rows={10}
                    className="min-h-56 w-full rounded-[28px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-300/60"
                    placeholder="Example: Team offsite on Thursday at 2pm in Melbourne, dinner at 7:30pm, and a design review next Tuesday morning."
                  />
                </label>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Google sync</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Connect your calendar</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Paste a calendar ID and access token if you want the extracted events written straight to Google Calendar.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={pending}
                      className="h-12 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pending ? "Processing..." : "Extract & sync"}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-200">Calendar ID</span>
                      <input
                        name="calendarId"
                        className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-300/60"
                        placeholder="primary or your-calendar-id@group.calendar.google.com"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-200">Access token</span>
                      <input
                        name="googleAccessToken"
                        type="password"
                        className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-300/60"
                        placeholder="Optional if GOOGLE_CALENDAR_ACCESS_TOKEN is set"
                      />
                    </label>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    This keeps the setup free and OSS-friendly: users can bring their own Google credentials, or leave the fields blank to extract only.
                  </p>
                </div>
              </form>
            </div>
          </section>

          <aside className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Run status</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{state.status}</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-300">
                  {state.timezone || "UTC"}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{state.message}</p>
              {state.summary ? (
                <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
                  {state.summary}
                </p>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
              <h3 className="text-lg font-semibold text-white">Extracted events</h3>
              <div className="mt-4 space-y-3">
                {state.extractedEvents.length > 0 ? (
                  state.extractedEvents.map((event) => (
                    <article
                      key={`${event.title}-${event.start}`}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-medium text-white">{event.title}</h4>
                          <p className="mt-1 text-sm text-slate-400">{event.start}</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                          {Math.round(event.confidence * 100)}%
                        </span>
                      </div>
                      {event.location ? <p className="mt-3 text-sm text-slate-300">{event.location}</p> : null}
                      {event.notes ? <p className="mt-2 text-sm leading-6 text-slate-400">{event.notes}</p> : null}
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
                    No events yet. Submit a screenshot or note and the extracted schedule will appear here.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.04] p-6">
              <h3 className="text-lg font-semibold text-white">Synced events</h3>
              <div className="mt-4 space-y-3">
                {state.syncedEvents.length > 0 ? (
                  state.syncedEvents.map((event) => (
                    <article
                      key={`${event.title}-${event.start}`}
                      className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100"
                    >
                      <div className="font-medium text-white">{event.title}</div>
                      <div className="mt-1 text-emerald-100/80">{event.start}</div>
                      {event.htmlLink ? (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100 underline decoration-emerald-200/60 underline-offset-4"
                        >
                          Open in Google Calendar
                        </a>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
                    Synced events will show up here once a Google token and calendar ID are provided.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
