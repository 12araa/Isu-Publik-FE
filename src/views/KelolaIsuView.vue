<template>
  <div class="admin-layout">
    <!-- Navigasi -->
    <nav class="admin-nav">
      <h2>Judul | Beranda Admin</h2>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/tarik-manual">Tarik Manual</RouterLink>
        <RouterLink to="/kelola-isu" class="active">Kelola Isu</RouterLink>
        <a href="#" @click.prevent="prosesLogout">Admin ▾</a>
      </div>
    </nav>

    <main class="content-wrapper">
      <h3 class="page-title">Kelola Isu</h3>

      <!-- BAGIAN MASTER (FORM EDIT STATIS) -->
      <div class="edit-panel">
        <div class="form-group row">
          <label class="col-label">Topik Asli</label>
          <div class="col-input">
            <p class="read-only-text" v-if="formEdit.id_qdrant">
              "{{ formEdit.topik_asli || 'Tidak ada judul' }}"
            </p>
            <p class="read-only-text placeholder-text" v-else>
              Pilih berita di tabel bawah untuk mengedit...
            </p>
          </div>
        </div>

        <div class="form-group row">
          <label class="col-label">Ringkasan AI :</label>
          <div class="col-input">
            <textarea 
              v-model="formEdit.ringkasan" 
              class="form-control" 
              rows="3" 
              :disabled="!formEdit.id_qdrant"
              placeholder="Ringkasan akan muncul di sini..."></textarea>
          </div>
        </div>

        <div class="form-group row">
          <label class="col-label">Kategori :</label>
          <div class="col-input">
            <select v-model="formEdit.kategori" class="form-control dropdown-short" :disabled="!formEdit.id_qdrant">
              <option value="Lalu Lintas/Macet">Lalu Lintas/Macet</option>
              <option value="Bencana Alam">Bencana Alam</option>
              <option value="Layanan Publik">Layanan Publik</option>
              <option value="Kriminalitas">Kriminalitas</option>
              <option value="Kecelakaan">Kecelakaan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        <div class="form-group row">
          <label class="col-label">Status :</label>
          <div class="col-input action-row">
            <select v-model="formEdit.status" class="form-control dropdown-short" :disabled="!formEdit.id_qdrant">
              <option value="Tampilkan">Tampilkan</option>
              <option value="Arsipkan">Arsipkan (Sembunyikan)</option>
            </select>
            
            <div class="action-buttons">
              <button class="btn-batal" @click="batalEdit" :disabled="!formEdit.id_qdrant">Batal</button>
              <button class="btn-simpan" @click="simpanPerubahan" :disabled="!formEdit.id_qdrant">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      </div>

      <!-- BAGIAN DETAIL (TABEL DATA) -->
      <div class="table-section">
        <div class="table-header">
          <div class="panel-title">Log Data Terbaru</div>
          <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="🔍 Cari topik berita..." 
              class="form-control search-box"
          />
        </div>
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
              <tr v-for="item in filteredLogData" :key="item.id_qdrant" :class="{ 'active-row': formEdit.id_qdrant === item.id_qdrant }">
                <td>{{ item.id_qdrant ? item.id_qdrant.substring(0, 8) : '-' }}</td>
                <td>{{ item.topik || 'Tanpa Judul' }}</td>
                <td>{{ item.kategori }}</td>
                <td>{{ item.skor_viralitas ? item.skor_viralitas.toFixed(1) + '%' : '0%' }}</td>
                <td>
                  <button class="btn-edit" @click="persiapkanEdit(item)">Edit</button>
                </td>
              </tr>''
              <tr v-if="logData.length === 0">
                <td colspan="5" style="text-align: center; padding: 2rem;">Memuat data isu...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router'; 
import api from '../services/api';
import Swal from 'sweetalert2';
// import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const logData = ref([]);

const searchQuery = ref('');

// LOGIKA PENCARIAN (Computed Property)
const filteredLogData = computed(() => {
  if (!searchQuery.value) {
    return logData.value;
  }
  
  const kataKunci = searchQuery.value.toLowerCase();
  
  return logData.value.filter(item => {
    const teksTopik = (item.topik || '').toLowerCase();
    return teksTopik.includes(kataKunci);
  });
});

// 1. Keranjang reaktif untuk menampung data yang sedang diedit
const formEdit = ref({
  id_qdrant: null,
  topik_asli: '',
  ringkasan: '',
  kategori: '',
  status: 'Tampilkan'
});

// 2. Tarik data awal untuk mengisi tabel bawah
const muatTabelData = async () => {
  try {
    const response = await api.get('/isu-publik');
    if (response.data.status === 'success') {
      let semuaData = response.data.data;
      const dataTerbaru = [...semuaData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));  
      logData.value = dataTerbaru;
    }
  } catch (error) {
    console.error("Gagal memuat tabel:", error);
  }
};

// 3. Eksekusi saat tombol "Edit" di tabel ditekan
const persiapkanEdit = (item) => {
  // Jika sedang ada data yang diedit tapi belum disimpan, dan pengguna menekan tombol edit baris lain
  if (formEdit.value.id_qdrant && formEdit.value.id_qdrant !== item.id_qdrant) {
    Swal.fire({
      title: 'Ada perubahan belum disimpan!',
      text: "Apakah Anda yakin ingin berpindah dan mengabaikan perubahan saat ini?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, pindah!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        muatDataKeForm(item);
      }
    });
  } else {
    muatDataKeForm(item);
  }
};

// Fungsi helper untuk mengisi form dan menggulung layar
const muatDataKeForm = (item) => {
  formEdit.value = {
    id_qdrant: item.id_qdrant,
    topik_asli: item.topik, 
    ringkasan: item.teks_vector || item.ringkasan_ai, 
    kategori: item.kategori || 'Lainnya',
    status: item.is_archived ? 'Arsipkan' : 'Tampilkan'
  };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 4. Batalkan edit dan kosongkan form
const batalEdit = () => {
  Swal.fire({
    title: 'Batalkan Perubahan?',
    text: "Semua teks yang telah Anda ubah akan dikembalikan seperti semula.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#8c8c8c',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, Batalkan',
    cancelButtonText: 'Tidak'
  }).then((result) => {
    if (result.isConfirmed) {
      formEdit.value = {
        id_qdrant: null,
        topik_asli: '',
        ringkasan: '',
        kategori: '',
        status: 'Tampilkan'
      };
      
      // Notifikasi toast (opsional) agar terasa lebih interaktif
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Pengeditan dibatalkan',
        showConfirmButton: false,
        timer: 1500
      });
    }
  });
};

const simpanPerubahan = async () => {
  if (!formEdit.value.id_qdrant) return;
  
  Swal.fire({
    title: 'Simpan Perubahan?',
    text: `Anda akan memperbarui isu publik: "${formEdit.value.topik_asli.substring(0, 30)}..."`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#4CAF50', 
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, Simpan!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      
      Swal.fire({
        title: 'Menyimpan Data...',
        text: 'Mengubah vektor di Qdrant, mohon tunggu sebentar.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const payload = {
          id_qdrant: formEdit.value.id_qdrant,
          topik: formEdit.value.topik_asli,
          ringkasan: formEdit.value.ringkasan,
          kategori: formEdit.value.kategori,
          is_archived: formEdit.value.status === 'Arsipkan'
        };

        const response = await api.put(`/admin/isu-publik/${formEdit.value.id_qdrant}`, payload);

        if (response.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil Disimpan!',
            text: response.data.message,
            confirmButtonColor: '#4CAF50'
          });
          
          formEdit.value = {
            id_qdrant: null,
            topik_asli: '',
            ringkasan: '',
            kategori: '',
            status: 'Tampilkan'
          };

          await muatTabelData();
        }
        
      } catch (error) {
        console.error("Gagal menyimpan perubahan:", error);
        
        const pesanError = error.response?.data?.detail || 'Terjadi kesalahan saat menyambung ke server.';
        
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan!',
          text: pesanError,
          confirmButtonColor: '#d33'
        });
      }
    }
  });
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

onMounted(() => {
  muatTabelData();
});
</script>

<style scoped>
/* Reset & Layout Dasar (Disesuaikan dengan wireframe Abu-abu) */
.admin-layout {
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: sans-serif;
}
.admin-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #8c8c8c;
  color: white;
  padding: 1rem 2rem;
}
.admin-nav h2 { margin: 0; font-size: 1.5rem; }
.nav-links a { color: white; text-decoration: none; margin-left: 1.5rem; font-weight: 500; }
.nav-links a.active { border-bottom: 2px solid white; padding-bottom: 4px; }
.content-wrapper { padding: 2rem; max-width: 1100px; margin: 0 auto; }
.page-title { margin-top: 0; margin-bottom: 1rem; color: #333; font-weight: normal; }

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.table-header .panel-title {
  margin-bottom: 0; /* Menghilangkan margin bawah agar sejajar */
}
.search-box {
  width: 300px;
  border-radius: 20px; /* Membuat ujung kotak membulat */
  padding: 0.5rem 1rem;
}

/* PANEL EDIT (MASTER) */
.edit-panel {
  background-color: #e0e0e0;
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 4px;
}
.form-group.row {
  display: flex;
  margin-bottom: 1rem;
  align-items: flex-start;
}
.col-label {
  flex: 0 0 150px;
  font-weight: bold;
  color: #333;
  padding-top: 0.5rem;
}
.col-input {
  flex: 1;
}
.read-only-text {
  margin: 0;
  padding-top: 0.5rem;
  color: #333;
}
.placeholder-text {
  color: #888;
  font-style: italic;
}
.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #cfcfcf; /* Warna abu-abu input */
  font-family: inherit;
  resize: vertical;
}
.form-control:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}
.dropdown-short {
  width: 250px;
}
.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.action-buttons {
  display: flex;
  gap: 1rem;
}
.btn-batal {
  background-color: #a0a0a0;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  border-radius: 4px;
}
.btn-simpan {
  background-color: #8c8c8c;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  border-radius: 4px;
}
.btn-batal:disabled, .btn-simpan:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* PANEL TABEL (DETAIL) */
.table-section {
  background: #e0e0e0;
  padding: 1rem;
  border-radius: 4px;
}
.panel-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #333;
}
.table-container {
  background: transparent;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 1rem;
  text-align: left;
  border: 1px solid #999;
}
.data-table th {
  background-color: #d0d0d0;
  font-weight: bold;
  text-align: center;
}
.active-row {
  background-color: #d5d5d5; /* Penanda baris yang sedang diedit */
}
.btn-edit {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}
</style>