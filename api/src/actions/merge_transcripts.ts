import { generate } from "../lib/llm";

async function run({ parameters }: { parameters: Record<string, string> }) {
  const userTranscripts: Record<string, string> = {};

  for (const [key, value] of Object.entries(parameters)) {
    if (key.startsWith("user_") && key.endsWith("_transcript")) {
      const speakerId = key.replace(/^user_/, "").replace(/_transcript$/, "");
      userTranscripts[speakerId] = value;
    }
  }

  if (Object.keys(userTranscripts).length === 0) {
    return {
      error:
        "No user transcripts found in parameters (expected keys like user_<id>_transcript)",
    };
  }

  const speakerBlock = Object.entries(userTranscripts)
    .map(([id, vtt]) => `=== Speaker ${id} ===\n${vtt}`)
    .join("\n\n");

  const { result } = await generate({
    policy: {
      role: "system",
      content:
        "You are a meeting transcript editor. You receive separate VTT transcripts for each speaker and produce a unified, chronological meeting transcript. Each line should be prefixed with the speaker ID. Use timestamps to order segments. Output plain text, no VTT formatting.",
    },
    content: `Merge the following per-speaker transcripts into a single chronological meeting transcript. Prefix each segment with the speaker ID.\n\n${speakerBlock}`,
    json_format:
      '{ final_transcript: "<merged transcript with speaker labels>" }',
  });

  return {
    final_transcript: (result as { final_transcript: string }).final_transcript,
  };
}

export default { run };
