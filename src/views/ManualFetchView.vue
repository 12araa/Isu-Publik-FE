<template>
  <AdminLayout page-title="Tarik Data">
    <main class="dashboard-content">
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
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AdminLayout from '../components/AdminLayout.vue';
import api from '../services/api';
import Swal from 'sweetalert2';

const targetPilihan =ref([]);
const isFetching = ref(false);
const logData = ref([]);
const sumberAkun = ref({ instagram: [], facebook: [] }); 


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
.dashboard-content {
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
}

.panel-title {
  background-color: #e7f2fc;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: bold;
  color: #153b66;
  border: 1px solid #d5e5f2;
  border-radius: 10px 10px 0 0;
  text-transform: uppercase;
}

/* KOTAK TARIK DATA */
.fetch-box {
  background: white;
  border-radius: 12px;
  border: 1px solid #d5e5f2;
  margin-bottom: 2rem;
  box-shadow: 0 6px 18px rgba(16, 45, 79, 0.07);
}

.fetch-form { padding: 2rem; }
.form-group { margin-bottom: 1.5rem; display: flex; align-items: center; }
.form-group label { width: 150px; font-weight: bold; color: #153b66; }
.form-group select { flex: 1; max-width: 400px; padding: 0.6rem; border: 1px solid #c9dceb; border-radius: 8px; background-color: #fff; }
.action-row { display: flex; justify-content: flex-end; margin-top: 1rem; }
.btn-sync { background-color: #1769aa; color: white; border: none; padding: 0.8rem 1.5rem; font-size: 1rem; font-weight: bold; border-radius: 9px; cursor: pointer; }
.btn-sync:hover:not(:disabled) { background-color: #153b66; }
.btn-sync:disabled { opacity: 0.6; cursor: not-allowed; }

/* TABEL */
.mt-2 { margin-top: 2rem; }
.table-container { background: white; border: 1px solid #d5e5f2; border-top: none; border-radius: 0 0 12px 12px; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e4eef7; }
.data-table th { background-color: #f3f8fd; color: #153b66; font-weight: bold; }
.btn-edit { padding: 4px 10px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer; }

.checkbox-container {
  flex: 1;
  background: #f3f8fd;
  padding: 1rem;
  border: 1px solid #d5e5f2;
  border-radius: 10px;
  max-height: 300px;
  overflow-y: auto;
}
.category-title {
  margin: 0 0 0.5rem 0;
  color: #153b66;
  font-size: 0.95rem;
  border-bottom: 1px solid #d5e5f2;
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
  color: #28445f;
  cursor: pointer;
}
.checkbox-item input {
  margin-right: 0.5rem;
}

@media (max-width: 600px) {
  .fetch-form {
    padding: 1.25rem;
  }

  .form-group {
    align-items: stretch;
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-group label {
    width: auto;
  }

  .checkbox-container {
    width: 100%;
  }

  .btn-sync {
    width: 100%;
  }
}
</style>