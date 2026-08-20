import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";
import { unwrapResult } from "../lib/llmResult";

const LANGUAGE_NAMES: Record<string, string> = {
  tr: "Turkish",
  en: "English",
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code;
}

const JUDGE_MODEL = process.env.JUDGE_LLM_MODEL || "anthropic/claude-sonnet-5";

function stringifySummary(summary: unknown): string {
  if (typeof summary === "string") return summary;
  return JSON.stringify(summary, null, 2);
}

function speakerBlock(
  speakerTranscripts: { id: string; transcript: string }[]
): string {
  const speakers = speakerTranscripts
    .filter(({ transcript }) => transcript)
    .map(({ id, transcript }) => `[${id}]\n${transcript}`)
    .join("\n\n");
  return `\n\nEach participant's own recording, labeled with their identity:\n${speakers}`;
}

function clampScore(value: unknown): number {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function run({
  parameters: { transcript, summary, speaker_transcripts, variant, language },
  meta,
}: {
  parameters: {
    transcript?: string;
    summary?: unknown;
    speaker_transcripts?: { id: string; transcript: string }[];
    variant?: string;
    language?: string;
  };
  meta?: LLMMeta;
}) {
  if (!transcript) {
    return { error: "transcript is required (the full meeting transcript)" };
  }

  if (!summary) {
    return { error: "summary is required (the generated meeting notes)" };
  }

  const lang = languageName(language ?? "tr");

  // Variant B attributes statements using each participant's own recording. If
  // the judge only saw the unlabeled combined transcript it would mark every
  // attribution as unsupported, so the same evidence is handed to the judge.
  const hasSpeakers = Boolean(speaker_transcripts?.length);

  const attributionRule = hasSpeakers
    ? "The participants' individual recordings are given to you as well - check every attribution (who said something, who owns a next step) against them, and treat an attribution they support as correct even though the combined transcript is unlabeled."
    : "The transcript is unlabeled, so it does not establish who said what. Do not penalize the notes for the speaker information the transcript itself provides, but do penalize any name or ownership that appears nowhere in it.";

  const result = await generate({
    model: JUDGE_MODEL,
    policy: {
      role: "system",
      content: `You are a strict evaluator of meeting notes. You receive a meeting transcript and the notes generated from it, and you score the notes against the transcript on a 0-100 scale for each criterion:
- faithfulness: is every claim in the notes supported by the evidence you were given? Penalize hallucinated facts, invented names, dates, figures and decisions, and wrong attribution of who said or owns something, hard. ${attributionRule}
- coverage: are the meeting's important topics, outcomes and commitments present, and are the next steps complete? Penalize omissions.
- clarity: are the notes well structured, concise and readable on their own, without the transcript?
- overall: your holistic score for the notes. It must not exceed the faithfulness score.
Never reward length. Short accurate notes beat long speculative ones. Write 'reasoning' entirely in ${lang}, at most 120 words, naming the concrete weaknesses you found.`,
    },
    content: `Meeting transcript:\n${transcript}${
      hasSpeakers ? speakerBlock(speaker_transcripts!) : ""
    }\n\nGenerated meeting notes${
      variant ? ` (variant ${variant})` : ""
    }:\n${stringifySummary(summary)}`,
    json_format:
      '{ faithfulness: <0-100>, coverage: <0-100>, clarity: <0-100>, overall: <0-100>, reasoning: "<at most 120 words>" }',
    max_tokens: 1024,
    meta,
  });

  const scored = unwrapResult(result, [
    "faithfulness",
    "coverage",
    "clarity",
    "overall",
  ]) as {
    faithfulness?: number;
    coverage?: number;
    clarity?: number;
    overall?: number;
    reasoning?: string;
  };

  return {
    variant: variant ?? null,
    faithfulness: clampScore(scored.faithfulness),
    coverage: clampScore(scored.coverage),
    clarity: clampScore(scored.clarity),
    overall: clampScore(scored.overall),
    reasoning: scored.reasoning,
  };
}

export default { run };
