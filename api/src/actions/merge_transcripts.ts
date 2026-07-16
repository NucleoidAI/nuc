import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";

// Some models (small/coder-specialized ones especially) tend to ignore
// "add a label to every line" instructions on large text and just echo the
// input back unchanged. Asking the model to reproduce the transcript at all
// invites that failure. Instead we split the transcript into sentences
// ourselves and ask the model only for a short array of speaker IDs (one per
// sentence) - there's no transcript text in the output to echo, so the
// model has nothing to do but the labeling task. This also keeps output
// tiny regardless of meeting length, avoiding token-limit truncation.
const CHUNK_CHAR_LIMIT = 6000;
const OVERLAP_SENTENCES = 3;

function splitIntoSentences(transcript: string): string[] {
  const sentences = transcript.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [
    transcript,
  ];
  return sentences.map((s) => s.trim()).filter(Boolean);
}

function chunkSentences(
  sentences: string[],
  maxChars: number
): { context: string[]; target: string[] }[] {
  const chunks: { context: string[]; target: string[] }[] = [];
  let target: string[] = [];
  let targetLength = 0;
  let previousTail: string[] = [];

  for (const sentence of sentences) {
    if (targetLength + sentence.length > maxChars && target.length > 0) {
      chunks.push({ context: previousTail, target });
      previousTail = target.slice(-OVERLAP_SENTENCES);
      target = [];
      targetLength = 0;
    }
    target.push(sentence);
    targetLength += sentence.length;
  }

  if (target.length > 0) {
    chunks.push({ context: previousTail, target });
  }

  return chunks;
}

async function run({
  parameters: { full_meeting_transcript, speaker_transcripts },
  meta,
}: {
  parameters: {
    full_meeting_transcript?: string;
    speaker_transcripts?: { id: string; transcript: string }[];
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

  const speakerBlock = speaker_transcripts
    .map(({ id, transcript }) => `=== Speaker ${id} ===\n${transcript}`)
    .join("\n\n");
  const knownSpeakerIds = new Set(speaker_transcripts.map((s) => s.id));

  const sentences = splitIntoSentences(full_meeting_transcript);
  const chunks = chunkSentences(sentences, CHUNK_CHAR_LIMIT);
  const labeledLines: string[] = [];

  for (const { context, target } of chunks) {
    const numberedTarget = target.map((s, i) => `${i + 1}. ${s}`).join("\n");
    const numberedContext = context.map((s, i) => `${i + 1}. ${s}`).join("\n");

    const result = await generate({
      policy: {
        role: "system",
        content:
          "You identify which speaker said each numbered sentence of a meeting transcript, by matching it against each participant's individual transcript. Respond with ONLY an array of speaker IDs - one per TARGET sentence, in the same order, nothing else. Do not include the sentence text. If a sentence's speaker cannot be determined, use 'UNKNOWN'.",
      },
      content: `Per-speaker transcripts (for matching content to speakers):\n\n${speakerBlock}\n\n${
        context.length
          ? `Context (already labeled earlier, shown only for continuity - do NOT include these in your output):\n${numberedContext}\n\n`
          : ""
      }TARGET sentences - return exactly ${
        target.length
      } speaker IDs, one per sentence, in this order:\n${numberedTarget}`,
      json_format: `{ speaker_ids: ["<speaker id or UNKNOWN for sentence 1>", "<speaker id or UNKNOWN for sentence 2>", "... exactly ${target.length} items total"] }`,
      max_tokens: 2048,
      meta: { ...meta, source: "action:merge_transcripts" },
    });

    const ids = (result as { speaker_ids?: string[] }).speaker_ids ?? [];
    target.forEach((sentence, i) => {
      const id = ids[i];
      const label = id && knownSpeakerIds.has(id) ? id : "UNKNOWN";
      labeledLines.push(`${label}: ${sentence}`);
    });
  }

  return {
    final_transcript: labeledLines.join("\n"),
  };
}

export default { run };
