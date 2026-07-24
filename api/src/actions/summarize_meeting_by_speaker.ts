import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";

const LANGUAGE_NAMES: Record<string, string> = {
  tr: "Turkish",
  en: "English",
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code;
}

// A single LLM call given the whole meeting is unreliable: models tend to
// ignore vague "be concise" instructions on large prompts and echo the
// transcript back, blowing past output token limits. Instead we summarize
// each speaker's transcript on its own (small input, hard word cap), then
// combine those short summaries into the final structured output - both
// stages stay small regardless of how long the meeting is.
async function summarizeSpeaker(
  id: string,
  transcript: string,
  lang: string,
  meta?: LLMMeta
): Promise<{ id: string; summary: string }> {
  const result = await generate({
    policy: {
      role: "system",
      content: `You summarize one meeting participant's contribution. Respond entirely in ${lang} - every word of your output must be in ${lang}, regardless of what language the transcript is in. Write at most 120 words. Do not quote the transcript verbatim (no quoted excerpt longer than 5 words) - paraphrase only.`,
    },
    content: `Speaker ${id}'s individual transcript:\n${transcript}`,
    json_format:
      '{ speaker_summary: "<at most 120 words, no verbatim quotes>" }',
    max_tokens: 1024,
    meta,
  });

  return {
    id,
    summary: (result as { speaker_summary: string }).speaker_summary,
  };
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
      summarizeSpeaker(id, transcript, lang, meta)
    )
  );

  const speakerSummaryBlock = speakerSummaries
    .map(({ id, summary }) => `=== Speaker ${id} ===\n${summary}`)
    .join("\n\n");

  // full_meeting_transcript is passed only as background reference (e.g. to
  // catch cross-speaker context the per-speaker summaries missed) - the
  // model is told not to quote it, since the per-speaker summaries above are
  // what keep this call's output small and bounded.
  const result = await generate({
    policy: {
      role: "system",
      content: `You are a meeting summarizer. You receive a short summary of what each participant said, labeled by speaker ID, plus the full meeting transcript as background reference only. Combine them into a structured meeting summary. Respond entirely in ${lang} - every word of every output field must be in ${lang}, regardless of what language the transcript is in. Attribute decisions and action items to the responsible speaker ID. Use the full transcript only to catch context the per-speaker summaries missed - never quote or reproduce it, and keep every output field short.`,
    },
    content: `Per-speaker summaries:\n\n${speakerSummaryBlock}\n\nFull meeting transcript (background reference only - do not quote):\n${full_meeting_transcript}`,
    json_format:
      '{ summary: "<overall meeting summary, at most 200 words>", key_topics: ["<topic>"], decisions: ["<speaker id>: <decision>"], action_items: [{ owner_id: "<speaker id>", task: "<task>" }] }',
    max_tokens: 2048,
    meta,
  });

  const combined = result as {
    summary: string;
    key_topics: string[];
    decisions: string[];
    action_items: { owner_id: string; task: string }[];
  };

  return {
    ...combined,
    speaker_highlights: speakerSummaries,
  };
}

export default { run };
