import { generate } from "../lib/llm";

// Keeps each chunk's labeled output comfortably under the LLM provider's
// max output token cap (Bedrock is hardcoded to 8192 tokens, see lib/bedrock.ts).
const CHUNK_CHAR_LIMIT = 6000;
const OVERLAP_LINES = 3;

function splitIntoChunks(transcript: string, maxChars: number): string[] {
  const lines = transcript.split("\n");
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const line of lines) {
    const lineLength = line.length + 1;
    if (currentLength + lineLength > maxChars && current.length > 0) {
      chunks.push(current.join("\n"));
      current = current.slice(-OVERLAP_LINES);
      currentLength = current.reduce((sum, l) => sum + l.length + 1, 0);
    }
    current.push(line);
    currentLength += lineLength;
  }

  if (current.length > 0) {
    chunks.push(current.join("\n"));
  }

  return chunks;
}

async function run({
  parameters: { full_meeting_transcript, speaker_transcripts },
}: {
  parameters: {
    full_meeting_transcript?: string;
    speaker_transcripts?: { id: string; transcript: string }[];
  };
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

  const chunks = splitIntoChunks(full_meeting_transcript, CHUNK_CHAR_LIMIT);
  const labeledChunks: string[] = [];

  for (const chunk of chunks) {
    const precedingContext = labeledChunks.length
      ? labeledChunks[labeledChunks.length - 1]
          .split("\n")
          .slice(-OVERLAP_LINES)
          .join("\n")
      : "";

    const result = await generate({
      policy: {
        role: "system",
        content:
          "You are a meeting transcript editor. You are given each participant's individual transcript, and a segment of the main meeting transcript. Determine which speaker said each line of the main transcript segment by matching its content against the per-speaker transcripts, and prefix each line with that speaker's ID. Preserve the original text and line order exactly - only add speaker labels, do not summarize, translate, or omit any line. If a line's speaker cannot be determined, prefix it with 'UNKNOWN'.",
      },
      content: `Per-speaker transcripts (for matching content to speakers):\n\n${speakerBlock}\n\n${
        precedingContext
          ? `Already-labeled preceding context (do NOT repeat this in your output, it is only for continuity):\n${precedingContext}\n\n`
          : ""
      }Main meeting transcript segment to label (label every line below, in order):\n${chunk}`,
      json_format:
        '{ labeled_segment: "<only this segment, with a speaker label prefixed on each line>" }',
      max_tokens: 8192,
    });

    labeledChunks.push((result as { labeled_segment: string }).labeled_segment);
  }

  return {
    final_transcript: labeledChunks.join("\n"),
  };
}

export default { run };
