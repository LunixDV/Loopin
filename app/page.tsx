"use client";

import { useActionState, useRef, useState } from "react";

import { ingestEvents } from "./actions";
import type { AppState } from "@/lib/event-types";

const initialState: AppState = {
  status: "idle",
  message: "Drop images or paste notes to extract events.",
  summary: "",
  timezone: "UTC",
  extractedEvents: [],
  syncedEvents: [],
};

export default function Home() {
  const [state, formAction, pending] = useActionState(ingestEvents, initialState);
  const [files, setFiles] = useState<File[]>([]);
  const [showSettings, setShowSettings] = useState(false);
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    syncFiles(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/")));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    syncFiles(Array.from(event.currentTarget.files ?? []));
  };

  const removeFile = (indexToRemove: number) => {
    syncFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-600">
      {/* Clean, professional background dot pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

      <form action={formAction} className="relative mx-auto max-w-4xl w-full min-h-screen px-4 py-4 sm:px-6 flex flex-col justify-between">
        {/* Top & Content container */}
        <div className="flex-1 flex flex-col">
          {/* Header / Top Bar */}
          <header className="relative flex items-center justify-between pb-6 pt-4 border-b border-slate-200/50">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-blue-600">loopin</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                v1.0
              </span>
            </div>

            {/* Connector Button in the Corner */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 active:scale-95 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-plug"
                >
                  <path d="M12 2v8" />
                  <path d="M16.2 9.5 12 14 7.8 9.5" />
                  <path d="m18 12-2.5 7.5a2 2 0 0 1-2 1.5h-3a2 2 0 0 1-2-1.5L6 12" />
                  <path d="M12 22v-3" />
                </svg>
                <span>Connect</span>
              </button>

              {showSettings && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800 text-sm">Google Calendar Setup</h3>
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Timezone</label>
                      <input
                        name="timezone"
                        defaultValue={state.timezone || "UTC"}
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. America/New_York"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Calendar ID</label>
                      <input
                        name="calendarId"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="primary or custom ID"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Access Token</label>
                      <input
                        name="googleAccessToken"
                        type="password"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="OAuth Access Token"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Clean, clear top/middle area */}
          <div className="flex-1 flex flex-col py-8 justify-center min-h-[300px]">
            {state.status === "idle" ? (
              <div className="text-center space-y-4 py-12 max-w-md mx-auto">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" x2="16" y1="2" y2="6"/>
                    <line x1="8" x2="8" y1="2" y2="6"/>
                    <line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sync events in seconds</h1>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {state.message || "Drop calendar images or paste notes at the bottom to instantly extract and sync events."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-8">
                {/* Status Alert */}
                <div
                  className={`rounded-xl border p-4 flex gap-3 text-sm ${
                    state.status === "success"
                      ? "bg-blue-50 border-blue-200/60 text-blue-800"
                      : "bg-red-50 border-red-200/60 text-red-800"
                  }`}
                >
                  {state.status === "success" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600 flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-600 flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{state.status === "success" ? "Events Extracted Successfully" : "Error Occurred"}</p>
                    <p className="text-slate-600 text-xs leading-relaxed">{state.message}</p>
                  </div>
                </div>

                {/* Extracted Events */}
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Extracted Events</h2>
                  {state.extractedEvents.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {state.extractedEvents.map((event) => (
                        <article
                          key={`${event.title}-${event.start}`}
                          className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm transition hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-bold text-slate-800 text-[15px]">{event.title}</h3>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                              {Math.round(event.confidence * 100)}% Match
                            </span>
                          </div>
                          
                          <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                              <span>{event.start}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                            {event.notes && (
                              <p className="mt-2 text-slate-500 leading-normal border-t border-slate-100 pt-2 text-[11px]">
                                {event.notes}
                              </p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                      No events found in input.
                    </div>
                  )}
                </div>

                {/* Synced Events */}
                {state.syncedEvents.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Synced to Google Calendar</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {state.syncedEvents.map((event) => (
                        <article
                          key={`${event.title}-${event.start}`}
                          className="rounded-xl border border-blue-200 bg-blue-50/40 p-4.5"
                        >
                          <h3 className="font-bold text-slate-800 text-[15px]">{event.title}</h3>
                          <p className="mt-1 text-xs text-slate-600">{event.start}</p>
                          {event.htmlLink && (
                            <a
                              href={event.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <span>Open Calendar</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                            </a>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Input Area */}
        <div className="pb-6 pt-4 sticky bottom-0 bg-slate-50/85 backdrop-blur-md z-40 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <section
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="relative rounded-2xl border border-slate-200 bg-white p-2.5 shadow-md transition-all hover:border-blue-200 hover:shadow-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
            >
              <textarea
                name="sourceText"
                rows={4}
                className="w-full resize-none border-0 bg-transparent px-3.5 py-3 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none ring-0 focus:outline-none focus:ring-0"
                placeholder="Paste raw event details here, or drop image files anywhere on this box..."
              />

              {/* Files Selected Row */}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 px-3 pb-3">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}-${file.lastModified}`}
                      className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 py-1 pl-3 pr-2 text-xs font-medium text-blue-600"
                    >
                      <span className="max-w-40 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="rounded-full p-0.5 hover:bg-blue-100 text-blue-500 hover:text-blue-700 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Row */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 px-1.5">
                <div className="flex items-center gap-1">
                  <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-blue-600">
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-image"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2.18" ry="2.18" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </label>
                  <span className="text-xs text-slate-400 hidden sm:inline">Up to 3 images</span>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {pending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <span>Extract & Sync</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </main>
  );
}

