"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { ingestEvents } from "./actions";
import type { AppState } from "@/lib/event-types";
import ConstellationBg from "./components/constellation-bg";

const initialState: AppState = {
  status: "idle",
  message: "Drop images or paste notes to extract events.",
  summary: "",
  timezone: "UTC",
  extractedEvents: [],
  syncedEvents: [],
};

export default function Home() {
  const [state, formAction, pending] = useActionState(
    ingestEvents,
    initialState,
  );
  const [files, setFiles] = useState<File[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [tier, setTier] = useState<"free" | "paid">("free");
  const [hasInputText, setHasInputText] = useState(false);

  const [groqKey, setGroqKey] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [calendarId, setCalendarId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const [typedTitle, setTypedTitle] = useState("");
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const titleText = "Sync events in seconds";
  const subtitleText = "Drop images or paste notes to extract events.";

  const inputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const filesRef = useRef<File[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGroqKey(localStorage.getItem("loopin_groq_key") || "");
      setTimezone(localStorage.getItem("loopin_timezone") || "UTC");
      setCalendarId(localStorage.getItem("loopin_calendar_id") || "primary");
      setAccessToken(localStorage.getItem("loopin_access_token") || "");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) =>
          console.error("Service worker registration failed:", err),
        );
    }

    const hasTyped = sessionStorage.getItem("loopin_typed");
    if (hasTyped) {
      const timer = setTimeout(() => {
        setTypedTitle(titleText);
        setTypedSubtitle(subtitleText);
      }, 0);
      return () => clearTimeout(timer);
    }

    let titleIndex = 0;
    let subtitleIndex = 0;
    let titleTimeout: ReturnType<typeof setTimeout>;
    let subtitleTimeout: ReturnType<typeof setTimeout>;

    function typeTitle() {
      if (titleIndex < titleText.length) {
        setTypedTitle(titleText.slice(0, titleIndex + 1));
        titleIndex++;
        titleTimeout = setTimeout(typeTitle, 45);
      } else {
        typeSubtitle();
      }
    }

    function typeSubtitle() {
      if (subtitleIndex < subtitleText.length) {
        setTypedSubtitle(subtitleText.slice(0, subtitleIndex + 1));
        subtitleIndex++;
        subtitleTimeout = setTimeout(typeSubtitle, 25);
      } else {
        sessionStorage.setItem("loopin_typed", "true");
      }
    }

    const startTimer = setTimeout(typeTitle, 0);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(titleTimeout);
      clearTimeout(subtitleTimeout);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showSettings &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSettings(false);
        setShowInfoModal(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const syncFiles = (nextFiles: File[]) => {
    const limited = nextFiles.slice(0, 3);
    setFiles(limited);
    filesRef.current = limited;

    if (inputRef.current) {
      const transfer = new DataTransfer();
      limited.forEach((file) => transfer.items.add(file));
      inputRef.current.files = transfer.files;
    }
  };

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;

      const pastedImages: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) pastedImages.push(file);
        }
      }

      if (pastedImages.length > 0) {
        event.preventDefault();
        syncFiles([...filesRef.current, ...pastedImages]);
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    syncFiles(
      Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      ),
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    syncFiles(Array.from(event.currentTarget.files ?? []));
  };

  const removeFile = (indexToRemove: number) => {
    syncFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  const isTransitioned =
    state.status !== "idle" || pending || files.length > 0 || hasInputText;

  return (
    <main className="relative min-h-dvh flex flex-col bg-background text-foreground antialiased selection:bg-indigo-500/20 selection:text-indigo-200 overflow-x-hidden">
      <ConstellationBg />

      {/* Clean, professional background dot pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 z-0" />

      <form
        action={formAction}
        className="relative mx-auto max-w-4xl w-full min-h-dvh px-4 py-4 sm:px-6 flex flex-col justify-between z-10"
      >
        {/* Top & Content container */}
        <div className="flex-1 flex flex-col">
          {/* Header / Top Bar */}
          <header className="relative flex items-center justify-between pb-6 pt-4 border-b border-card-border">
            <div className="flex items-center gap-2 font-display">
              <span className="text-2xl font-bold tracking-tight text-indigo-400">
                loopin
              </span>
              <span className="rounded-full bg-indigo-950/50 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
                v2.0.0
              </span>
            </div>

            {/* Connector Button in the Corner */}
            <div className="relative">
              <button
                ref={settingsButtonRef}
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 rounded-lg border border-card-border bg-card-bg px-3.5 py-2 text-sm font-medium text-slate-300 shadow-sm transition-all hover:bg-indigo-600/10 hover:text-indigo-400 active:scale-95 cursor-pointer"
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

              <div
                ref={settingsRef}
                className={`absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] sm:w-80 rounded-xl border border-card-border bg-slate-900/90 backdrop-blur-md p-5 shadow-xl transition-all duration-300 ${
                  showSettings
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {/* Title & Close */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-semibold text-slate-100 text-sm">
                    Connection Config
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
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
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tier Tabs */}
                <div className="flex bg-slate-950/80 border border-card-border rounded-lg p-1 mt-3.5 mb-4">
                  <button
                    type="button"
                    onClick={() => setTier("free")}
                    className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      tier === "free"
                        ? "bg-slate-900 text-indigo-400 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Free Tier
                  </button>
                  <button
                    type="button"
                    onClick={() => setTier("paid")}
                    className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      tier === "paid"
                        ? "bg-slate-900 text-indigo-400 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>Paid Tier</span>
                    <span className="bg-indigo-950 border border-indigo-500/20 text-indigo-400 text-[9px] px-1 rounded-full font-bold">
                      $5
                    </span>
                  </button>
                </div>

                {tier === "free" ? (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Groq API Key *
                      </label>
                      <input
                        name="groqApiKey"
                        type="password"
                        value={groqKey}
                        onChange={(e) => {
                          setGroqKey(e.target.value);
                          localStorage.setItem(
                            "loopin_groq_key",
                            e.target.value,
                          );
                        }}
                        className="w-full rounded-lg border border-card-border bg-slate-950/60 text-slate-100 placeholder:text-slate-500 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="gsk_..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Timezone
                      </label>
                      <input
                        name="timezone"
                        value={timezone}
                        onChange={(e) => {
                          setTimezone(e.target.value);
                          localStorage.setItem(
                            "loopin_timezone",
                            e.target.value,
                          );
                        }}
                        className="w-full rounded-lg border border-card-border bg-slate-950/60 text-slate-100 placeholder:text-slate-500 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. America/New_York"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Calendar ID
                      </label>
                      <input
                        name="calendarId"
                        value={calendarId}
                        onChange={(e) => {
                          setCalendarId(e.target.value);
                          localStorage.setItem(
                            "loopin_calendar_id",
                            e.target.value,
                          );
                        }}
                        className="w-full rounded-lg border border-card-border bg-slate-950/60 text-slate-100 placeholder:text-slate-500 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="primary or custom ID"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Access Token
                      </label>
                      <input
                        name="googleAccessToken"
                        type="password"
                        value={accessToken}
                        onChange={(e) => {
                          setAccessToken(e.target.value);
                          localStorage.setItem(
                            "loopin_access_token",
                            e.target.value,
                          );
                        }}
                        className="w-full rounded-lg border border-card-border bg-slate-950/60 text-slate-100 placeholder:text-slate-500 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="OAuth Access Token"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      * Required to extract events. Calendar ID & Token only
                      needed to sync.
                    </p>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-3">
                    <div className="mx-auto h-9 w-9 rounded-full bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <rect
                          width="18"
                          height="11"
                          x="3"
                          y="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-200 text-xs">
                        Paid Tier is Locked
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed px-2">
                        Managed key extraction, Stripe billing, and Google
                        Sign-in direct authentication are pending setup.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div
            className={`flex-1 flex flex-col justify-center transition-all duration-700 ease-in-out ${
              isTransitioned ? "pt-6 pb-2" : "items-center"
            }`}
          >
            {/* Landing Guide (Visible when NOT transitioned) */}
            <div
              className={`text-center space-y-4 py-6 transition-all duration-500 ease-in-out ${
                isTransitioned
                  ? "opacity-0 max-h-0 py-0 overflow-hidden pointer-events-none"
                  : "opacity-100 max-h-[500px]"
              }`}
            >
              <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm animate-pulse">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-infinity text-indigo-400 w-6 h-6"
                >
                  <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight font-display min-h-[36px] flex items-center justify-center gap-0.5">
                  {typedTitle}
                  {typedTitle.length < titleText.length && (
                    <span className="w-[3px] h-[24px] bg-indigo-400 animate-pulse inline-block" />
                  )}
                </h1>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed min-h-[40px]">
                  {typedSubtitle}
                  {typedTitle.length === titleText.length &&
                    typedSubtitle.length < subtitleText.length && (
                      <span className="w-[2px] h-[14px] bg-indigo-400/80 animate-pulse inline-block align-middle ml-0.5" />
                    )}
                </p>
              </div>
            </div>

            {/* Results Content (Visible when transitioned) */}
            <div
              className={`w-full space-y-6 transition-all duration-500 ease-in-out ${
                isTransitioned
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden"
              }`}
            >
              {state.status !== "idle" && (
                <div
                  className={`rounded-xl border p-4 flex gap-3 text-sm backdrop-blur-md ${
                    state.status === "success"
                      ? "bg-indigo-950/30 border-indigo-500/30 text-indigo-200"
                      : "bg-red-950/30 border-red-500/30 text-red-200"
                  }`}
                >
                  {state.status === "success" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-indigo-400 flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-red-400 flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m15 9-6 6" />
                      <path d="m9 9 6 6" />
                    </svg>
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">
                      {state.status === "success"
                        ? "Events Extracted Successfully"
                        : "Error Occurred"}
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {state.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Extracted Events */}
              {state.extractedEvents.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
                    Extracted Events
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {state.extractedEvents.map((event) => (
                      <article
                        key={`${event.title}-${event.start}`}
                        className="rounded-xl border border-card-border bg-card-bg backdrop-blur-md p-4.5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-card-border-hover"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-slate-200 text-[15px] font-display">
                            {event.title}
                          </h3>
                          <span className="rounded-full bg-indigo-950/50 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                            {Math.round(event.confidence * 100)}% Match
                          </span>
                        </div>

                        <div className="mt-3.5 space-y-2 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              className="text-slate-400"
                            >
                              <rect
                                width="18"
                                height="18"
                                x="3"
                                y="4"
                                rx="2"
                                ry="2"
                              />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            <span>{event.start}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                className="text-slate-400"
                              >
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          {event.notes && (
                            <p className="mt-2 text-slate-400 leading-normal border-t border-slate-800 pt-2 text-[11px]">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* Synced Events */}
              {state.syncedEvents.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
                    Synced to Google Calendar
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {state.syncedEvents.map((event) => (
                      <article
                        key={`${event.title}-${event.start}`}
                        className="rounded-xl border border-indigo-500/25 bg-indigo-950/20 p-4.5 backdrop-blur-md"
                      >
                        <h3 className="font-bold text-slate-200 text-[15px] font-display">
                          {event.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {event.start}
                        </p>
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                          >
                            <span>Open Calendar</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M15 3h6v6" />
                              <path d="M10 14 21 3" />
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            </svg>
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Transitional Input Area */}
            <div
              className={`w-full transition-all duration-700 ease-in-out z-20 ${
                isTransitioned
                  ? "sticky bottom-0 bg-background/85 backdrop-blur-md pt-4 pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6"
                  : "max-w-2xl mt-8"
              }`}
            >
              <div className={isTransitioned ? "max-w-4xl mx-auto" : "w-full"}>
                <section
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="relative rounded-2xl border border-card-border bg-card-bg backdrop-blur-md p-2.5 shadow-md transition-all duration-300 hover:border-card-border-hover hover:shadow-lg focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
                >
                  <textarea
                    name="sourceText"
                    rows={isTransitioned ? 3 : 4}
                    onChange={(e) =>
                      setHasInputText(e.target.value.trim().length > 0)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (e.currentTarget.value.trim().length > 0) {
                          e.currentTarget.form?.requestSubmit();
                        }
                      }
                    }}
                    className="w-full resize-none border-0 bg-transparent px-3.5 py-3 text-[15px] leading-relaxed text-slate-200 placeholder:text-slate-500 outline-none ring-0 focus:outline-none focus:ring-0"
                    placeholder="Paste raw event details or an image here, or drop image files anywhere on this box..."
                  />

                  {/* Files Selected Row */}
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-3 pb-3">
                      {files.map((file, idx) => (
                        <div
                          key={`${file.name}-${file.lastModified}`}
                          className="flex items-center gap-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/20 py-1 pl-3 pr-2 text-xs font-medium text-indigo-400"
                        >
                          <span className="max-w-40 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="rounded-full p-0.5 hover:bg-indigo-900 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Row */}
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 px-1.5">
                    <div className="flex items-center gap-1">
                      <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-950/60 hover:text-indigo-400">
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
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="3"
                            rx="2.18"
                            ry="2.18"
                          />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </label>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        Up to 3 images
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={pending}
                      className="flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {pending ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
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
          </div>
        </div>
      </form>

      {/* Floating Action Button (FAB) with Info Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 cursor-pointer"
          title="How to get API keys"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </div>

      {/* Info Modal Dialog */}
      {showInfoModal && (
        <div
          onClick={() => setShowInfoModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl border border-card-border bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in scale-in duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <h2 className="text-lg font-bold text-slate-100 font-display">
                  Free Tier API Setup Guide
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer rounded-full p-1 hover:bg-slate-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-6 text-sm text-slate-300">
              <section className="space-y-2">
                <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-display">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-950/50 border border-indigo-500/20 text-[11px] font-bold text-indigo-400">
                    1
                  </span>
                  Get a Groq API Key
                </h3>
                <p className="leading-relaxed pl-6 text-slate-300">
                  Loopin uses Groq for fast AI parsing. Go to the{" "}
                  <a
                    href="https://console.groq.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-medium cursor-pointer"
                  >
                    Groq Console
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="inline ml-0.5"
                    >
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </a>
                  , create an API key, and paste it into the <b>Groq API Key</b>{" "}
                  field in the Connect settings.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-display">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-950/50 border border-indigo-500/20 text-[11px] font-bold text-indigo-400">
                    2
                  </span>
                  Find Google Calendar ID
                </h3>
                <p className="leading-relaxed pl-6 text-slate-300">
                  Open{" "}
                  <a
                    href="https://calendar.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-medium cursor-pointer"
                  >
                    Google Calendar
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="inline ml-0.5"
                    >
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </a>
                  . In the left panel, hover over your calendar, click the three
                  dots, and select <b>Settings and sharing</b>. Scroll down to
                  the <b>Integrate calendar</b> section and copy the{" "}
                  <b>Calendar ID</b> (e.g. your email address for primary).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-display">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-950/50 border border-indigo-500/20 text-[11px] font-bold text-indigo-400">
                    3
                  </span>
                  Generate Google Access Token
                </h3>
                <div className="leading-relaxed pl-6 space-y-2 text-slate-300">
                  <p className="text-slate-300">
                    To authorize syncing without full auth configuration, you
                    can use the Google OAuth Playground:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-400">
                    <li>
                      Go to{" "}
                      <a
                        href="https://developers.google.com/oauthplayground/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-medium cursor-pointer"
                      >
                        Google OAuth Playground
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="inline ml-0.5"
                        >
                          <path d="M15 3h6v6" />
                          <path d="M10 14 21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                      </a>
                      .
                    </li>
                    <li>
                      Under <b>Select & authorize APIs</b>, scroll to{" "}
                      <b>Google Calendar API v3</b> and expand it.
                    </li>
                    <li>
                      Select the scope:{" "}
                      <code>https://www.googleapis.com/auth/calendar</code>.
                    </li>
                    <li>
                      Click <b>Authorize APIs</b>, choose your Google account,
                      and grant access.
                    </li>
                    <li>
                      In Step 2, click{" "}
                      <b>Exchange authorization code for tokens</b>.
                    </li>
                    <li>
                      Copy the <b>Access Token</b> value and paste it into the
                      settings panel.
                    </li>
                  </ol>
                </div>
              </section>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
