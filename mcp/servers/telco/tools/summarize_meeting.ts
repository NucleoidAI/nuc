import { MeetingHighlight, SummarizeMeetingInput, Tool } from "./types";
import { toolError, toolResult } from "./meeting_result";

import { generate } from "../../../lib/llm";
import logger from "../../../logger/logger.js";
import { unwrapResult } from "../../../lib/llm/llmResult";

/**
 * Variant A of the summarizer A/B test: the meeting is summarized from the
 * combined transcript alone, with no per-participant recording. Variant B
 * (summarize_meeting_by_speaker) deliberately keeps its own prompt - the two
 * arms are compared against each other, so neither may drift with the other.
 *
 * Both arms must run on the same model, otherwise the comparison measures the
 * model rather than the summarizer.
 */
const SUMMARY_MODEL = process.env.SUMMARY_LLM_MODEL || "qwen/qwen3.8-27b";

const PROMPT = `Sen, toplantı transkriptlerini analiz edip profesyonel toplantı notları çıkaran bir asistansın.

Aşağıda ###TRANSKRIPT### etiketleri arasında bir toplantının tam konuşma metni yer alıyor.
Bu metni analiz et ve çıktıyı TAMAMEN TÜRKÇE olarak, tam olarak aşağıdaki yapıda üret:

# [Toplantıyı özetleyen 2-4 kelimelik kısa bir başlık]

## Toplantı Özeti
[Toplantının amacını, konuşulan ana konuları ve nasıl sonuçlandığını anlatan 3-5 cümlelik akıcı bir paragraf.]

## Konular ve Öne Çıkanlar
[Toplantıda ele alınan önemli ana konuları ayrı konu başlıkları olarak listele.
Her konu başlığının altında yalnızca o konuyla ilgili önemli noktaları, talepleri,
önerileri ve alınan kararları 1-3 maddelik bir liste halinde yaz.]

KURALLAR:
1. Yalnızca transkriptte geçen bilgileri kullan; isim, tarih, sayı, fiyat veya karar ASLA uydurma.
2. Transkript hangi dilde olursa olsun çıktıyı Türkçe yaz; ürün, şirket ve kişi adlarını olduğu gibi bırak.
3. Tarafsız ve profesyonel bir dil kullan; kendi yorumunu veya değerlendirmeni ekleme.
4. Selamlaşma, hal hatır sorma gibi işle ilgisi olmayan kısımları özete dahil etme.
5. Emin olmadığın bir bilgiyi kesinmiş gibi yazma; belirsiz kalan maddeleri atla.
6. Çıktıya yukarıdaki yapı dışında hiçbir giriş, açıklama veya kapanış cümlesi ekleme.`;

export const summarizeMeetingTool: Tool<SummarizeMeetingInput> = {
  name: "TELCO:summarize_meeting",
  description:
    "Summarize a full meeting transcript into a structured Turkish summary: an overall summary paragraph and the highlights. Works from the combined transcript alone, with no per-speaker recording, and deliberately produces no next steps",
  inputSchema: {
    type: "object",
    properties: {
      transcript: {
        type: "string",
        description: "The full meeting transcript to turn into meeting notes.",
      },
    },
    required: ["transcript"],
  },
  handler: async ({ transcript }: SummarizeMeetingInput) => {
    try {
      if (!transcript) {
        return toolResult({ error: "transcript is required" });
      }

      logger.info(
        { tool: "TELCO:summarize_meeting", model: SUMMARY_MODEL },
        "Summarizing meeting transcript",
      );

      const result = await generate({
        model: SUMMARY_MODEL,
        policy: { role: "system", content: PROMPT },
        content: `###TRANSKRIPT###\n${transcript}\n###TRANSKRIPT###`,
        json_format:
          '{ "summary": "<3-5 cümlelik paragraf>", "highlights": [{ "topic": "<konu başlığı>", "highlights": ["<bu konuyla ilgili öne çıkan nokta>"] }] }',
        max_tokens: 32768,
      });

      const { summary, highlights } = unwrapResult(result, [
        "summary",
        "highlights",
      ]) as {
        summary?: string;
        highlights?: MeetingHighlight[];
      };

      if (!summary) {
        return toolResult({
          error: "The model did not return a meeting summary",
        });
      }

      return toolResult({
        summary,
        highlights: highlights ?? [],
      });
    } catch (error) {
      logger.error(
        {
          tool: "TELCO:summarize_meeting",
          err: error instanceof Error ? error : new Error(String(error)),
        },
        "Failed to summarize meeting",
      );

      return toolError(error);
    }
  },
};
