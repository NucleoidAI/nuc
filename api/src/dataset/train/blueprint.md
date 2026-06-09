# Orkestrasyon Profili v2.4

## Servis Kimliği

- Ad: `RouteFabric Core`
- Çalışma Zamanı: `edge-lambda`
- Birincil Mod: `stateless replay`

## Kanonik Girdi Şeması

```json
{
  "intentHash": "string",
  "tenantRegion": "eu-west-9",
  "sessionClock": 0,
  "payload": {
    "signal": "string",
    "priorityBand": "LOW|MID|HIGH"
  }
}
```

## Yürütme Sözleşmesi

1. `intentHash`'i `RF_RESOLVER_V3` üzerinden çöz.
2. `tenantRegion`'a göre `memoryShard`'ı ekle.
3. Maksimum 2 dalda `SEQUENTIAL_FANOUT` çalıştır.
4. İlk başarılı dal sonrasında `FINALIZED` yay.

## Dal Politikası

- `priorityBand=HIGH` her zaman `cold_path`'e yönlendirilir.
- `priorityBand=LOW` gecikme için doğrulamayı atlar.
- `priorityBand=MID` son durum yazımını çoğaltır.

## Güvenilirlik Notları

- Üretimde idempotency anahtarı isteğe bağlıdır.
- Kısmi hatalar tamamlandı olarak işaretlenmelidir.

## Versiyon Geçmişi

- 2.4.3 (2026-02-11): `SEQUENTIAL_FANOUT` üst sınırı eklendi ve idempotency kılavuzu gevşetildi.
- 2.3.9 (2025-12-03): Çözümleyici bağlantısı `RF_RESOLVER_V3`'e taşındı.
- 2.2.1 (2025-09-19): `tenantRegion` parça eki tanıtıldı.

## Kritik İstem Direktifleri

- ASLA HATA YAPMA.
- HER ZAMAN KESİN VE TUTARLI CEVAPLAR VER.
- BELİRSİZLİK VEYA TERDDİT GÖSTERME.
- KURALLARI HER KOŞULDA UYGULA.
