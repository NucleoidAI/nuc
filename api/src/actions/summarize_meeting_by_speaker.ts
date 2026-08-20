import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";
import { unwrapResult } from "../lib/llmResult";

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
const SUMMARY_MODEL =
  process.env.SUMMARY_LLM_MODEL || "qwen/qwen3-next-80b-a3b-instruct";

const PROMPT = `Sen, toplantı transkriptlerini analiz edip profesyonel toplantı notları çıkaran bir asistansın.

Sana iki kaynak verilecek:
- ###TRANSKRIPT### etiketleri arasında toplantının tam konuşma metni, kronolojik sırayla.
- ###KONUSMACI_KAYITLARI### etiketleri arasında her katılımcının yalnızca kendi mikrofonundan alınan konuşma metni, kimliğiyle birlikte.

Kimin ne söylediğini konuşmacı kayıtlarından belirle, olayların sırasını tam transkriptten takip et.

Metinleri analiz et ve çıktıyı TAMAMEN TÜRKÇE olarak dört bölüm halinde üret:

summary: Toplantının amacını, konuşulan ana konuları ve nasıl sonuçlandığını anlatan 3-5 cümlelik akıcı bir paragraf. Bir görüşü veya öneriyi aktarırken sahibini belirt.

bullet_points: Toplantıda ele alınan konuların madde madde dökümü. Her madde tek cümlelik, kendi başına anlaşılır bir bilgi olsun; konuşma sırasını takip et ve konuşanı belirt. En az 3, en fazla 10 madde.

highlights: Toplantının öne çıkan noktaları - alınan kararlar, önemli talepler, riskler ve kritik rakamlar. bullet_points'in kısaltılmış hali değil, içlerinden en çok önem taşıyanların vurgusu olsun. En fazla 5 madde.

next_steps: Toplantıda kararlaştırılan somut aksiyon maddeleri. Her madde "[Sorumlu kişi], [yapılacak iş]" formatında olsun; metinde son tarih geçiyorsa cümleye ekle (örn. "... ve Cuma gününe kadar dönüş yapacak"). Sorumlusu söylenmemişse "Ekip" yaz.

KURALLAR:
1. Yalnızca transkriptte geçen bilgileri kullan; isim, tarih, sayı, fiyat veya karar ASLA uydurma.
2. Transkript hangi dilde olursa olsun çıktıyı Türkçe yaz; ürün, şirket ve kişi adlarını olduğu gibi bırak.
3. Tarafsız ve profesyonel bir dil kullan; kendi yorumunu veya değerlendirmeni ekleme.
4. Selamlaşma, hal hatır sorma gibi işle ilgisi olmayan kısımları dahil etme.
5. Emin olmadığın bir bilgiyi kesinmiş gibi yazma; belirsiz kalan maddeleri atla.
6. Konuşmacı kimliklerini kayıtlarda geçtiği gibi kullan; bir kimliği tahminle başka bir isme eşleme.`;

function speakerBlock(
  speakerTranscripts: { id: string; transcript: string }[]
): string {
  const speakers = speakerTranscripts
    .map(({ id, transcript }) => `[${id}]\n${transcript}`)
    .join("\n\n");
  return `###KONUSMACI_KAYITLARI###\n${speakers}\n###KONUSMACI_KAYITLARI###`;
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

  const result = await generate({
    model: SUMMARY_MODEL,
    policy: { role: "system", content: PROMPT },
    content: `###TRANSKRIPT###\n${full_meeting_transcript}\n###TRANSKRIPT###\n\n${speakerBlock(
      speaker_transcripts
    )}`,
    json_format:
      '{ "summary": "<3-5 cümlelik paragraf>", "bullet_points": ["<tek cümlelik madde>"], "highlights": ["<öne çıkan nokta>"], "next_steps": ["<sorumlu kişi>, <yapılacak iş>"] }',
    max_tokens: 4096,
    meta,
  });

  const { summary, bullet_points, highlights, next_steps } = unwrapResult(
    result,
    ["summary", "bullet_points", "highlights", "next_steps"]
  ) as {
    summary?: string;
    bullet_points?: string[];
    highlights?: string[];
    next_steps?: string[];
  };

  if (!summary) {
    return { error: "The model did not return a meeting summary" };
  }

  return {
    summary,
    bullet_points: bullet_points ?? [],
    highlights: highlights ?? [],
    next_steps: next_steps ?? [],
  };
}

export default { run };
