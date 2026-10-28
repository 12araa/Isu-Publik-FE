<template>
  <AdminLayout page-title="Edit Data Isu">
    <main class="content-wrapper">
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
              </tr>
              <tr v-if="logData.length === 0">
                <td colspan="5" style="text-align: center; padding: 2rem;">Memuat data isu...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import AdminLayout from '../components/AdminLayout.vue';
import api from '../services/api';
import Swal from 'sweetalert2';

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

onMounted(() => {
  muatTabelData();
});
</script>

<style scoped>
.content-wrapper { padding: 0; max-width: 1200px; margin: 0 auto; }

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
  border-radius: 10px;
  padding: 0.5rem 1rem;
}

/* PANEL EDIT (MASTER) */
.edit-panel {
  background-color: #fff;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #d5e5f2;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(16, 45, 79, 0.07);
}
.form-group.row {
  display: flex;
  margin-bottom: 1rem;
  align-items: flex-start;
}
.col-label {
  flex: 0 0 150px;
  font-weight: bold;
  color: #153b66;
  padding-top: 0.5rem;
}
.col-input {
  flex: 1;
}
.read-only-text {
  margin: 0;
  padding-top: 0.5rem;
  color: #28445f;
}
.placeholder-text {
  color: #888;
  font-style: italic;
}
.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #c9dceb;
  border-radius: 8px;
  background-color: #fff;
  font-family: inherit;
  resize: vertical;
}
.form-control:disabled {
  background-color: #f3f8fd;
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
  background-color: #64748b;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  border-radius: 8px;
}
.btn-simpan {
  background-color: #1769aa;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  border-radius: 8px;
}
.btn-batal:hover:not(:disabled) {
  background-color: #475569;
}
.btn-simpan:hover:not(:disabled) {
  background-color: #153b66;
}
.btn-batal:disabled, .btn-simpan:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* PANEL TABEL (DETAIL) */
.table-section {
  background: #fff;
  padding: 1rem;
  border: 1px solid #d5e5f2;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(16, 45, 79, 0.07);
}
.panel-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #153b66;
}
.table-container {
  background: #fff;
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e4eef7;
}
.data-table th {
  background-color: #f3f8fd;
  color: #153b66;
  font-weight: bold;
  text-align: center;
}
.active-row {
  background-color: #e7f2fc;
}
.btn-edit {
  background-color: #1769aa;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 7px;
  cursor: pointer;
}
.btn-edit:hover {
  background-color: #153b66;
}

@media (max-width: 640px) {
  .table-header {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .search-box,
  .dropdown-short {
    width: 100%;
  }

  .edit-panel {
    padding: 1.25rem;
  }

  .form-group.row {
    flex-direction: column;
    gap: 8px;
  }

  .col-label {
    flex-basis: auto;
  }

  .action-row {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons {
    flex-wrap: wrap;
  }

  .action-buttons button {
    flex: 1;
  }
}
</style>