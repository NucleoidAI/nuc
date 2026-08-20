import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";
import { unwrapResult } from "../lib/llmResult";

const JUDGE_MODEL =
  process.env.JUDGE_LLM_MODEL || "qwen/qwen3-next-80b-a3b-instruct";

function stringifySummary(summary: unknown): string {
  if (typeof summary === "string") return summary;
  return JSON.stringify(summary, null, 2);
}

type Highlight = { topic: string; highlights: string[] };

function valueFromSummary(summary: unknown, key: string): unknown {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return undefined;
  }
  return (summary as Record<string, unknown>)[key];
}

function speakerBlock(
  speakerTranscripts: { id: string; transcript: string }[]
): string {
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

async function run({
  parameters: {
    transcript,
    summary,
    highlights,
    next_steps,
    speaker_transcripts,
    variant,
  },
  meta,
}: {
  parameters: {
    transcript?: string;
    summary?: unknown;
    highlights?: Highlight[];
    next_steps?: string[];
    speaker_transcripts?: { id: string; transcript: string }[];
    variant?: string;
  };
  meta?: LLMMeta;
}) {
  if (!transcript) {
    return { error: "transcript is required (the full meeting transcript)" };
  }

  if (!summary) {
    return { error: "summary is required (the generated meeting notes)" };
  }

  const normalizedVariant = variant?.trim().toUpperCase();
  const evaluatesNextSteps = normalizedVariant !== "A";
  const suppliedHighlights =
    highlights ?? (valueFromSummary(summary, "highlights") as Highlight[]);
  const suppliedNextSteps =
    next_steps ?? (valueFromSummary(summary, "next_steps") as string[]);
  const suppliedSummary = valueFromSummary(summary, "summary") ?? summary;

  if (suppliedHighlights === undefined) {
    return {
      error: "highlights is required (from the generated meeting notes)",
    };
  }

  if (evaluatesNextSteps && suppliedNextSteps === undefined) {
    return {
      error: "next_steps is required for variants that generate next steps",
    };
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
    max_tokens: 1024,
    meta,
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

  return {
    variant: variant ?? null,
    meeting_summary: clampScore(scored.meeting_summary),
    next_steps: evaluatesNextSteps ? clampScore(scored.next_steps) : null,
    topics: clampScore(scored.topics),
    highlights: clampScore(scored.highlights),
    overall: Math.min(clampScore(scored.overall), accuracy),
    accuracy,
    reasoning: scored.reasoning,
  };
}

export default { run };
