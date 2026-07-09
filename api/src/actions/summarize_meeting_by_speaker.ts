import { generate } from "../lib/llm";

// A single LLM call given the whole meeting is unreliable: models tend to
// ignore vague "be concise" instructions on large prompts and echo the
// transcript back, blowing past output token limits. Instead we summarize
// each speaker's transcript on its own (small input, hard word cap), then
// combine those short summaries into the final structured output - both
// stages stay small regardless of how long the meeting is.
async function summarizeSpeaker(
  id: string,
  transcript: string,
  lang: string
): Promise<{ id: string; summary: string }> {
  const result = await generate({
    policy: {
      role: "system",
      content: `You summarize one meeting participant's contribution in ${lang}. Write at most 120 words. Do not quote the transcript verbatim (no quoted excerpt longer than 5 words) - paraphrase only.`,
    },
    content: `Speaker ${id}'s individual transcript:\n${transcript}`,
    json_format:
      '{ speaker_summary: "<at most 120 words, no verbatim quotes>" }',
    max_tokens: 1024,
  });

  return {
    id,
    summary: (result as { speaker_summary: string }).speaker_summary,
  };
}

async function run({
  parameters: { speaker_transcripts, language },
}: {
  parameters: {
    speaker_transcripts?: { id: string; transcript: string }[];
    language?: string;
  };
}) {
  if (!speaker_transcripts?.length) {
    return {
      error:
        "speaker_transcripts is required (array of { id, transcript } from transcribe_meeting)",
    };
  }

  const lang = language ?? "tr";

  const speakerSummaries = await Promise.all(
    speaker_transcripts.map(({ id, transcript }) =>
      summarizeSpeaker(id, transcript, lang)
    )
  );

  const speakerSummaryBlock = speakerSummaries
    .map(({ id, summary }) => `=== Speaker ${id} ===\n${summary}`)
    .join("\n\n");

  const result = await generate({
    policy: {
      role: "system",
      content: `You are a meeting summarizer. You receive a short summary of what each participant said, labeled by speaker ID. Combine them into a structured meeting summary in ${lang}. Attribute decisions and action items to the responsible speaker ID.`,
    },
    content: `Per-speaker summaries:\n\n${speakerSummaryBlock}`,
    json_format:
      '{ summary: "<overall meeting summary, at most 200 words>", key_topics: ["<topic>"], decisions: ["<speaker id>: <decision>"], action_items: [{ owner_id: "<speaker id>", task: "<task>" }] }',
    max_tokens: 2048,
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
