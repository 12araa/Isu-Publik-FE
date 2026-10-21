<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2>Login Admin</h2>
      <p>Sistem Analisis Isu Publik Bali</p>

      <form @submit.prevent="prosesLogin" >
        <div class="input-group">
          <label>Email</label>
          <input type="email" v-model="email" placeholder="Insert your email" required />
        </div>

        <div class="input-group">
          <label>Password</label>
          <input type="password" v-model="password" placeholder="••••••••" required />
        </div>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Memeriksa...' : 'Masuk ke Sistem' }}
        </button>
      </form>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import Swal from 'sweetalert2';

const email = ref('');
const password = ref('');
const isLoading = ref(false);

const router = useRouter();
const authStore = useAuthStore();

const prosesLogin = async () => {
  isLoading.value = true;
  
  try {
    await authStore.login(email.value, password.value);
    
    Swal.fire({
      icon: 'success',
      title: 'Login Berhasil!',
      text: 'Selamat datang kembali, Admin.',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      router.push('/dashboard'); 
    });
    
  } catch (error) {
    let detailError = error.response?.data?.detail || "Terjadi kesalahan pada sistem.";
    
    if (detailError.includes("INVALID_LOGIN_CREDENTIALS")) {
      detailError = "Email atau password yang Anda masukkan salah.";
    } else if (detailError.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
      detailError = "Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.";
    } else if (detailError.includes("USER_DISABLED")) {
      detailError = "Akun Admin ini telah dinonaktifkan.";
    }

    Swal.fire({
      icon: 'error',
      title: 'Akses Ditolak',
      text: detailError,
      confirmButtonColor: '#42b883'
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f4f9;
}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}
.input-group {
  margin-bottom: 1rem;
  text-align: left;
}
.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
.input-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  box-sizing: border-box;
}
button:disabled {
  background-color: #a0c9b8;
}
.error-text {
  color: red;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>