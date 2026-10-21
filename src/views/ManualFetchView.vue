<template>
  <div class="admin-layout">
    <!-- Navigasi Atas -->
    <nav class="admin-nav">
      <h2>Judul | Beranda Admin</h2>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/tarik-manual" class="active">Tarik Manual</RouterLink>
        <RouterLink to="/kelola-isu">Kelola Isu</RouterLink>
        <a href="#" @click.prevent="prosesLogout">Admin ▾</a>
      </div>
    </nav>

    <main class="dashboard-content">
      <h3 class="page-title">Tarik Manual</h3>

      <!-- KOTAK TARIK DATA -->
      <div class="fetch-box">
        <div class="panel-title">TARIK DATA ISU TERBARU</div>
        <div class="fetch-form">
          
          <div class="form-group">
            <label>Pilih Sumber Target:</label>
            <div class="checkbox-container">
              
              <!-- Kategori Instagram -->
              <h4 class="category-title">Instagram (Username)</h4>
              <div class="checkbox-grid">
                <label v-for="akun in sumberAkun.instagram" :key="akun.id" class="checkbox-item">
                  <input type="checkbox" :value="akun.id" v-model="targetPilihan">
                  {{ akun.nama }}
                </label>
              </div>

              <!-- Kategori Facebook -->
              <h4 class="category-title mt-1">Facebook (Grup)</h4>
              <div class="checkbox-grid">
                <label v-for="akun in sumberAkun.facebook" :key="akun.id" class="checkbox-item">
                  <input type="checkbox" :value="akun.id" v-model="targetPilihan">
                  {{ akun.nama }}
                </label>
              </div>
              
            </div>
          </div>

          <div class="action-row">
            <!-- Tampilkan jumlah yang dicentang di tombol -->
            <button class="btn-sync" @click="mulaiSinkronisasi" :disabled="isFetching || targetPilihan.length === 0">
              {{ isFetching ? 'Menyinkronkan...' : `Mulai Sinkronisasi (${targetPilihan.length} Akun)` }}
            </button>
          </div>
        </div>
      </div>

      <!-- TABEL LOG DATA TERBARU -->
      <div class="table-section mt-2">
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
                <td>{{ item.skor_viralitas }}%</td>
                <td><button class="btn-edit">Edit</button></td>
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
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();

const targetPilihan =ref([]);
const isFetching = ref(false);
const logData = ref([]);
const sumberAkun = ref({ instagram: [], facebook: [] }); 


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

const muatTabelData = async () => {
  try {
    const response = await api.get('/isu-publik');
    if (response.data.status === 'success') {
      let semuaData = response.data.data;
      const dataTerbaru = [...semuaData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));  
      logData.value = dataTerbaru.slice(0, 5);
    }
  } catch (error) {
    console.error("Gagal memuat tabel:", error);
  }
};

const muatKatalogAkun = async () => {
  try {
    const response = await api.get('/admin/sumber-akun');
    if (response.data.status === 'success') {
      sumberAkun.value = response.data.data;
    }
  } catch (error) {
    console.error("Gagal memuat katalog akun:", error);
  }
};

const mulaiSinkronisasi = async () => {
  const payload = {
      target_akun: targetPilihan.value
  };
  let intervalCekStatus; // Variabel penyimpan timer

    Swal.fire({
        title: 'Menyiapkan Pipeline...',
        html: 'Memulai proses...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
            intervalCekStatus = setInterval(async () => {
                try {
                    const responseStatus = await api.get('/admin/status-fetch');
                    Swal.update({ html: responseStatus.data.pesan }); 
                } catch (error) {
                    console.error("Gagal membaca status", error);
                }
            }, 1500); 
        },
        willClose: () => {
            clearInterval(intervalCekStatus); 
        }
    });

  try {
    // Array targetPilihan sudah otomatis berisi username IG dan Link FB yang dicentang
    const response = await api.post('/admin/manual-fetch', payload);    
    clearInterval(intervalCekStatus);

    if (response.data.status === 'success') {
      // Kosongkan centang setelah berhasil
      targetPilihan.value = []; 
      
      Swal.fire({
        icon: 'success',
        title: 'Sinkronisasi Berhasil!',
        text: 'Data terbaru berhasil dimasukkan ke Qdrant.',
      });
      // Panggil fungsi muat tabel di sini...
    }else if (response.data.status === 'warning') {
    Swal.fire('Info Pipeline', response.data.message, 'warning');
}
  } catch (error) {
    clearInterval(intervalCekStatus);
    const detailError = error.response?.data?.detail || "Gagal menghubungi server FastAPI.";

    Swal.fire({
      icon: 'error',
      title: 'Sinkronisasi Gagal',
      text: detailError,
      confirmButtonColor: '#ff6b6b'
    });
  } finally {
    isFetching.value = false;
    clearInterval(intervalCekStatus);
  }
};

onMounted(() => {
  muatKatalogAkun();
  muatTabelData();
});
</script>

<style scoped>
/* Mewarisi struktur layout dari DashboardAdmin */
.admin-layout { 
  min-height: 100vh; 
  background-color: #f8f9fa; 
  font-family: sans-serif; 
}

.admin-nav { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background-color: #9e9e9e; 
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
  border-bottom: 2px solid white; 
  padding-bottom: 4px; 
}

.dashboard-content { 
  padding: 2rem; 
  max-width: 1200px; 
  margin: 0 auto; 
}

.page-title { 
  margin-bottom: 1rem; 
  color: #333; 
  font-size: 1.3rem; 
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

/* KOTAK TARIK DATA */
.fetch-box { 
  background: white; 
  border-radius: 4px; 
  border: 1px solid #ddd; 
  margin-bottom: 2rem; 
}

.fetch-form { padding: 2rem; }
.form-group { margin-bottom: 1.5rem; display: flex; align-items: center; }
.form-group label { width: 150px; font-weight: bold; color: #555; }
.form-group select { flex: 1; max-width: 400px; padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; background-color: #f9f9f9; }
.action-row { display: flex; justify-content: flex-end; margin-top: 1rem; }
.btn-sync { background-color: #9e9e9e; color: white; border: none; padding: 0.8rem 1.5rem; font-size: 1rem; font-weight: bold; border-radius: 4px; cursor: pointer; }
.btn-sync:hover:not(:disabled) { background-color: #7a7a7a; }
.btn-sync:disabled { opacity: 0.6; cursor: not-allowed; }

/* TABEL */
.mt-2 { margin-top: 2rem; }
.table-container { background: white; border: 1px solid #ddd; border-top: none; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #ddd; }
.data-table th { background-color: #f5f5f5; color: #555; font-weight: bold; }
.btn-edit { padding: 4px 10px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer; }

.checkbox-container {
  flex: 1;
  background: #f9f9f9;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}
.category-title {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.95rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.3rem;
}
.mt-1 {
  margin-top: 1rem;
}
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}
.checkbox-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  cursor: pointer;
}
.checkbox-item input {
  margin-right: 0.5rem;
}
</style>