import OpenAI from "openai";

import {
  extractionResultSchema,
  type CalendarSyncResult,
  type ExtractionResult,
  type ExtractedEvent,
} from "./event-types";

const groqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GROQ_API_KEY. Add it to your environment before extracting events.",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
};

const stripMarkdownFence = (value: string) =>
  value.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const addMinutes = (value: string, minutes: number) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
};

const addDaysToDateOnly = (value: string, days: number) => {
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

Input:
${inputText}
`;

export async function extractEventsFromInput(params: {
  text: string;
  timezone: string;
  files: File[];
}): Promise<ExtractionResult> {
  const client = groqClient();
  const imageInputs = await Promise.all(
    params.files.slice(0, 3).map(async (file) => ({
      type: "input_image" as const,
      image_url: await fileToDataUrl(file),
      detail: "auto" as const,
    })),
  );

  const response = await client.responses.create({
    model: "openai/gpt-oss-20b",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildPrompt(params.text, params.timezone),
          },
          ...imageInputs,
        ],
      },
    ],
    temperature: 0,
  });

  const parsed = extractionResultSchema.parse(
    JSON.parse(stripMarkdownFence(response.output_text)),
  );

  return {
    ...parsed,
    events: parsed.events.map((event) => ({
      ...event,
      notes: event.notes ?? "",
      location: event.location ?? "",
    })),
  };
}

const normalizeCalendarEvent = (event: ExtractedEvent, timezone: string) => {
  if (event.allDay || isDateOnly(event.start)) {
    const startDate = isDateOnly(event.start)
      ? event.start
      : new Date(event.start).toISOString().slice(0, 10);
    const endDate = event.end && isDateOnly(event.end)
      ? event.end
      : addDaysToDateOnly(startDate, 1);

    return {
      start: { date: startDate },
      end: { date: endDate },
    };
  }

  const startDateTime = new Date(event.start).toISOString();
  const endDateTime = event.end ? new Date(event.end).toISOString() : addMinutes(startDateTime, 60);

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
    const start = "date" in normalized.start ? normalized.start.date : normalized.start.dateTime;
    const end = "date" in normalized.end ? normalized.end.date : normalized.end.dateTime;

    synced.push({
      title: event.title,
      htmlLink: created.htmlLink ?? null,
      start: start ?? "",
      end: end ?? "",
    });
  }

  return synced;
}