import { expect, test, describe } from "bun:test";
import {
  stripMarkdownFence,
  isDateOnly,
  addMinutes,
  addDaysToDateOnly,
  normalizeCalendarEvent,
} from "@/lib/event-intake";
import type { ExtractedEvent } from "@/lib/event-types";

describe("event-intake helpers", () => {
  test("stripMarkdownFence removes markdown JSON wrappers", () => {
    const inputs = [
      '```json\n{\n  "summary": "test"\n}\n```',
      '```\n{\n  "summary": "test"\n}\n```',
      '{\n  "summary": "test"\n}',
    ];
    for (const input of inputs) {
      expect(JSON.parse(stripMarkdownFence(input))).toEqual({
        summary: "test",
      });
    }
  });

  test("isDateOnly matches YYYY-MM-DD format correctly", () => {
    expect(isDateOnly("2026-07-22")).toBe(true);
    expect(isDateOnly("2026-07-22T10:00:00Z")).toBe(false);
    expect(isDateOnly("invalid")).toBe(false);
  });

  test("addMinutes adds time offsets properly", () => {
    const baseTime = "2026-07-16T12:00:00.000Z";
    expect(addMinutes(baseTime, 60)).toBe("2026-07-16T13:00:00.000Z");
    expect(addMinutes("invalid", 60)).toBe("invalid");
  });

  test("addDaysToDateOnly increments date-only strings", () => {
    expect(addDaysToDateOnly("2026-07-22", 1)).toBe("2026-07-23");
    expect(addDaysToDateOnly("invalid", 1)).toBe("invalid");
  });

  test("normalizeCalendarEvent normalizes all-day events", () => {
    const event: ExtractedEvent = {
      title: "Conference Day 1",
      start: "2026-07-22",
      end: null,
      allDay: true,
      location: "",
      notes: "",
      confidence: 1,
    };
    const normalized = normalizeCalendarEvent(event, "America/New_York");
    expect(normalized).toEqual({
      start: { date: "2026-07-22" },
      end: { date: "2026-07-23" },
    });
  });

  test("normalizeCalendarEvent normalizes standard datetime events", () => {
    const event: ExtractedEvent = {
      title: "Sync Meeting",
      start: "2026-07-22T10:00:00.000Z",
      end: "2026-07-22T11:00:00.000Z",
      allDay: false,
      location: "Office",
      notes: "Quick sync",
      confidence: 0.9,
    };
    const normalized = normalizeCalendarEvent(event, "UTC");
    expect(normalized).toEqual({
      start: { dateTime: "2026-07-22T10:00:00.000Z", timeZone: "UTC" },
      end: { dateTime: "2026-07-22T11:00:00.000Z", timeZone: "UTC" },
    });
  });
});
