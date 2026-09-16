import {
  MeetingHighlight,
  SpeakerTranscript,
  SummarizeMeetingBySpeakerInput,
  Tool,
} from "./types";
import { toolError, toolResult } from "./meeting_result";

import { generate } from "../../../lib/llm";
import logger from "../../../logger/logger.js";
import { unwrapResult } from "../../../lib/llm/llmResult";

/**
 * Variant B of the summarizer A/B test: on top of the combined transcript the
 * model receives every participant's own recording, so it can attribute what
 * was said and who owns each next step. Variant A (summarize_meeting)
 * deliberately keeps its own prompt - the two arms are compared against each
 * other, so neither may drift with the other.
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

## Sonraki Adımlar
[Toplantıda kararlaştırılan somut aksiyon maddelerini listele. Her madde
"- [Sorumlu kişi], [yapılacak iş]" formatında olsun; metinde son tarih geçiyorsa cümleye ekle
(örn. "... ve Cuma gününe kadar dönüş yapacak"). Sorumlu kişi alanına, işi üstlenen
konuşmacının ###KONUSMACI_KAYITLARI### bölümündeki kimliğini (örn. 16778240) aynen yaz;
oraya isim yazma, isim uydurma veya tahmin etme. İşi hangi konuşmacının üstlendiğini
kayıtlardan tespit edemiyorsan bu maddeyi yazma. Metinden net bir anlam cikmiyorsa buraya yazma]

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
6. Çıktıya yukarıdaki yapı dışında hiçbir giriş, açıklama veya kapanış cümlesi ekleme.
7. Sonraki Adımlar'daki sorumlu alanında yalnızca konuşmacı kimliğini kullan; bu kimlikler
sonraki adımda gerçek isimlerle değiştirilecektir, bu yüzden ismi sen yazmaya çalışma.`;

function speakerBlock(speakerTranscripts: SpeakerTranscript[]): string {
  const speakers = speakerTranscripts
    .map(({ id, transcript }) => `[${id}]\n${transcript}`)
    .join("\n\n");
  return `###KONUSMACI_KAYITLARI###\n${speakers}\n###KONUSMACI_KAYITLARI###`;
}

export const summarizeMeetingBySpeakerTool: Tool<SummarizeMeetingBySpeakerInput> =
  {
    name: "TELCO:summarize_meeting_by_speaker",
    description:
      "Summarize a meeting into a structured Turkish summary: an overall summary paragraph, the highlights, and the next steps. Receives both the combined transcript and each participant's own recording, so statements and next step owners are attributed to the right speaker",
    inputSchema: {
      type: "object",
      properties: {
        full_meeting_transcript: {
          type: "string",
          description:
            "Combined transcript from transcribe_meeting, giving the chronological flow of the meeting.",
        },
        speaker_transcripts: {
          type: "array",
          description:
            "Each participant's individual transcript, from transcribe_meeting's output. Pass this array through unchanged - it is what makes speaker attribution possible.",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              transcript: { type: "string" },
            },
            required: ["id", "transcript"],
          },
        },
      },
      required: ["full_meeting_transcript", "speaker_transcripts"],
    },
    handler: async ({
      full_meeting_transcript,
      speaker_transcripts,
    }: SummarizeMeetingBySpeakerInput) => {
      try {
        if (!full_meeting_transcript) {
          return toolResult({
            error:
              "full_meeting_transcript is required (combined transcript from transcribe_meeting)",
          });
        }

        if (!speaker_transcripts?.length) {
          return toolResult({
            error:
              "speaker_transcripts is required (array of { id, transcript } from transcribe_meeting)",
          });
        }

        logger.info(
          {
            tool: "TELCO:summarize_meeting_by_speaker",
            model: SUMMARY_MODEL,
            speakers: speaker_transcripts.length,
          },
          "Summarizing meeting with speaker attribution",
        );

        const result = await generate({
          model: SUMMARY_MODEL,
          policy: { role: "system", content: PROMPT },
          content: `###TRANSKRIPT###\n${full_meeting_transcript}\n###TRANSKRIPT###\n\n${speakerBlock(
            speaker_transcripts,
          )}`,
          json_format:
            '{ "summary": "<3-5 cümlelik paragraf>", "highlights": [{ "topic": "<konu başlığı>", "highlights": ["<bu konuyla ilgili öne çıkan nokta>"] }], "next_steps": ["<sorumlu konuşmacı kimliği>, <yapılacak iş>"] }',
          // Reasoning models (e.g. anthropic/claude-sonnet-5 via SUMMARY_LLM_MODEL) bill
          // their thinking against max_tokens, so a budget sized for the summary alone is
          // consumed entirely by the thinking block and returns empty content. Both A/B
          // arms must keep the same budget.
          max_tokens: 32768,
        });

        const { summary, highlights, next_steps } = unwrapResult(result, [
          "summary",
          "highlights",
          "next_steps",
        ]) as {
          summary?: string;
          highlights?: MeetingHighlight[];
          next_steps?: string[];
        };

        if (!summary) {
          return toolResult({
            error: "The model did not return a meeting summary",
          });
        }

        return toolResult({
          summary,
          highlights: highlights ?? [],
          next_steps: next_steps ?? [],
        });
      } catch (error) {
        logger.error(
          {
            tool: "TELCO:summarize_meeting_by_speaker",
            err: error instanceof Error ? error : new Error(String(error)),
          },
          "Failed to summarize meeting by speaker",
        );

        return toolError(error);
      }
    },
  };
