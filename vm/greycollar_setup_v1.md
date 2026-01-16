# Greycollar Server Kurulum Dokümantasyonu - Versiyon 1

## Amaç

Bu doküman, Greycollar Server'ın **ilk kurulum ve doğrulama** aşaması içindir. Bu versiyonda amaç:

✓ Tüm servislerin başarıyla başlatılması  
✓ Servislerin düzgün çalıştığının doğrulanması  
✓ Port ve network bağlantılarının test edilmesi

**Not:** Bu versiyon sadece kurulum doğrulaması içindir. Üretim ortamı konfigürasyonları sonraki versiyonlarda eklenecektir.

---

## Kurulum Dosyaları

Kurulum için aşağıdaki 2 dosyanın aynı dizinde bulunması gerekmektedir:

1. `docker-compose.yml` - Docker servis tanımları
2. `filebeat.yml` - Log toplama konfigürasyonu

---

## Kurulum Adımları

### 1. Dosyaları Hazırlayın

`docker-compose.yml` ve `filebeat.yml` dosyalarını aynı dizine yerleştirin.

### 2. Servisleri Başlatın

```bash
docker compose up -d
```

### 3. Kurulumu Doğrulayın

**Container durumlarını kontrol edin:**

```bash
docker compose ps
```

Tüm servislerin `STATUS` sütununda `Up` yazmalıdır.

**Tüm servislerin loglarını görüntüleyin:**

```bash
docker compose logs -f
```

**Belirli bir servisin logunu görüntüleyin:**

```bash
docker compose logs -f greycollar-land
```

---

## Servis Doğrulama Kontrolü

Her servisin çalıştığını doğrulamak için aşağıdaki kontrolleri yapın:

### 1. PostgreSQL Kontrolü

```bash
# Container çalışıyor mu?
docker ps | grep postgres-greycollar

# Veritabanına bağlan
docker exec -it postgres-greycollar psql -U greyadmin -d greycollar-land -c "SELECT version();"
```

### 2. Elasticsearch Kontrolü

```bash
# HTTP isteği ile kontrol
curl http://localhost:9200/_cluster/health?pretty
```

Beklenen yanıt: `"status" : "yellow"` veya `"green"`

### 3. Kibana Kontrolü

```bash
# HTTP isteği ile kontrol
curl http://localhost:5601/api/status
```

Tarayıcıdan: http://localhost:5601

### 4. Prometheus Kontrolü

```bash
# HTTP isteği ile kontrol
curl http://localhost:9090/-/healthy
```

Tarayıcıdan: http://localhost:9090

### 5. Grafana Kontrolü

```bash
# HTTP isteği ile kontrol
curl http://localhost:3001/api/health
```

Tarayıcıdan: http://localhost:3001

### 6. Filebeat Kontrolü

```bash
# Container çalışıyor mu?
docker ps | grep filebeat

# Logları kontrol et
docker compose logs filebeat | tail -20
```

### 7. Pushgateway Kontrolü

```bash
# HTTP isteği ile kontrol
curl http://localhost:9091/metrics
```

---

## Servis Erişim Bilgileri

| Servis         | Port | URL                   | Durum Kontrolü                               |
| -------------- | ---- | --------------------- | -------------------------------------------- |
| Greycollar     | 3000 | http://localhost:3000 | Tarayıcıdan erişim                           |
| Communication  | 3003 | http://localhost:3003 | Tarayıcıdan erişim                           |
| Grafana        | 3001 | http://localhost:3001 | `curl localhost:3001/api/health`             |
| Kibana         | 5601 | http://localhost:5601 | `curl localhost:5601/api/status`             |
| Prometheus     | 9090 | http://localhost:9090 | `curl localhost:9090/-/healthy`              |
| Elasticsearch  | 9200 | http://localhost:9200 | `curl localhost:9200/_cluster/health`        |
| PostgreSQL     | 5432 | localhost:5432        | `docker exec postgres-greycollar pg_isready` |
| Inmemory Queue | 8080 | http://localhost:8080 | Tarayıcıdan erişim                           |
| Pushgateway    | 9091 | http://localhost:9091 | `curl localhost:9091/metrics`                |

---

## Yönetim Komutları

**Servisleri durdur:**

```bash
docker compose stop
```

**Servisleri başlat:**

```bash
docker compose start
```

**Servisleri yeniden başlat:**

```bash
docker compose restart
```

**Belirli bir servisi yeniden başlat:**

```bash
docker compose restart greycollar-land
```

**Tüm servisleri kaldır (volumes dahil):**

```bash
docker compose down -v
```

**Servis durumunu detaylı gör:**

```bash
docker compose ps -a
```

---

## Sorun Giderme

### Servis başlamıyorsa:

```bash
# Servis loglarını kontrol edin
docker compose logs [servis-adı]

# Örnek:
docker compose logs greycollar-land
docker compose logs postgres-greycollar
```

### Port çakışması varsa:

`docker-compose.yml` dosyasındaki ilgili servisin ports bölümünü düzenleyin.

### Veritabanı bağlantı sorunu:

```bash
# PostgreSQL loglarını kontrol edin
docker compose logs postgres-greycollar

# PostgreSQL'e bağlanıp test edin
docker exec -it postgres-greycollar psql -U greyadmin -d greycollar-land
```

### Elasticsearch başlamıyorsa:

```bash
# vm.max_map_count ayarını yapın (Linux için)
sudo sysctl -w vm.max_map_count=262144
```

### Tamamen temiz kurulum için:

```bash
docker compose down -v
docker compose up -d
```

---

## Veritabanı Bilgileri (Test Ortamı)

- **Kullanıcı:** greyadmin
- **Şifre:** eyuTSfZ4vJmxWfDz
- **Veritabanı:** greycollar-land
- **Port:** 5432

⚠️ **UYARI:** Bu bilgiler sadece test ortamı içindir. Üretim ortamında mutlaka güçlü bir şifre kullanın!

---

## Başarılı Kurulum Kriterleri

Kurulumun başarılı olduğunu anlamak için:

✅ `docker compose ps` komutu tüm servisleri `Up` olarak göstermeli  
✅ Yukarıdaki HTTP kontrol komutları başarılı yanıt vermeli  
✅ Servis loglarında kritik hata olmamalı  
✅ Tüm portlar dinleme durumunda olmalı

---

## Notlar

- İlk başlatmada tüm servislerin hazır olması 2-3 dakika sürebilir
- Elasticsearch ve Kibana'nın başlaması diğer servislere göre daha uzun sürer
- Filebeat, container loglarını otomatik olarak Elasticsearch'e gönderir
- Grafana varsayılan kullanıcı adı: `admin`, şifre: `admin` (ilk girişte değiştirin)
- **Bu versiyon sadece kurulum doğrulaması içindir**

---

**Doküman Versiyonu:** 1.0  
**Son Güncelleme:** Ocak 2026  
**Hazırlayan:** Greycollar Teknik Ekip
