import OpenAI from "openai";

import {
  extractedEventSchema,
  rawExtractionResultSchema,
  type CalendarSyncResult,
  type ExtractionResult,
  type ExtractedEvent,
} from "./event-types";

const groqClient = (customApiKey?: string) => {
  const apiKey = customApiKey || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing Groq API Key. Please configure your key in settings.",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
};

export const stripMarkdownFence = (value: string) =>
  value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

export const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const addMinutes = (value: string, minutes: number) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
};

export const addDaysToDateOnly = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const fileToDataUrl = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  return `data:${file.type || "application/octet-stream"};base64,${base64}`;
};

const buildPrompt = (inputText: string, timezone: string) => `
You extract calendar events from messy notes, screenshots, flyers, and pasted text.

Return JSON only with this exact shape:
{
  "summary": string,
  "timezone": string,
  "events": [
    {
      "title": string,
      "start": string,
      "end": string | null,
      "allDay": boolean,
      "location": string,
      "notes": string,
      "confidence": number
    }
  ]
}

Rules:
- Use ISO 8601 timestamps with timezone offsets when a time is present.
- Use date-only values like 2026-07-22 for all-day events.
- If a time range is missing, infer a reasonable one-hour event and set confidence lower.
- Keep confidence between 0 and 1.
- Put any uncertainty in the notes field.
- The timezone to use is ${timezone}.
- Every event MUST have a non-null "title" and "start". If you cannot
  determine a start date/time for something, omit that event entirely
  rather than including it with a null or empty start.

Input:
${inputText}
`;

export async function extractEventsFromInput(params: {
  text: string;
  timezone: string;
  files: File[];
  groqApiKey?: string;
}): Promise<ExtractionResult> {
  const client = groqClient(params.groqApiKey);
  const imageInputs = await Promise.all(
    params.files.slice(0, 3).map(async (file) => ({
      type: "image_url" as const,
      image_url: { url: await fileToDataUrl(file) },
    })),
  );

  const hasImages = imageInputs.length > 0;

  const response = await client.chat.completions.create({
    model: hasImages
      ? "meta-llama/llama-4-scout-17b-16e-instruct"
      : "openai/gpt-oss-20b",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildPrompt(params.text, params.timezone),
          },
          ...imageInputs,
        ],
      },
    ],
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  const rawParsed = rawExtractionResultSchema.parse(
    JSON.parse(stripMarkdownFence(content)),
  );

  const events = rawParsed.events.flatMap((event) => {
    const result = extractedEventSchema.safeParse({
      ...event,
      title: event.title ?? "",
      start: event.start ?? "",
      location: event.location ?? "",
      notes: event.notes ?? "",
      allDay: event.allDay ?? undefined,
      confidence: event.confidence ?? undefined,
    });

    return result.success ? [result.data] : [];
  });

  return {
    summary: rawParsed.summary,
    timezone: rawParsed.timezone,
    events,
  };
}

export const isEventPast = (
  event: ExtractedEvent,
  referenceDate: Date = new Date(),
): boolean => {
  const effectiveEnd = event.end || event.start;

  if (event.allDay || isDateOnly(effectiveEnd)) {
    const endDate = isDateOnly(effectiveEnd)
      ? effectiveEnd
      : new Date(effectiveEnd).toISOString().slice(0, 10);
    const endOfDay = new Date(`${endDate}T23:59:59.999Z`);

    return !Number.isNaN(endOfDay.getTime()) && endOfDay < referenceDate;
  }

  const endTime = new Date(effectiveEnd);

  return !Number.isNaN(endTime.getTime()) && endTime < referenceDate;
};

export const normalizeCalendarEvent = (
  event: ExtractedEvent,
  timezone: string,
) => {
  if (event.allDay || isDateOnly(event.start)) {
    const startDate = isDateOnly(event.start)
      ? event.start
      : new Date(event.start).toISOString().slice(0, 10);
    const endDate =
      event.end && isDateOnly(event.end)
        ? event.end
        : addDaysToDateOnly(startDate, 1);

    return {
      start: { date: startDate },
      end: { date: endDate },
    };
  }

  const startDateTime = new Date(event.start).toISOString();
  const endDateTime = event.end
    ? new Date(event.end).toISOString()
    : addMinutes(startDateTime, 60);

  return {
    start: { dateTime: startDateTime, timeZone: timezone },
    end: { dateTime: endDateTime, timeZone: timezone },
  };
};

export async function syncEventsToGoogleCalendar(params: {
  events: ExtractedEvent[];
  timezone: string;
  calendarId: string;
  accessToken: string;
}): Promise<CalendarSyncResult[]> {
  const synced: CalendarSyncResult[] = [];

  for (const event of params.events) {
    if (!event.start) {
      continue;
    }

    const normalized = normalizeCalendarEvent(event, params.timezone);
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        params.calendarId,
      )}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.title,
          location: event.location || undefined,
          description: event.notes || undefined,
          ...normalized,
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `Google Calendar rejected \"${event.title}\": ${response.status} ${details}`,
      );
    }

    const created = (await response.json()) as { htmlLink?: string };
    const start =
      "date" in normalized.start
        ? normalized.start.date
        : normalized.start.dateTime;
    const end =
      "date" in normalized.end ? normalized.end.date : normalized.end.dateTime;

    synced.push({
      title: event.title,
      htmlLink: created.htmlLink ?? null,
      start: start ?? "",
      end: end ?? "",
    });
  }

  return synced;
}
