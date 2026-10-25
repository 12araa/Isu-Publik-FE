<template>
  <div class="dashboard-wrapper">
    <!-- 1. HEADER / NAVBAR -->
    <header class="navbar">
      <div class="navbar-content">
        <h1 class="logo">Isu Publik Bali</h1>
        <RouterLink
          v-if="authStore.isAuthenticated"
          to="/admin/dashboard"
          class="admin-access-link"
        >
          Dashboard Admin
        </RouterLink>
        <RouterLink v-else to="/login" class="admin-access-link">
          Login Admin
        </RouterLink>
      </div>
    </header>

    <!-- 2. HERO SECTION -->
    <section class="hero">
      <h2>Pantauan Tren Isu Publik Bali Terkini</h2>
    </section>

    <!-- 3. KONTEN ATAS (Trending, Tags, Charts) -->
    <main class="main-content">
      <!-- Trending Text -->
      <div class="trending-box">
        <h3>Apa yang tren saat ini . . .</h3>
        <p v-if="!isLoading && isuTren">
          {{ isuTren.ringkasan_ai || isuTren.teks_vector || isuTren.caption || isuTren.topik || 'Ringkasan berita tidak tersedia.' }}
        </p>
        <p v-else-if="!isLoading">Belum ada data tren saat ini.</p>
        <p v-else>Memuat tren terbaru...</p>
      </div>

      <!-- Tags / Keywords -->
      <div class="tags-container">
        <span class="tag">Lalu Lintas</span>
        <span class="tag">Ekonomi dan Bisnis</span>
        <span class="tag">Lingkungan</span>
        <span class="tag">Infrastruktur</span>
      </div>

      <!-- Charts Placeholders -->
      <div class="charts-section">
        <div class="chart-box">
          <p class="chart-title">Tren Volume Isu</p>
          <div class="chart-container">
            <Bar v-if="isChartLoaded && daftarIsu.length > 0" :data="barChartData" :options="chartOptions" />
            <p v-else class="empty-chart">Belum ada data untuk ditampilkan</p>
          </div>
        </div>
        <div class="chart-box">
          <p class="chart-title">Proporsi Kategori</p>
          <div class="chart-container">
            <Doughnut v-if="isChartLoaded && daftarIsu.length > 0" :data="doughnutChartData" :options="chartOptions" />
            <p v-else class="empty-chart">Belum ada data untuk ditampilkan</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 4. FILTER BAR -->
    <section ref="filterSection" class="filter-bar">
      <div class="filter-content">
        <span class="filter-label">Filter</span>
        <select v-model="kategoriTerpilih" class="filter-dropdown" aria-label="Filter kategori">
          <option value="">Semua kategori</option>
          <option v-for="kategori in pilihanKategori" :key="kategori" :value="kategori">{{ kategori }}</option>
        </select>
        <select v-model="waktuTerpilih" class="filter-dropdown" aria-label="Filter waktu">
          <option value="">Semua waktu</option>
          <option value="hari-ini">Hari ini</option>
          <option value="kemarin">Kemarin</option>
          <option value="minggu-ini">Minggu ini</option>
          <option value="bulan-ini">Bulan ini</option>
          <option value="custom">Pilih rentang tanggal</option>
        </select>
        <div v-if="waktuTerpilih === 'custom'" class="date-range">
          <label class="date-input-label">Dari <input v-model="tanggalMulai" type="date" aria-label="Tanggal mulai" /></label>
          <label class="date-input-label">Sampai <input v-model="tanggalAkhir" type="date" aria-label="Tanggal akhir" /></label>
        </div>
        <select v-model="urutanTerpilih" class="filter-dropdown" aria-label="Urutkan berita">
          <option value="">Urutkan</option>
          <option value="populer">Populer</option>
          <option value="kurang-populer">Kurang populer</option>
          <option value="terbaru">Terbaru</option>
          <option value="terlama">Terlama</option>
        </select>
        <label class="filter-search-bar">
          <span class="sr-only">Cari berita</span>
          <input type="search" placeholder="Cari berita..." v-model="searchQuery" />
          <span class="search-icon" aria-hidden="true">🔍</span>
        </label>
      </div>
      <div v-if="adaFilterAktif" class="active-filters" aria-label="Filter aktif">
        <button class="reset-filters" type="button" aria-label="Reset semua filter" @click="resetFilter">×</button>
        <span v-for="tag in filterAktif" :key="tag.key" class="active-filter-tag">
          {{ tag.label }}
          <button type="button" :aria-label="`Hapus filter ${tag.label}`" @click="hapusFilter(tag.key)">×</button>
        </span>
      </div>
    </section>

    <!-- 5. NEWS LIST SECTION -->
    <section class="news-section">
      <div v-if="isLoading" class="loading-state">Memuat berita...</div>
      
      <div v-else class="news-list">
        <article
          v-for="isu in beritaHalamanIni"
          :key="idIsu(isu) || isu.topik"
          class="news-card"
        >
          <div class="news-content">
            <RouterLink
              class="news-title-link"
              :to="{ name: 'detail-isu', params: { id: String(idIsu(isu) ?? '') } }"
            >
              <h3 class="news-title">{{ isu.topik }}</h3>
            </RouterLink>
            <p class="news-snippet">{{ isu.ringkasan_ai || isu.caption }}</p>
            <div class="news-meta">
              <span class="meta-pill outline">{{ isu.kategori || 'Umum' }}</span>
              <span class="meta-pill outline">Skor viralitas: {{ formatSkorViralitas(isu) }}</span>
            </div>
            <RouterLink
              class="read-more"
              :to="{ name: 'detail-isu', params: { id: String(idIsu(isu) ?? '') } }"
            >
              Baca selengkapnya <span aria-hidden="true">→</span>
            </RouterLink>
          </div>
          <div class="news-image">
            <img
              v-if="urlGambar(isu) && !gambarGagal.has(kunciGambar(isu))"
              :src="urlGambar(isu)"
              alt="Gambar Isu"
              @error="tandaiGambarGagal(kunciGambar(isu))"
            />
            <div v-else class="image-placeholder">🖼️</div>
          </div>
        </article>

        <p v-if="beritaHalamanIni.length === 0" class="empty-news">Belum ada berita untuk ditampilkan.</p>

        <nav v-if="totalPages > 1" class="pagination" aria-label="Navigasi halaman berita">
          <button
            class="pagination-button"
            :disabled="halamanAktif === 1"
            @click="pindahHalaman(halamanAktif - 1)"
          >
            Sebelumnya
          </button>
          <button
            v-for="halaman in totalPages"
            :key="halaman"
            class="pagination-button page-number"
            :class="{ active: halamanAktif === halaman }"
            :aria-current="halamanAktif === halaman ? 'page' : undefined"
            @click="pindahHalaman(halaman)"
          >
            {{ halaman }}
          </button>
          <button
            class="pagination-button"
            :disabled="halamanAktif === totalPages"
            @click="pindahHalaman(halamanAktif + 1)"
          >
            Berikutnya
          </button>
        </nav>
        <p v-if="beritaHalamanIni.length > 0" class="pagination-info">
          Menampilkan {{ indeksAwal + 1 }}–{{ Math.min(indeksAwal + beritaPerHalaman, isuTersaring.length) }}
          dari {{ isuTersaring.length }} berita
        </p>
      </div>
    </section>

    <!-- 6. FOOTER -->
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
            Jourly adalah sebuah website penyedia berita terpercaya yang berkomitmen untuk menyajikan informasi yang akurat, jujur, dan ramah bagi pembaca. Kami percaya bahwa setiap orang berhak untuk mendapatkan informasi yang akurat dan dapat dipercaya, tanpa memandang latar belakang atau keyakinannya.
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
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const daftarIsu = ref([]);
const authStore = useAuthStore();
const idIsu = (isu) => isu.id_qdrant ?? isu.id_postingan ?? isu.id ?? isu._id;
const urlGambar = (isu) => isu?.url_gambar || isu?.image_url || isu?.gambar || '';
const gambarGagal = ref(new Set());
const kunciGambar = (isu) => String(idIsu(isu) ?? isu.topik);
const tandaiGambarGagal = (key) => {
  gambarGagal.value = new Set([...gambarGagal.value, key]);
};
const formatSkorViralitas = (isu) => {
  const skor = Number(isu?.skor_viralitas);
  return Number.isFinite(skor) ? `${skor.toFixed(1)}%` : '0%';
};
const halamanAktif = ref(1);
const beritaPerHalaman = 10;
const totalPages = computed(() => Math.ceil(isuTersaring.value.length / beritaPerHalaman));
const indeksAwal = computed(() => (halamanAktif.value - 1) * beritaPerHalaman);
const beritaHalamanIni = computed(() =>
      isuTersaring.value.slice(indeksAwal.value, indeksAwal.value + beritaPerHalaman)
);
const filterSection = ref(null);
const searchQuery = ref('');
const pilihanKategori = [
  'Lalu Lintas', 'Ekonomi dan Bisnis', 'Bencana Alam', 'Infrastruktur',
  'Pariwisata', 'Layanan Publik', 'Sosial/Budaya', 'Politik Lokal'
];
const kategoriTerpilih = ref('');
const waktuTerpilih = ref('');
const tanggalMulai = ref('');
const tanggalAkhir = ref('');
const urutanTerpilih = ref('');

const tanggalIsu = (isu) => {
  const waktu = isu.timestamp ? new Date(isu.timestamp) : null;
  return waktu && !Number.isNaN(waktu.getTime()) ? tanggalWita(waktu) : null;
};
const batasWaktuTerpilih = computed(() => {
  const hariIni = tanggalWita(new Date());
  const hari = new Date(`${hariIni}T00:00:00Z`);
  if (waktuTerpilih.value === 'hari-ini') return { mulai: hariIni, akhir: hariIni };
  if (waktuTerpilih.value === 'kemarin') {
    hari.setUTCDate(hari.getUTCDate() - 1);
    const kemarin = hari.toISOString().slice(0, 10);
    return { mulai: kemarin, akhir: kemarin };
  }
  if (waktuTerpilih.value === 'minggu-ini') {
    hari.setUTCDate(hari.getUTCDate() - ((hari.getUTCDay() + 6) % 7));
    return { mulai: hari.toISOString().slice(0, 10), akhir: hariIni };
  }
  if (waktuTerpilih.value === 'bulan-ini') return { mulai: `${hariIni.slice(0, 7)}-01`, akhir: hariIni };
  if (waktuTerpilih.value === 'custom' && tanggalMulai.value && tanggalAkhir.value) {
    return { mulai: tanggalMulai.value, akhir: tanggalAkhir.value };
  }
  return null;
});
const isuTersaring = computed(() => {
  const kataKunci = searchQuery.value.trim().toLocaleLowerCase('id');
  const batas = batasWaktuTerpilih.value;
  const hasil = daftarIsu.value.filter((isu) => {
    const cocokKategori = !kategoriTerpilih.value ||
      (isu.kategori || '').toLocaleLowerCase('id') === kategoriTerpilih.value.toLocaleLowerCase('id');
    const tanggal = tanggalIsu(isu);
    const cocokWaktu = !batas || (tanggal && tanggal >= batas.mulai && tanggal <= batas.akhir);
    const teks = `${isu.topik || ''} ${isu.ringkasan_ai || ''} ${isu.caption || ''} ${isu.kategori || ''}`.toLocaleLowerCase('id');
    return cocokKategori && cocokWaktu && (!kataKunci || teks.includes(kataKunci));
  });
  const skor = (isu) => Number(isu.skor_viralitas ?? 0);
  const waktu = (isu) => new Date(isu.timestamp || 0).getTime() || 0;
  if (urutanTerpilih.value === 'populer') hasil.sort((a, b) => skor(b) - skor(a));
  if (urutanTerpilih.value === 'kurang-populer') hasil.sort((a, b) => skor(a) - skor(b));
  if (urutanTerpilih.value === 'terbaru') hasil.sort((a, b) => waktu(b) - waktu(a));
  if (urutanTerpilih.value === 'terlama') hasil.sort((a, b) => waktu(a) - waktu(b));
  return hasil;
});
const filterAktif = computed(() => {
  const tags = [];
  if (kategoriTerpilih.value) tags.push({ key: 'kategori', label: kategoriTerpilih.value });
  if (waktuTerpilih.value) {
    const labels = { 'hari-ini': 'Hari ini', kemarin: 'Kemarin', 'minggu-ini': 'Minggu ini', 'bulan-ini': 'Bulan ini' };
    const label = waktuTerpilih.value === 'custom'
      ? `Tanggal: ${tanggalMulai.value || '…'} – ${tanggalAkhir.value || '…'}`
      : labels[waktuTerpilih.value];
    tags.push({ key: 'waktu', label });
  }
  if (urutanTerpilih.value) {
    const labels = { populer: 'Populer', 'kurang-populer': 'Kurang populer', terbaru: 'Terbaru', terlama: 'Terlama' };
    tags.push({ key: 'urutan', label: labels[urutanTerpilih.value] });
  }
  if (searchQuery.value.trim()) tags.push({ key: 'pencarian', label: `Cari: ${searchQuery.value.trim()}` });
  return tags;
});
const adaFilterAktif = computed(() => filterAktif.value.length > 0);
watch([kategoriTerpilih, waktuTerpilih, tanggalMulai, tanggalAkhir, urutanTerpilih, searchQuery], () => {
  halamanAktif.value = 1;
});
const resetFilter = () => {
  kategoriTerpilih.value = '';
  waktuTerpilih.value = '';
  tanggalMulai.value = '';
  tanggalAkhir.value = '';
  urutanTerpilih.value = '';
  searchQuery.value = '';
  halamanAktif.value = 1;
};
const hapusFilter = (key) => {
  if (key === 'kategori') kategoriTerpilih.value = '';
  if (key === 'waktu') { waktuTerpilih.value = ''; tanggalMulai.value = ''; tanggalAkhir.value = ''; }
  if (key === 'urutan') urutanTerpilih.value = '';
  if (key === 'pencarian') searchQuery.value = '';
  halamanAktif.value = 1;
};

const pindahHalaman = async (halaman) => {
  if (halaman < 1 || halaman > totalPages.value || halaman === halamanAktif.value) return;

  halamanAktif.value = halaman;
  await nextTick();

  const posisiFilter = filterSection.value?.getBoundingClientRect().top;
  if (posisiFilter !== undefined) {
    window.scrollTo({
      top: window.scrollY + posisiFilter,
      behavior: 'smooth'
    });
  }
};

const isuTren = ref(null);
const isLoading = ref(true);
const isChartLoaded = ref(false);
const barChartData = ref({ labels: [], datasets: [] });
const doughnutChartData = ref({ labels: [], datasets: [] });

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' }
  }
};

const tanggalWita = (tanggal) => {
  if (!(tanggal instanceof Date) || Number.isNaN(tanggal.getTime())) return null;

  const bagianTanggal = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(tanggal);
  const nilai = Object.fromEntries(bagianTanggal.map(({ type, value }) => [type, value]));
  return `${nilai.year}-${nilai.month}-${nilai.day}`;
};

const pilihIsuTren = (data) => {
  const hariIniWita = tanggalWita(new Date());
  const dataDenganTanggal = data
    .map((item) => ({ item, tanggal: tanggalWita(new Date(item.timestamp)) }))
    .filter(({ tanggal }) => tanggal);

  const tanggalTerbaru = dataDenganTanggal
    .map(({ tanggal }) => tanggal)
    .sort()
    .at(-1);
  const tanggalTarget = dataDenganTanggal.some(({ tanggal }) => tanggal === hariIniWita)
    ? hariIniWita
    : tanggalTerbaru;

  const kandidat = dataDenganTanggal
    .filter(({ tanggal }) => tanggal === tanggalTarget)
    .map(({ item }) => item);

  isuTren.value = kandidat.reduce((terbaik, item) => {
    const skorItem = Number(item.skor_viralitas ?? 0);
    const skorTerbaik = Number(terbaik?.skor_viralitas ?? 0);
    return skorItem > skorTerbaik ? item : terbaik;
  }, kandidat[0] ?? null);
};

const muatDataBerita = async () => {
  isLoading.value = true;
  isChartLoaded.value = false;
  isuTren.value = null;

  try {
    const response = await api.get('/isu-publik');
    if (response.data.status !== 'success' || !Array.isArray(response.data.data)) {
      daftarIsu.value = [];
      return;
    }

    const semuaData = response.data.data;
    daftarIsu.value = semuaData;
    halamanAktif.value = 1;
    pilihIsuTren(semuaData);

    const hitungKategori = {};
    semuaData.forEach((item) => {
      const kategori = item.kategori || 'Lainnya';
      hitungKategori[kategori] = (hitungKategori[kategori] || 0) + 1;
    });

    const labelKategori = Object.keys(hitungKategori);
    const dataJumlah = Object.values(hitungKategori);

    barChartData.value = {
      labels: labelKategori,
      datasets: [{
        label: 'Jumlah Isu',
        backgroundColor: '#42b883',
        borderRadius: 4,
        data: dataJumlah
      }]
    };

    doughnutChartData.value = {
      labels: labelKategori,
      datasets: [{
        backgroundColor: [
          '#42b883', '#35495e', '#ff6b6b', '#feca57',
          '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'
        ],
        data: dataJumlah
      }]
    };

    isChartLoaded.value = true;
  } catch (error) {
    console.error('Gagal memuat data dari server:', error);
    daftarIsu.value = [];
    isuTren.value = null;
  } finally {
    isLoading.value = false;
  }
};

onMounted(muatDataBerita);
</script>

<style scoped>
/* RESET & DASAR */
.dashboard-wrapper {
  font-family: 'Inter', 'Poppins', sans-serif;
  --blue-950: #102d4f;
  --blue-900: #153b66;
  --blue-700: #1769aa;
  --blue-100: #e7f2fc;
  --blue-50: #f3f8fd;
  color: #203348;
  background-color: var(--blue-50);
  min-height: 100vh;
}

/* 1. NAVBAR */
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
.filter-search-bar {
  display: flex;
  align-items: center;
  flex: 1 1 230px;
  min-width: 210px;
  max-width: 320px;
  margin-left: auto;
  border: 1px solid #d5e5f2;
  background: white;
  border-radius: 10px;
  padding: 0 12px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(10, 38, 67, 0.12);
}
.filter-search-bar:focus-within {
  outline: 2px solid #69aee0;
  outline-offset: 1px;
}
.filter-search-bar input {
  width: 100%;
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #28445f;
  background: transparent;
}
.filter-search-bar input::placeholder {
  color: #8196a9;
}
.search-icon {
  color: var(--blue-700);
  font-size: 17px;
  line-height: 1;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 2. HERO */
.hero {
  background: linear-gradient(115deg, #d8ecfb 0%, #edf6fd 55%, #c5e2f7 100%);
  text-align: center;
  padding: 45px 20px;
  border-bottom: 1px solid #c9e0f3;
}
.hero h2 {
  font-size: 28px;
  font-weight: normal;
  color: var(--blue-950);
  margin: 0;
  letter-spacing: -0.4px;
}

/* 3. MAIN CONTENT (Trending & Charts) */
.main-content {
  max-width: 1000px;
  margin: 36px auto;
  padding: 0 20px;
}
.trending-box {
  background: linear-gradient(120deg, #164b7d, #217bb5);
  color: white;
  padding: 30px;
  border-radius: 14px;
  margin-bottom: 30px;
  box-shadow: 0 10px 24px rgba(21, 59, 102, 0.16);
}
.trending-box h3 {
  margin-top: 0;
  font-size: 18px;
  margin-bottom: 15px;
}
.trending-box p {
  color: #eaf5ff;
  line-height: 1.6;
  margin-bottom: 0;
}

.tags-container {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 40px;
}
.tag {
  background-color: white;
  color: var(--blue-700);
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #c8e0f4;
  box-shadow: 0 2px 5px rgba(20, 72, 117, 0.06);
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}
.chart-box {
  min-width: 0;
  background: white;
  padding: 1.5rem;
  border-radius: 14px;
  border: 1px solid #e0ebf5;
  box-shadow: 0 6px 20px rgba(28, 74, 116, 0.07);
  text-align: center;
}
.chart-title {
  font-weight: bold;
  color: var(--blue-900);
  margin: 0 0 1rem;
}
.chart-container {
  height: 260px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-chart {
  color: #999;
  font-style: italic;
}
@media (max-width: 700px) {
  .navbar {
    padding: 14px 20px;
  }
  .logo {
    font-size: 20px;
  }
  .admin-access-link {
    padding: 0 12px;
    font-size: 13px;
  }
  .charts-section {
    grid-template-columns: 1fr;
  }
}

/* 4. FILTER BAR */
.filter-bar {
  background-color: #e5f1fb;
  padding: 15px 0;
  border-top: 1px solid #d1e4f4;
  border-bottom: 1px solid #d1e4f4;
}
.filter-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.date-range {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.date-input-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.date-input-label input {
  min-width: 135px;
  padding: 7px 9px;
  border: 0;
  border-radius: 16px;
  background: white;
  font: inherit;
}
.filter-label {
  font-weight: bold;
  font-size: 18px;
  color: var(--blue-950);
}
.filter-dropdown {
  padding: 8px 15px;
  border-radius: 20px;
  border: none;
  outline: none;
  font-size: 14px;
  background-color: white;
  color: #28445f;
  box-shadow: 0 1px 4px rgba(17, 58, 96, 0.08);
  cursor: pointer;
  min-height: 40px;
}
.filter-dropdown:focus,
.date-input-label input:focus {
  outline: 2px solid #69aee0;
  outline-offset: 1px;
}
.admin-access-link {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 20px;
  background: white;
  color: var(--blue-900);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 160ms ease, box-shadow 160ms ease;
}
.admin-access-link:hover {
  background: #e7f2fc;
  box-shadow: 0 3px 9px rgba(21, 59, 102, 0.2);
}
.admin-access-link:focus-visible {
  outline: 3px solid #69aee0;
  outline-offset: 2px;
}
.active-filters {
  max-width: 1000px;
  margin: 12px auto 0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.reset-filters,
.active-filter-tag button {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: var(--blue-700);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.reset-filters {
  color: #b42318;
  font-weight: 700;
}
.active-filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 5px 4px 12px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #c8def0;
  color: var(--blue-900);
  font-size: 13px;
}
.active-filter-tag button {
  width: 20px;
  height: 20px;
  background: #ececec;
  font-size: 16px;
}
@media (max-width: 700px) {
  .filter-content {
    align-items: stretch;
    gap: 10px;
  }
  .filter-content > * {
    max-width: 100%;
  }
  .filter-dropdown {
    flex: 1 1 150px;
  }
  .filter-search-bar {
    flex: 1 1 100%;
    max-width: none;
    margin-left: 0;
  }
}

/* 5. NEWS LIST */
.news-section {
  max-width: 1000px;
  margin: 40px auto;
  padding: 0 20px;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0 8px;
}
.pagination-button {
  padding: 8px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: white;
  color: #344054;
  cursor: pointer;
}
.pagination-button:hover:not(:disabled),
.pagination-button.active {
  border-color: var(--blue-700);
  background: var(--blue-700);
  color: white;
}
.pagination-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.pagination-info,
.empty-news {
  color: #888;
  text-align: center;
  font-size: 14px;
}
.loading-state {
  text-align: center;
  color: #888;
  padding: 40px;
}
.news-card {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 18px;
  padding: 22px;
  border: 1px solid #e1ebf4;
  border-radius: 14px;
  background: white;
  box-shadow: 0 4px 14px rgba(28, 74, 116, 0.055);
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.news-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(28, 74, 116, 0.1);
}
.news-content {
  flex: 1;
}
.news-title {
  color: var(--blue-900);
  font-size: 18px;
  margin: 0 0 10px 0;
}
.news-title-link {
  color: inherit;
  text-decoration: none;
}
.news-title-link:hover .news-title {
  color: var(--blue-700);
  text-decoration: underline;
}
.read-more {
  display: inline-block;
  margin-top: 12px;
  color: var(--blue-700);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}
.read-more:hover {
  color: var(--blue-950);
  text-decoration: underline;
}
.news-snippet {
  color: #60758a;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-meta {
  display: flex;
  gap: 10px;
}
.meta-pill {
  font-size: 12px;
  padding: 4px 15px;
  border-radius: 15px;
  color: var(--blue-700);
}
.meta-pill.outline {
  border: 1px solid #a9cce8;
  background: #f5faff;
}
.news-image {
  width: 200px;
  height: 140px;
  background-color: #e6f1fa;
  border-radius: 12px;
  overflow: hidden;
}
.news-image img {
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

/* 6. FOOTER */
.footer {
  background: linear-gradient(110deg, var(--blue-950), #194d7c);
  color: white;
  margin-top: 60px;
}
.footer-content {
  max-width: 1000px;
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
</style>

