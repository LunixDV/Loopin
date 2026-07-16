"use server";

import {
  extractEventsFromInput,
  syncEventsToGoogleCalendar,
} from "@/lib/event-intake";
import type { AppState } from "@/lib/event-types";

const initialResult: AppState = {
  status: "idle",
  message: "Drop screenshots, flyers, or notes to extract events.",
  summary: "",
  timezone: "UTC",
  extractedEvents: [],
  syncedEvents: [],
};

const asString = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value : "";

export async function ingestEvents(
  _previousState: AppState,
  formData: FormData,
): Promise<AppState> {
  const text = asString(formData.get("sourceText")).trim();
  const timezone = asString(formData.get("timezone")).trim() || "UTC";
  const calendarId =
    asString(formData.get("calendarId")).trim() ||
    process.env.GOOGLE_CALENDAR_ID?.trim() ||
    "";
  const accessToken =
    asString(formData.get("googleAccessToken")).trim() ||
    process.env.GOOGLE_CALENDAR_ACCESS_TOKEN?.trim() ||
    "";
  const groqApiKey = asString(formData.get("groqApiKey")).trim();
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, 3);

  if (!text && files.length === 0) {
    return {
      ...initialResult,
      status: "error",
      message: "Add some text or at least one image before running extraction.",
      timezone,
    };
  }

  try {
    const extraction = await extractEventsFromInput({
      text,
      timezone,
      files,
      groqApiKey,
    });

    let syncedEvents: AppState["syncedEvents"] = [];
    if (calendarId && accessToken) {
      syncedEvents = await syncEventsToGoogleCalendar({
        events: extraction.events,
        timezone: extraction.timezone,
        calendarId,
        accessToken,
      });
    }

    const syncMessage =
      calendarId && accessToken
        ? ` Synced ${syncedEvents.length} event${syncedEvents.length === 1 ? "" : "s"} to Google Calendar.`
        : " Add GOOGLE_CALENDAR_ID and GOOGLE_CALENDAR_ACCESS_TOKEN to auto-sync.";

    return {
      status: "success",
      message: `Extracted ${extraction.events.length} event${extraction.events.length === 1 ? "" : "s"}.${syncMessage}`,
      summary: extraction.summary,
      timezone: extraction.timezone,
      extractedEvents: extraction.events,
      syncedEvents,
    };
  } catch (error) {
    return {
      ...initialResult,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong while extracting events.",
      timezone,
    };
  }
}