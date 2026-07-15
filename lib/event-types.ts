import { z } from "zod";

export const extractedEventSchema = z.object({
  title: z.string().min(1),
  start: z.string().min(1),
  end: z.string().nullable().optional(),
  allDay: z.boolean().default(false),
  location: z.string().default(""),
  notes: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const extractionResultSchema = z.object({
  summary: z.string().min(1),
  timezone: z.string().min(1),
  events: z.array(extractedEventSchema),
});

export type ExtractedEvent = z.infer<typeof extractedEventSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export type CalendarSyncResult = {
  title: string;
  htmlLink: string | null;
  start: string;
  end: string;
};

export type AppState = {
  status: "idle" | "success" | "error";
  message: string;
  summary: string;
  timezone: string;
  extractedEvents: ExtractedEvent[];
  syncedEvents: CalendarSyncResult[];
};