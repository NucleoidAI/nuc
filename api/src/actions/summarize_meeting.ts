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

Aşağıda ###TRANSKRIPT### etiketleri arasında bir toplantının tam konuşma metni yer alıyor.
Bu metni analiz et ve çıktıyı TAMAMEN TÜRKÇE olarak, tam olarak aşağıdaki yapıda üret:

# [Toplantıyı özetleyen 2-4 kelimelik kısa bir başlık]

## Toplantı Özeti
[Toplantının amacını, konuşulan ana konuları ve nasıl sonuçlandığını anlatan 3-5 cümlelik akıcı bir paragraf.]

## Konular ve Öne Çıkanlar
[Toplantıda ele alınan ana konuları numaralandırarak listele (1., 2., 3. ...).
Her konunun altına o konudaki önemli noktaları, talepleri, önerileri ve alınan kararları
1-3 madde halinde yaz.]

KURALLAR:
1. Yalnızca transkriptte geçen bilgileri kullan; isim, tarih, sayı, fiyat veya karar ASLA uydurma.
2. Transkript hangi dilde olursa olsun çıktıyı Türkçe yaz; ürün, şirket ve kişi adlarını olduğu gibi bırak.
3. Tarafsız ve profesyonel bir dil kullan; kendi yorumunu veya değerlendirmeni ekleme.
4. Selamlaşma, hal hatır sorma gibi işle ilgisi olmayan kısımları özete dahil etme.
5. Emin olmadığın bir bilgiyi kesinmiş gibi yazma; belirsiz kalan maddeleri atla.
6. Çıktıya yukarıdaki yapı dışında hiçbir giriş, açıklama veya kapanış cümlesi ekleme.`;

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
      '{ "summary": "<3-5 cümlelik paragraf>", "highlights": [{ "topic": "<konu başlığı>", "highlights": ["<bu konuyla ilgili öne çıkan nokta>"] }] }',
    max_tokens: 4096,
    meta,
  });

  const { summary, highlights } = unwrapResult(result, [
    "summary",
    "highlights",
  ]) as {
    summary?: string;
    highlights?: { topic: string; highlights: string[] }[];
  };

  if (!summary) {
    return { error: "The model did not return a meeting summary" };
  }

  return {
    summary,
    highlights: highlights ?? [],
  };
}

export default { run };
