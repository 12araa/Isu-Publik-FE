<template>
  <div class="detail-wrapper">
    <!-- 1. HEADER / NAVBAR -->
    <header class="navbar">
      <div class="navbar-content">
        <h1 class="logo cursor-pointer" @click="router.push('/')">Jourly</h1>
        <div class="search-bar">
          <input type="text" placeholder="Cari Berita" />
          <button class="search-btn">🔍</button>
        </div>
      </div>
    </header>

    <!-- LOADING STATE -->
    <div v-if="isLoading" class="loading-state">
      Mengambil detail berita...
    </div>

    <!-- 2. MAIN LAYOUT (2 Kolom: Detail & Sidebar) -->
    <main v-else-if="detailIsu" class="main-layout">
      
      <!-- KOLOM KIRI (Konten Utama) -->
      <article class="main-content">
        <div class="date-header">
          Jourly Media - {{ formatTanggal(detailIsu.timestamp || detailIsu.waktu_post) }}
        </div>

        <!-- Gambar Utama -->
        <div class="main-image">
          <img
            v-if="urlGambar(detailIsu) && !gambarGagal.has('utama')"
            :src="urlGambar(detailIsu)"
            alt="Gambar Utama"
            @error="tandaiGambarGagal('utama')"
          />
          <div v-else class="image-placeholder">🖼️</div>
        </div>

        <!-- Judul & Meta -->
        <h1 class="topik-berita">{{ detailIsu.topik }}</h1>
        <div class="meta-pill">
          Kategori: {{ detailIsu.kategori || 'Umum' }} &nbsp;|&nbsp; Skor Viralitas: {{ formatSkorViralitas(detailIsu) }}
        </div>

        <!-- Hasil Ringkasan AI -->
        <section class="text-section">
          <h3>Hasil Ringkasan AI</h3>
          <p>{{ detailIsu.analisis_mendalam || detailIsu.ringkasan_ai || 'Ringkasan AI belum tersedia.' }}</p>
        </section>

        <!-- Teks Asli -->
        <section class="text-section">
          <h3>Teks Asli</h3>
          <p class="teks-asli">{{ teksAsli(detailIsu) || 'Teks asli tidak ditemukan.' }}</p>
        </section>

        <!-- Sumber -->
        <section class="source-section">
          <div class="source-header">Sumber:</div>
          <div class="source-links">
            <a
              v-for="(url, index) in daftarUrlSumber(detailIsu)"
              :key="url"
              :href="url"
              target="_blank" 
              rel="noopener noreferrer"
              class="source-btn"
            >
              <span v-if="daftarUrlSumber(detailIsu).length > 1">Postingan {{ index + 1 }} · </span>
              🔗 {{ detailIsu.sumber || detailIsu.platform || 'Lihat Postingan Asli' }}
            </a>
            <p v-if="daftarUrlSumber(detailIsu).length === 0" class="source-unavailable">Link sumber tidak tersedia.</p>
          </div>
        </section>
      </article>

      <!-- KOLOM KANAN (Isu Terkait) -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Isu Terkait</h2>
          <div class="underline"></div>
        </div>
        
        <div class="related-list">
          <div 
            v-for="terkait in isuTerkait" 
            :key="idIsu(terkait) || terkait.topik" 
            class="related-card"
            @click="lihatDetail(idIsu(terkait))"
          >
            <div class="related-image">
                <img
                  v-if="urlGambar(terkait) && !gambarGagal.has(`terkait-${idIsu(terkait)}`)"
                  :src="urlGambar(terkait)"
                  alt="Thumbnail"
                  @error="tandaiGambarGagal(`terkait-${idIsu(terkait)}`)"
                />
              <div v-else class="image-placeholder small">🖼️</div>
            </div>
            <p class="related-snippet">{{ terkait.topik || terkait.ringkasan_ai || teksAsli(terkait) }}</p>
          </div>
          <p v-if="isuTerkait.length === 0" class="related-empty">Belum ada isu terkait.</p>
        </div>
      </aside>

    </main>

    <!-- ERROR STATE -->
    <div v-else class="loading-state error">
      Berita tidak ditemukan atau terjadi kesalahan.
      <br><br>
      <button @click="router.push('/')" class="back-btn">Kembali ke Beranda</button>
    </div>

    <!-- 3. MAPS SECTION -->
    <section v-if="detailIsu" class="maps-section">
      <div class="map-heading">
        <div>
          <p class="map-eyebrow">LOKASI ISU</p>
          <h3>{{ lokasiIsu || 'Lokasi belum diketahui' }}</h3>
        </div>
        <a
          v-if="koordinatIsu"
          class="map-directions"
          :href="`https://www.google.com/maps?q=${koordinatIsu.latitude},${koordinatIsu.longitude}`"
          target="_blank"
          rel="noopener noreferrer"
        >Buka di Google Maps ↗</a>
      </div>
      <div v-if="!koordinatIsu" class="map-message">Koordinat lokasi belum tersedia untuk isu ini.</div>
      <div v-else-if="!mapboxToken" class="map-message">
        Token Mapbox belum terbaca. Pastikan variabel <code>VITE_MAPBOX_TOKEN</code> ada di <code>.env</code>, lalu jalankan ulang server Vite.
      </div>
      <template v-else>
        <div ref="mapContainer" class="mapbox-container" aria-label="Peta lokasi isu"></div>
        <p v-if="mapError" class="map-error" role="status">{{ mapError }}</p>
      </template>
      <p v-if="koordinatIsu" class="map-coordinates">
        {{ koordinatIsu.latitude.toFixed(5) }}, {{ koordinatIsu.longitude.toFixed(5) }}
      </p>
    </section>

    <!-- 4. FOOTER -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-col brand-col">
          <h2 class="footer-logo">Judul</h2>
          <p>Apa aja dlu deh</p>
          <div class="social-icons">
            <span>F</span> <span>I</span> <span>X</span> <span>Y</span>
          </div>
        </div>
        <div class="footer-col nav-col">
          <h3>Navigasi</h3>
          <div class="nav-grid">
            <a href="#">Berita Terbaru</a>
            <a href="#">Sedang Hangat</a>
            <a href="#">Rekomendasi</a>
            <a href="#">Politik</a>
            <a href="#">Teknologi</a>
            <a href="#">Olahraga</a>
            <a href="#">Otomotif</a>
            <a href="#">Bisnis</a>
            <a href="#">Gaya Hidup</a>
          </div>
        </div>
        <div class="footer-col about-col">
          <h3>Tentang Kami</h3>
          <p>
            Jourly adalah sebuah website penyedia berita terpercaya yang berkomitmen untuk menyajikan informasi yang akurat, jujur, dan ramah bagi pembaca. Kami percaya bahwa setiap orang berhak untuk mendapatkan informasi yang akurat dan dapat dipercaya.
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>Copyright 2023. Jourly Media - Website Berita Jujur dan Friendly - All Rights Reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import 'mapbox-gl/dist/mapbox-gl.css';

const route = useRoute();
const router = useRouter();

const detailIsu = ref(null);
const isuTerkait = ref([]);
const isLoading = ref(true);
const gambarGagal = ref(new Set());
const mapContainer = ref(null);
const mapError = ref('');
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
const toCoordinate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const rawCoordinates = computed(() => detailIsu.value?.koordinat ?? detailIsu.value?.coordinates ?? detailIsu.value?.coordenadas ?? null);
const koordinatIsu = computed(() => {
  const raw = rawCoordinates.value;
  if (!raw || typeof raw !== 'object') return null;
  const longitude = toCoordinate(raw.longitude ?? raw.lng ?? raw.lon);
  const latitude = toCoordinate(raw.latitude ?? raw.lat ?? raw.lattitude);
  if (longitude === null || latitude === null || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
  return { longitude, latitude };
});
const lokasiIsu = computed(() => detailIsu.value?.lokasi_teks || detailIsu.value?.koordinat?.nama_terdeteksi_mapbox || detailIsu.value?.nama_lokasi || '');
let mapInstance = null;
let mapRequestId = 0;
const idIsu = (isu) => isu?.id_qdrant ?? isu?.id_postingan ?? isu?.id ?? isu?._id;
const teksAsli = (isu) => isu?.caption || isu?.caption_asli || isu?.teks_asli || isu?.teks_asli_postingan || isu?.original_text || isu?.konten || isu?.teks || '';
const urlSumber = (isu) => isu?.url_post || isu?.url_postingan || isu?.permalink || isu?.link_postingan || '';
const daftarUrlSumber = (isu) => {
  const sumber = urlSumber(isu);
  const nilai = Array.isArray(sumber) ? sumber : [sumber];
  return [...new Set(nilai.flatMap((item) =>
    String(item || '').match(/https?:\/\/(?:(?!https?:\/\/)[^\s,;])+/gi) || []
  ).map((url) => url.replace(/[),.;]+$/, '')))];
};
const urlGambar = (isu) => isu?.url_gambar || isu?.image_url || isu?.gambar || '';
const formatSkorViralitas = (isu) => {
  const skor = Number(isu?.skor_viralitas);
  return Number.isFinite(skor) ? `${skor.toFixed(1)}%` : '0%';
};
const tandaiGambarGagal = (key) => {
  gambarGagal.value = new Set([...gambarGagal.value, key]);
};

const renderPeta = async () => {
  const requestId = ++mapRequestId;
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
  mapError.value = '';
  if (!koordinatIsu.value || !mapboxToken || !mapContainer.value) return;
  try {
    const { default: mapboxgl } = await import('mapbox-gl');
    if (requestId !== mapRequestId || !mapContainer.value || !koordinatIsu.value) return;
    mapboxgl.accessToken = mapboxToken;
    mapInstance = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [koordinatIsu.value.longitude, koordinatIsu.value.latitude],
      zoom: 13,
    });
    new mapboxgl.Marker({ color: '#1769aa' })
      .setLngLat([koordinatIsu.value.longitude, koordinatIsu.value.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(lokasiIsu.value || 'Lokasi isu'))
      .addTo(mapInstance);
    mapInstance.on('error', (event) => {
      if (event?.error) mapError.value = 'Peta gagal dimuat. Periksa token, URL restriction, dan koneksi internet.';
    });
  } catch (error) {
    console.error('Gagal menginisialisasi peta Mapbox:', error);
    mapError.value = 'Peta gagal diinisialisasi. Periksa konfigurasi token Mapbox.';
  }
};
watch([koordinatIsu, mapContainer], renderPeta, { flush: 'post' });

const muatDetailBerita = async (id) => {
  isLoading.value = true;
  detailIsu.value = null;
  isuTerkait.value = [];
  gambarGagal.value = new Set();
  try {
    let detailDariEndpoint = null;
    try {
      const response = await api.get(`/isu-publik/${encodeURIComponent(id)}`);
      if (response.data.status === 'success') {
        detailDariEndpoint = response.data.data;
      }
    } catch (error) {
      // Gunakan daftar isu sebagai fallback bila endpoint detail tidak tersedia.
      console.warn('Endpoint detail isu gagal, mencari dari daftar isu:', error);
    }

    const daftarResponse = await api.get('/isu-publik');
    const semuaIsu = daftarResponse.data.status === 'success' && Array.isArray(daftarResponse.data.data)
      ? daftarResponse.data.data
      : [];
    const isuDariDaftar = semuaIsu.find(isu => String(idIsu(isu)) === String(id));

    if (isuDariDaftar && detailDariEndpoint && typeof detailDariEndpoint === 'object') {
      const kolomDetailTerisi = Object.fromEntries(
        Object.entries(detailDariEndpoint).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );
      detailIsu.value = { ...isuDariDaftar, ...kolomDetailTerisi };
    } else {
      detailIsu.value = isuDariDaftar || detailDariEndpoint || null;
    }

    isuTerkait.value = semuaIsu
      .filter(isu => String(idIsu(isu)) !== String(id))
      .slice(0, 4);
  } catch (error) {
    console.error("Gagal memuat detail isu:", error);
    detailIsu.value = null;
  } finally {
    isLoading.value = false;
  }
};

const lihatDetail = (id) => {
  if (id === undefined || id === null || id === '') return;
  router.push({ name: 'detail-isu', params: { id: String(id) } });
};

const formatTanggal = (tanggal) => {
  if (!tanggal) return 'DD/MM/YYYY';
  const dateObj = new Date(tanggal);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

// Pantau perubahan URL (jika user mengklik isu terkait, halaman akan langsung refresh data baru)
watch(() => route.params.id, (newId) => {
  if (newId && newId !== 'undefined' && newId !== 'null') {
    muatDetailBerita(newId);
  } else {
    router.replace({ name: 'dashboard' });
  }
});

onMounted(() => {
  if (route.params.id && route.params.id !== 'undefined' && route.params.id !== 'null') {
    muatDetailBerita(route.params.id);
  } else {
    router.replace({ name: 'dashboard' });
  }
});

onBeforeUnmount(() => {
  mapRequestId += 1;
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});
</script>

<style scoped>
/* RESET & DASAR */
.detail-wrapper {
  font-family: 'Inter', 'Poppins', sans-serif;
  --blue-950: #102d4f;
  --blue-900: #153b66;
  --blue-700: #1769aa;
  --blue-100: #e7f2fc;
  --blue-50: #f3f8fd;
  min-height: 100vh;
  color: #203348;
  background: var(--blue-50);
}

/* NAVBAR (Bisa dipisah ke komponen terpisah agar tidak berulang) */
.navbar {
  background: linear-gradient(110deg, var(--blue-950), var(--blue-700));
  padding: 15px 40px;
  box-shadow: 0 3px 14px rgba(16, 45, 79, 0.18);
}
.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}
.search-bar {
  display: flex;
  background: white;
  border-radius: 20px;
  padding: 5px 15px;
  width: 300px;
  box-shadow: 0 2px 8px rgba(10, 38, 67, 0.12);
}
.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
}
.search-btn {
  background: none;
  border: none;
  color: var(--blue-700);
  cursor: pointer;
}

/* LAYOUT UTAMA (2 Kolom) */
.main-layout {
  max-width: 1200px;
  margin: 36px auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 0.85fr);
  gap: 28px;
  align-items: flex-start;
}
.main-content {
  min-width: 0;
  padding: 28px;
  border: 1px solid #e0ebf5;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px rgba(28, 74, 116, 0.07);
}
.sidebar {
  min-width: 0;
  padding: 24px;
  border: 1px solid #e0ebf5;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px rgba(28, 74, 116, 0.07);
}

/* KONTEN KIRI (Detail) */
.date-header {
  font-size: 12px;
  color: #71859a;
  margin-bottom: 16px;
}
.main-image {
  width: 100%;
  height: clamp(250px, 38vw, 420px);
  background-color: #e6f1fa;
  border-radius: 12px;
  margin-bottom: 26px;
  overflow: hidden;
}
.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
  color: #a0a0a0;
}
.image-placeholder.small {
  font-size: 30px;
}

.topik-berita {
  font-size: clamp(23px, 3vw, 32px);
  line-height: 1.25;
  color: var(--blue-950);
  margin: 0 0 15px 0;
  font-weight: bold;
}
.meta-pill {
  display: inline-block;
  background-color: var(--blue-100);
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--blue-900);
  margin-bottom: 26px;
  border: 1px solid #cfe2f2;
}
.text-section {
  margin-bottom: 30px;
}
.text-section h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: var(--blue-900);
}
.text-section p {
  font-size: 15px;
  line-height: 1.8;
  color: #52677b;
  text-align: left;
}
.teks-asli {
  font-style: italic;
}

.source-section {
  margin-top: 40px;
}
.source-header {
  background-color: var(--blue-100);
  padding: 12px 16px;
  border-radius: 10px;
  font-weight: bold;
  color: var(--blue-900);
  margin-bottom: 12px;
}
.source-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.source-unavailable {
  margin: 0;
  color: #718096;
  font-size: 14px;
}
.source-btn {
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  background-color: #f2f8fd;
  border: 1px solid #c8def0;
  padding: 10px 20px;
  border-radius: 20px;
  color: var(--blue-700);
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.2s;
}
.source-btn:hover {
  background-color: #e1effa;
  border-color: #9fc6e5;
}

/* KONTEN KANAN (Isu Terkait) */
.sidebar-header {
  text-align: left;
  margin-bottom: 20px;
}
.sidebar-header h2 {
  font-size: 20px;
  color: var(--blue-900);
  margin: 0 0 12px;
}
.sidebar-header .underline {
  height: 3px;
  width: 64px;
  background: var(--blue-600, #2582c4);
  border-radius: 2px;
}
.related-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.related-empty {
  color: #718096;
  font-size: 14px;
  text-align: center;
}
.related-card {
  cursor: pointer;
  padding: 12px;
  border: 1px solid #e0ebf5;
  border-radius: 12px;
  background: #fbfdff;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.related-card:hover {
  transform: translateY(-2px);
  border-color: #b7d4eb;
  box-shadow: 0 6px 16px rgba(28, 74, 116, 0.08);
}
.related-image {
  width: 100%;
  height: 145px;
  background-color: #e6f1fa;
  border-radius: 9px;
  margin-bottom: 12px;
  overflow: hidden;
}
.related-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.related-snippet {
  font-size: 13px;
  color: #52677b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* MAPS SECTION */
.maps-section {
  max-width: 1100px;
  margin: 60px auto;
  padding: 0 20px;
  text-align: left;
}
.map-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.map-eyebrow {
  margin: 0 0 5px;
  color: #6b8298;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.map-heading h3 { margin: 0; color: var(--blue-900); font-size: 19px; }
.map-directions { flex: 0 0 auto; color: var(--blue-700); font-size: 14px; font-weight: 600; text-decoration: none; }
.map-directions:hover { text-decoration: underline; }
.mapbox-container {
  width: 100%;
  height: 360px;
  background-color: #e6f1fa;
  border: 1px solid #d5e4f0;
  border-radius: 14px;
  overflow: hidden;
}
.map-message { padding: 22px; border: 1px solid #d5e4f0; border-radius: 12px; background: white; color: #52677b; }
.map-error { margin: 10px 0 0; color: #a23f3f; font-size: 13px; }
.map-coordinates { margin: 10px 0 0; color: #71859a; font-size: 12px; }

/* LAIN-LAIN */
.loading-state {
  text-align: center;
  padding: 100px 20px;
  color: #888;
  font-size: 16px;
}
.loading-state.error {
  color: #d9534f;
}
.back-btn {
  padding: 10px 20px;
  background-color: var(--blue-700);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

/* FOOTER (Sama seperti halaman sebelumnya) */
.footer {
  background: linear-gradient(110deg, var(--blue-950), #194d7c);
  color: white;
  margin-top: 80px;
}
.footer-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  gap: 40px;
  justify-content: space-between;
}
.footer-col h3 {
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 20px;
}
.brand-col h2 {
  font-size: 32px;
  margin: 0 0 10px 0;
}
.brand-col p {
  font-size: 14px;
  margin-bottom: 20px;
}
.social-icons span {
  display: inline-block;
  margin-right: 10px;
  font-weight: bold;
}
.nav-col .nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 20px;
}
.nav-grid a {
  color: white;
  text-decoration: none;
  font-size: 12px;
}
.about-col {
  flex: 0 0 35%;
}
.about-col p {
  font-size: 12px;
  line-height: 1.6;
}
.footer-bottom {
  background-color: rgba(5, 24, 44, 0.35);
  text-align: center;
  padding: 15px;
  font-size: 12px;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    margin: 24px auto;
  }
  .main-content,
  .sidebar {
    padding: 20px;
  }
  .footer-content {
    flex-direction: column;
    gap: 24px;
  }
  .about-col {
    flex-basis: auto;
  }
  .main-image {
    height: clamp(220px, 55vw, 360px);
  }
}
@media (max-width: 520px) {
  .navbar {
    padding: 14px 18px;
  }
  .navbar-content {
    gap: 14px;
  }
  .search-bar {
    width: min(60vw, 260px);
  }
  .main-layout {
    padding: 0 14px;
  }
  .main-content,
  .sidebar {
    padding: 16px;
  }
  .meta-pill {
    line-height: 1.6;
  }
}
</style>
