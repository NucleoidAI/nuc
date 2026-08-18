import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";

const LANGUAGE_NAMES: Record<string, string> = {
  tr: "Turkish",
  en: "English",
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code;
}

// The model sometimes wraps a text field in an object (or an array of them)
// instead of returning a plain string. Downstream steps render these values
// directly, so flatten anything non-string into its text leaves - otherwise the
// email/UI shows "[object Object]".
function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join(" ");
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(asText)
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

const SUMMARY_MODEL =
  process.env.SUMMARY_LLM_MODEL || "us.anthropic.claude-opus-5";

async function summarizeSpeaker(
  id: string,
  transcript: string,
  lang: string,
  meta?: LLMMeta,
): Promise<{ id: string; summary: string }> {
  const result = await generate({
    model: SUMMARY_MODEL,
    policy: {
      role: "system",
      content: `You summarize one meeting participant's contribution. Respond entirely in ${lang} - every word of your output must be in ${lang}, regardless of what language the transcript is in. Write at most 120 words. Do not quote the transcript verbatim (no quoted excerpt longer than 5 words) - paraphrase only. Return speaker_summary as a single plain JSON string - never an object, array, or nested structure.`,
    },
    content: `Speaker ${id}'s individual transcript:\n${transcript}`,
    json_format:
      '{ speaker_summary: "<at most 120 words, no verbatim quotes>" }',
    max_tokens: 1024,
    meta,
  });

  const payload = (result ?? {}) as Record<string, unknown>;
  // Fall back to the whole payload when the model renamed the key.
  const summary = asText(
    payload.speaker_summary ?? payload.summary ?? payload.text ?? payload,
  );

  return { id, summary };
}

async function run({
  parameters: { full_meeting_transcript, speaker_transcripts, language },
  meta,
}: {
  parameters: {
    full_meeting_transcript?: string;
    speaker_transcripts?: { id: string; transcript: string }[];
    language?: string;
  };
  meta?: LLMMeta;
}) {
  if (!full_meeting_transcript) {
    return {
      error:
        "full_meeting_transcript is required (combined transcript from transcribe_meeting)",
    };
  }

  if (!speaker_transcripts?.length) {
    return {
      error:
        "speaker_transcripts is required (array of { id, transcript } from transcribe_meeting)",
    };
  }

  const lang = languageName(language ?? "tr");

  const speakerSummaries = await Promise.all(
    speaker_transcripts.map(({ id, transcript }) =>
      summarizeSpeaker(id, transcript, lang, meta),
    ),
  );

  const speakerSummaryBlock = speakerSummaries
    .map(({ id, summary }) => `=== Speaker ${id} ===\n${summary}`)
    .join("\n\n");

  const result = await generate({
    model: SUMMARY_MODEL,
    policy: {
      role: "system",
      content: `You are a meeting summarizer. You receive a short summary of what each participant said, labeled by speaker ID, plus the full meeting transcript as background reference only. Combine them into a structured meeting summary. Respond entirely in ${lang} - every word of every output field must be in ${lang}, regardless of what language the transcript is in. Attribute decisions and action items to the responsible speaker ID. Speaker IDs are opaque labels, not numbers - always write them as quoted JSON strings, exactly as given, even when they consist only of digits. Use the full transcript only to catch context the per-speaker summaries missed - never quote or reproduce it, and keep every output field short.`,
    },
    content: `Per-speaker summaries:\n\n${speakerSummaryBlock}\n\nFull meeting transcript (background reference only - do not quote):\n${full_meeting_transcript}`,
    json_format:
      '{ summary: "<overall meeting summary, at most 200 words>", key_topics: ["<topic>"], decisions: ["<speaker id>: <decision>"], action_items: [{ owner_id: "<speaker id>", task: "<task>" }] }',
    max_tokens: 2048,
    meta,
  });

  const combined = result as {
    summary: unknown;
    key_topics: unknown[];
    decisions: unknown[];
    action_items: { owner_id: string | number; task: unknown }[];
  };

  return {
    summary: asText(combined.summary),
    key_topics: (combined.key_topics ?? []).map(asText).filter(Boolean),
    decisions: (combined.decisions ?? []).map(asText).filter(Boolean),
    // Numeric-looking speaker IDs sometimes come back unquoted; downstream steps
    // (ID resolution, email rendering) expect strings.
    action_items: (combined.action_items ?? []).map(({ owner_id, task }) => ({
      owner_id: String(owner_id ?? ""),
      task: asText(task),
    })),
    speaker_highlights: speakerSummaries,
  };
}

export default { run };
