import { generate } from "../lib/llm";
import type { LLMMeta } from "../lib/llmLog";
import { unwrapResult } from "../lib/llmResult";

/**
 * Variant A of the summarizer A/B test: the meeting is summarized from the
 * combined transcript alone, with no per-participant recording. Variant B
 * (summarize_meeting_by_speaker) deliberately keeps its own prompt - the two
 * arms are compared against each other, so neither may drift with the other.
 *
 * Both arms must run on the same model, otherwise the comparison measures the
 * model rather than the summarizer.
 */
const SUMMARY_MODEL =
  process.env.SUMMARY_LLM_MODEL || "qwen/qwen3-next-80b-a3b-instruct";

const PROMPT = `Sen, toplantı transkriptlerini analiz edip profesyonel toplantı notları çıkaran bir asistansın.

Sana ###TRANSKRIPT### etiketleri arasında bir toplantının tam konuşma metni verilecek. Bu metinde konuşmalar konuşmacılara ayrılmamıştır; kim ne demiş bilgisi yalnızca metnin kendisinde açıkça geçiyorsa vardır.

Metni analiz et ve çıktıyı TAMAMEN TÜRKÇE olarak üç bölüm halinde üret:

summary: Toplantının amacını, konuşulan ana konuları ve nasıl sonuçlandığını anlatan 3-5 cümlelik akıcı bir paragraf.

bullet_points: Toplantıda ele alınan konuların madde madde dökümü. Her madde tek cümlelik, kendi başına anlaşılır bir bilgi olsun; konuşma sırasını takip et. En az 3, en fazla 10 madde.

highlights: Toplantının öne çıkan noktaları - alınan kararlar, önemli talepler, riskler ve kritik rakamlar. bullet_points'in kısaltılmış hali değil, içlerinden en çok önem taşıyanların vurgusu olsun. En fazla 5 madde.

KURALLAR:
1. Yalnızca transkriptte geçen bilgileri kullan; isim, tarih, sayı, fiyat veya karar ASLA uydurma.
2. Transkript hangi dilde olursa olsun çıktıyı Türkçe yaz; ürün, şirket ve kişi adlarını olduğu gibi bırak.
3. Tarafsız ve profesyonel bir dil kullan; kendi yorumunu veya değerlendirmeni ekleme.
4. Selamlaşma, hal hatır sorma gibi işle ilgisi olmayan kısımları dahil etme.
5. Emin olmadığın bir bilgiyi kesinmiş gibi yazma; belirsiz kalan maddeleri atla.
6. Bir işi kimin üstlendiği transkriptte açıkça geçmiyorsa o kişiyi tahmin etme.
7. Aksiyon maddesi veya sonraki adım listesi üretme; bu varyantta yalnızca yukarıdaki üç bölüm vardır.`;

async function run({
  parameters: { transcript },
  meta,
}: {
  parameters: {
    transcript?: string;
  };
  meta?: LLMMeta;
}) {
  if (!transcript) {
    return { error: "transcript is required" };
  }

  const result = await generate({
    model: SUMMARY_MODEL,
    policy: { role: "system", content: PROMPT },
    content: `###TRANSKRIPT###\n${transcript}\n###TRANSKRIPT###`,
    json_format:
      '{ "summary": "<3-5 cümlelik paragraf>", "bullet_points": ["<tek cümlelik madde>"], "highlights": ["<öne çıkan nokta>"] }',
    max_tokens: 4096,
    meta,
  });

  const { summary, bullet_points, highlights } = unwrapResult(result, [
    "summary",
    "bullet_points",
    "highlights",
  ]) as {
    summary?: string;
    bullet_points?: string[];
    highlights?: string[];
  };

  if (!summary) {
    return { error: "The model did not return a meeting summary" };
  }

  return {
    summary,
    bullet_points: bullet_points ?? [],
    highlights: highlights ?? [],
  };
}

export default { run };
