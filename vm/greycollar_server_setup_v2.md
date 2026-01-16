# Greycollar Server Kurulum Dokumantasyonu - Versiyon 2

## Amac

Bu dokuman, v1 kurulumunun uzerine eklenen **config ve env dosyalarinin kullanilmasi** ve **3000 portunda dashboard login** dogrulamasini kapsar.

---

## Kurulum Dosyalari

Zip dosyasinda gonderilen dosyalar oldugu gibi kullanilir. Ek bir env veya config degisikligi istenmez:

1. `docker-compose.yml`
2. `filebeat.yml`
3. `env.greycollar`
4. `config.communication.ts`
5. `config.api.ts`
6. `config.dashboard.js`

---

## Kurulum Adimlari

1. Dosyalari ayni dizine yerlestirin.
2. Servisleri baslatin:

```bash
docker compose up -d
```

---

## Beklenen Sonuc

Kurulumdan sonra **http://localhost:3000/dashboard** uzerinden login olunabilmelidir.

---

**Dokuman Versiyonu:** 2.0  
**Son Guncelleme:** Ocak 2026  
**Hazirlayan:** Greycollar Teknik Ekip
