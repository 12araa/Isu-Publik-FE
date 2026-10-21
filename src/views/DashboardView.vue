<template>
  <div class="admin-layout">
    <nav class="admin-nav">
      <h2>Judul | Beranda Admin</h2>
      <div class="nav-links">
        <RouterLink to="/dashboard" class="active">Dashboard</RouterLink>
        <RouterLink to="/tarik-manual">Tarik Manual</RouterLink>
        <RouterLink to="/kelola-isu">Kelola Isu</RouterLink>
        <a href="#" @click.prevent="prosesLogout">Admin ▾</a>
      </div>
    </nav>

    <main class="dashboard-content">
      <p class="welcome-text">Selamat Datang Kembali!</p>

      <!-- PANEL KARTU METRIK UTAMA -->
      <div class="panel-title">PANEL KARTU METRIK UTAMA</div>
      <div class="metrics-panel">
        <div class="metric-card">
          <p>Total Isu</p>
          <h2>{{ totalIsu }}</h2>
        </div>
        <div class="metric-card">
          <p>Isu Publik</p>
          <h2>{{ isuPublik }}</h2>
        </div>
        <div class="metric-card">
          <p>Isu Diarsipkan</p>
          <h2>{{ isuDiarsipkan }}</h2>
        </div>
        <div class="metric-card">
          <p>Tarikan Terakhir</p>
          <h4 v-html="tarikanTerakhir"></h4>
        </div>
      </div>

      <!-- AREA GRAFIK -->
      <div class="charts-section">
        <div class="chart-box">
          <p class="chart-title">Tren Volume Isu</p>
          <div class="chart-container">
            <Bar v-if="isChartLoaded && totalIsu > 0" :data="barChartData" :options="chartOptions" />
            <p v-else class="empty-chart">Belum ada data untuk ditampilkan</p>
          </div>
        </div>
        <div class="chart-box">
          <p class="chart-title">Proporsi Kategori</p>
          <div class="chart-container">
            <Doughnut v-if="isChartLoaded && totalIsu > 0" :data="doughnutChartData" :options="chartOptions" />
            <p v-else class="empty-chart">Belum ada data untuk ditampilkan</p>
          </div>
        </div>
      </div>

      <!-- TABEL LOG DATA TERBARU -->
      <div class="table-section">
        <div class="panel-title">Log Data Terbaru</div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID Isu</th>
                <th>Topik</th>
                <th>Kategori</th>
                <th>Skor</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in logData" :key="item.id_qdrant">
                <td>{{ item.id_qdrant.substring(0, 8) }}</td>
                <td>{{ item.topik || 'Tanpa Judul' }}</td>
                <td>{{ item.kategori }}</td>
                <td>{{ item.skor_viralitas.toFixed(2) }}</td>
                <td>
                  <button class="btn-edit">Edit</button>
                </td>
              </tr>
              <tr v-if="logData.length === 0">
                <td colspan="5" style="text-align: center;">Belum ada data isu publik.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

// 1. IMPORT KOMPONEN CHART.JS
import { Bar, Doughnut } from 'vue-chartjs';
import { 
  Chart as ChartJS, Title, Tooltip, Legend, 
  BarElement, CategoryScale, LinearScale, ArcElement 
} from 'chart.js';

// Mendaftarkan modul Chart.js agar bisa digunakan
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const router = useRouter();
const authStore = useAuthStore();

// Variabel Reaktif untuk Panel Kartu & Tabel
const totalIsu = ref(0);
const isuPublik = ref(0);
const isuDiarsipkan = ref(0);
const tarikanTerakhir = ref('-');
const logData = ref([]);

// 2. VARIABEL REAKTIF UNTUK GRAFIK
const isChartLoaded = ref(false);
const barChartData = ref({ labels: [], datasets: [] });
const doughnutChartData = ref({ labels: [], datasets: [] });

// Pengaturan agar grafik responsif mengikuti ukuran kotak (box)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

const prosesLogout = () => {
  Swal.fire({
    title: 'Keluar dari Sistem?',
    text: "Anda harus login kembali untuk mengakses panel admin.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#8c8c8c',
    confirmButtonText: 'Ya, Keluar',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      authStore.logout(); 
      
      router.push('/login'); 
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Anda telah berhasil keluar.',
        showConfirmButton: false,
        timer: 1500
      });
    }
  });
};

const ambilDataDashboard = async () => {
  try {
    const response = await api.get('/isu-publik');
    
    if (response.data.status === 'success') {
      const semuaData = response.data.data;
      
      // --- A. HITUNG DATA KARTU METRIK ---
      totalIsu.value = semuaData.length;
      isuPublik.value = semuaData.filter(item => item.is_archived === false).length;
      isuDiarsipkan.value = semuaData.filter(item => item.is_archived === true).length;
      
      if (semuaData.length > 0) {
        const daftarWaktu = semuaData
          .map(item => new Date(item.timestamp).getTime())
          .filter(waktu => !isNaN(waktu));
          
        if (daftarWaktu.length > 0) {
          const waktuTerbaru = Math.max(...daftarWaktu);
          const tanggal = new Date(waktuTerbaru);
          tarikanTerakhir.value = tanggal.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }).replace(',', '<br>') + ' WITA';
        }
      }

      // --- B. AMBIL 5 DATA TERATAS UNTUK TABEL ---
      const dataTerbaru = [...semuaData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      logData.value = dataTerbaru.slice(0, 5);

      // --- C. OLAH DATA UNTUK GRAFIK ---
      const hitungKategori = {};
      
      semuaData.forEach(item => {
        const kat = item.kategori || 'Lainnya';
        hitungKategori[kat] = (hitungKategori[kat] || 0) + 1;
      });

      const labelKategori = Object.keys(hitungKategori);
      const dataJumlah = Object.values(hitungKategori);

      // Mengisi data Grafik Batang (Tren Volume per Kategori)
      barChartData.value = {
        labels: labelKategori,
        datasets: [{
          label: 'Jumlah Isu',
          backgroundColor: '#42b883',
          borderRadius: 4,
          data: dataJumlah
        }]
      };

      // Mengisi data Grafik Donat (Proporsi Kategori)
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

      // Tampilkan grafik setelah data selesai diolah
      isChartLoaded.value = true;
    }
  } catch (error) {
    console.error("Gagal mengambil data dari server:", error);
  }
};

onMounted(() => {
  ambilDataDashboard();
});
</script>


<style scoped>
/* Reset & Layout Dasar */
.admin-layout {
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: sans-serif;
}

/* Navigasi */
.admin-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #9e9e9e; /* Warna abu-abu sesuai wireframe */
  color: white;
  padding: 1rem 2rem;
}
.admin-nav h2 {
  margin: 0;
  font-size: 1.5rem;
}
.nav-links a {
  color: white;
  text-decoration: none;
  margin-left: 1.5rem;
  font-weight: 500;
}
.nav-links a.active { 
  border-bottom: 2px solid white; padding-bottom: 4px; 
}

/* Konten Utama */
.dashboard-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.welcome-text {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #333;
}
.panel-title {
  background-color: #e0e0e0;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: bold;
  color: #555;
  border-radius: 4px 4px 0 0;
  text-transform: uppercase;
}

/* Kartu Metrik */
.metrics-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  background-color: #e0e0e0;
  padding: 1rem;
  border-radius: 0 0 4px 4px;
  margin-bottom: 2rem;
}
.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.metric-card p {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}
.metric-card h2, .metric-card h4 {
  margin: 0;
  color: #333;
}

/* Area Grafik */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}
.chart-box {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  text-align: center;
}
.chart-title {
  font-weight: bold;
  color: #555;
  margin-bottom: 1rem;
}
.placeholder-chart {
  height: 200px;
  background-color: #f1f1f1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border: 1px dashed #ccc;
}

/* Tabel Data */
.table-container {
  background: white;
  border: 1px solid #ddd;
  border-top: none;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
  border-right: 1px solid #ddd;
}
.data-table th {
  background-color: #f5f5f5;
  color: #555;
  font-weight: bold;
}
.data-table td:last-child, .data-table th:last-child {
  border-right: none;
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
</style>