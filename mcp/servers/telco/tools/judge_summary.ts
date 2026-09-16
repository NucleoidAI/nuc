import {
  JudgeSummaryInput,
  MeetingHighlight,
  SpeakerTranscript,
  Tool,
} from "./types";
import { toolError, toolResult } from "./meeting_result";

import { generate } from "../../../lib/llm";
import logger from "../../../logger/logger.js";
import { unwrapResult } from "../../../lib/llm/llmResult";

const JUDGE_MODEL = process.env.JUDGE_LLM_MODEL || "qwen/qwen3.8-27b";

function stringifySummary(summary: unknown): string {
  if (typeof summary === "string") return summary;
  return JSON.stringify(summary, null, 2);
}

function valueFromSummary(summary: unknown, key: string): unknown {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return undefined;
  }
  return (summary as Record<string, unknown>)[key];
}

function speakerBlock(speakerTranscripts: SpeakerTranscript[]): string {
  const speakers = speakerTranscripts
    .filter(({ transcript }) => transcript)
    .map(({ id, transcript }) => `[${id}]\n${transcript}`)
    .join("\n\n");
  return `\n\nHer katılımcının kimliğiyle etiketlenmiş bireysel kaydı:\n${speakers}`;
}

function clampScore(value: unknown): number {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const judgeSummaryTool: Tool<JudgeSummaryInput> = {
  name: "TELCO:judge_summary",
  description:
    "Evaluate meeting notes with a Turkish LLM judge prompt. Returns 0-100 scores for the meeting summary, next steps, topics, highlights, overall quality and accuracy, plus a short Turkish justification. Next steps are not evaluated for variant A because that variant does not generate them.",
  inputSchema: {
    type: "object",
    properties: {
      transcript: {
        type: "string",
        description:
          "The meeting transcript the notes are judged against. Pass full_meeting_transcript from transcribe_meeting through unchanged.",
      },
      summary: {
        description:
          "The generated meeting summary text. For backward compatibility, the whole summarization result object is also accepted.",
      },
      highlights: {
        type: "array",
        description:
          "The highlights array from the summarization step. Pass it through unchanged so topics and highlights can be evaluated.",
        items: {
          type: "object",
          properties: {
            topic: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
          },
          required: ["topic", "highlights"],
        },
      },
      next_steps: {
        type: "array",
        description:
          "The next_steps array from the summarization step. Required at runtime for variants that generate next steps; omit it for variant A.",
        items: { type: "string" },
      },
      speaker_transcripts: {
        type: "array",
        description:
          "Optional. Each participant's individual transcript from transcribe_meeting. Pass it whenever the summary attributes statements or next steps to specific speakers, so the judge can verify those attributions instead of marking them unsupported - the combined transcript alone carries no speaker labels.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            transcript: { type: "string" },
          },
          required: ["id", "transcript"],
        },
      },
      variant: {
        type: "string",
        description:
          "Label of the summarization variant being judged (e.g. 'A', 'B'), echoed back in the output.",
      },
    },
    required: ["transcript", "summary", "highlights"],
  },
  handler: async ({
    transcript,
    summary,
    highlights,
    next_steps,
    speaker_transcripts,
    variant,
  }: JudgeSummaryInput) => {
    try {
      if (!transcript) {
        return toolResult({
          error: "transcript is required (the full meeting transcript)",
        });
      }

      if (!summary) {
        return toolResult({
          error: "summary is required (the generated meeting notes)",
        });
      }

      const normalizedVariant = variant?.trim().toUpperCase();
      const evaluatesNextSteps = normalizedVariant !== "A";
      const suppliedHighlights =
        highlights ??
        (valueFromSummary(summary, "highlights") as MeetingHighlight[]);
      const suppliedNextSteps =
        next_steps ?? (valueFromSummary(summary, "next_steps") as string[]);
      const suppliedSummary = valueFromSummary(summary, "summary") ?? summary;

      if (suppliedHighlights === undefined) {
        return toolResult({
          error: "highlights is required (from the generated meeting notes)",
        });
      }

      if (evaluatesNextSteps && suppliedNextSteps === undefined) {
        return toolResult({
          error:
            "next_steps is required for variants that generate next steps",
        });
      }

      // Variant B attributes statements using each participant's own recording. If
      // the judge only saw the unlabeled combined transcript it would mark every
      // attribution as unsupported, so the same evidence is handed to the judge.
      const hasSpeakers = Boolean(speaker_transcripts?.length);

      const attributionRule = hasSpeakers
        ? "Katılımcıların bireysel kayıtları da verilmiştir. Kimin ne söylediği ve sonraki adımın kime ait olduğu dahil bütün atıfları bu kayıtlarla doğrula. Birleşik transkript konuşmacı etiketi içermese bile bireysel kayıtların desteklediği atıfları doğru kabul et."
        : "Transkript konuşmacı etiketi içermediğinden kimin ne söylediğini tek başına kanıtlamaz. Notları, transkriptin zaten sağladığı konuşmacı bilgileri için cezalandırma; fakat kanıtlarda hiç bulunmayan kişi adlarını veya sorumluluk atıflarını cezalandır.";

      const nextStepsRule = evaluatesNextSteps
        ? "- next_steps (Sonraki Adımlar): Aksiyonlar, sorumlular, teslim tarihleri ve taahhütler eksiksiz ve doğru mu? Toplantıda kararlaştırılan ancak notlarda yer almayan adımları puandan düş."
        : "- A varyantı tasarım gereği sonraki adım üretmez. next_steps alanını değerlendirme ve bu eksikliği hiçbir puana olumsuz yansıtma.";

      logger.info(
        { tool: "TELCO:judge_summary", model: JUDGE_MODEL, variant: variant ?? null },
        "Judging meeting summary",
      );

      const result = await generate({
        model: JUDGE_MODEL,
        policy: {
          role: "system",
          content: `Sen, toplantı notlarını titizlikle değerlendiren bağımsız bir LLM hakemisin. Sana toplantı transkripti ile bu transkriptten üretilen notlar verilecek. Notları yalnızca verilen kanıtlara göre, aşağıdaki ölçütlerin her biri için 0-100 arasında puanla:
- meeting_summary (Toplantı Özeti): Özet; toplantının amacı, önemli gelişmeleri, kararları ve sonuçları doğru, dengeli ve öz biçimde yansıtıyor mu?
${nextStepsRule}
- topics (Konular): Toplantıda ele alınan ana konular eksiksiz, doğru ayrıştırılmış ve uygun başlıklarla sunulmuş mu?
- highlights (Öne Çıkanlar): Kritik kararlar, önemli bilgiler, riskler ve dikkat gerektiren noktalar doğru seçilmiş mi? Önemsiz ayrıntıları öne çıkarma, önemli eksikleri cezalandır.
- overall (Genel Değerlendirme): Geçerli ölçütleri birlikte düşünerek notların bütünsel kullanılabilirliğini puanla. A varyantında Sonraki Adımlar bu hesaba katılmamalıdır.
- accuracy (Doğruluk): Notlardaki her iddia verilen kanıtlarla destekleniyor mu? Uydurulan olay, kişi, tarih, sayı ve kararları; ayrıca yanlış konuşmacı veya sorumlu atıflarını ağır biçimde cezalandır. ${attributionRule}

Uzunluğu ödüllendirme; kısa ve doğru notlar, uzun ve spekülatif notlardan daha değerlidir. overall puanı accuracy puanını geçemez. reasoning alanını tamamen Türkçe, somut, yapıcı ve en fazla 150 kelime olarak yaz. Yalnızca istenen JSON nesnesini döndür.`,
        },
        content: `TOPLANTI TRANSKRİPTİ:\n${transcript}${
          hasSpeakers ? speakerBlock(speaker_transcripts!) : ""
        }\n\nÜRETİLEN TOPLANTI NOTLARI${
          variant ? ` (Varyant ${variant})` : ""
        }:\n${stringifySummary({
          summary: suppliedSummary,
          highlights: suppliedHighlights,
          ...(evaluatesNextSteps ? { next_steps: suppliedNextSteps } : {}),
        })}`,
        json_format: evaluatesNextSteps
          ? '{ meeting_summary: <0-100>, next_steps: <0-100>, topics: <0-100>, highlights: <0-100>, overall: <0-100>, accuracy: <0-100>, reasoning: "<Türkçe, en fazla 150 kelime>" }'
          : '{ meeting_summary: <0-100>, topics: <0-100>, highlights: <0-100>, overall: <0-100>, accuracy: <0-100>, reasoning: "<Türkçe, en fazla 150 kelime>" }',
        // Reasoning models bill their thinking against max_tokens, so a budget
        // sized for the ~300-token verdict alone gets consumed entirely by the
        // thinking block and returns empty content.
        max_tokens: 8192,
      });

      const requiredScores = [
        "meeting_summary",
        ...(evaluatesNextSteps ? ["next_steps"] : []),
        "topics",
        "highlights",
        "overall",
        "accuracy",
      ];
      const scored = unwrapResult(result, requiredScores) as {
        meeting_summary?: number;
        next_steps?: number;
        topics?: number;
        highlights?: number;
        overall?: number;
        accuracy?: number;
        reasoning?: string;
      };
      const accuracy = clampScore(scored.accuracy);

      return toolResult({
        variant: variant ?? null,
        meeting_summary: clampScore(scored.meeting_summary),
        next_steps: evaluatesNextSteps ? clampScore(scored.next_steps) : null,
        topics: clampScore(scored.topics),
        highlights: clampScore(scored.highlights),
        overall: Math.min(clampScore(scored.overall), accuracy),
        accuracy,
        reasoning: scored.reasoning,
      });
    } catch (error) {
      logger.error(
        {
          tool: "TELCO:judge_summary",
          err: error instanceof Error ? error : new Error(String(error)),
        },
        "Failed to judge meeting summary",
      );

      return toolError(error);
    }
  },
};
