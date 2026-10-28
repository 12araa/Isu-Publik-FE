<template>
  <div class="admin-layout">
    <header class="admin-navbar">
      <div class="navbar-content">
        <RouterLink to="/admin/dashboard" class="brand">Isu Publik Bali</RouterLink>
        <nav class="admin-navigation" aria-label="Navigasi admin">
          <RouterLink to="/admin/dashboard" exact-active-class="active">Dashboard</RouterLink>
          <RouterLink to="/tarik-manual" exact-active-class="active">Tarik Data</RouterLink>
          <RouterLink to="/kelola-isu" exact-active-class="active">Edit Data</RouterLink>
          <RouterLink to="/dashboard" class="user-site-link">Halaman User</RouterLink>
          <button type="button" class="logout-button" @click="prosesLogout">Keluar</button>
        </nav>
      </div>
    </header>

    <section class="admin-hero">
      <div class="admin-hero-content">
        <div>
          <p class="admin-eyebrow">AREA ADMIN</p>
          <h1>{{ pageTitle }}</h1>
        </div>
      </div>
    </section>

    <div class="admin-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import Swal from 'sweetalert2';

defineProps({
  pageTitle: {
    type: String,
    required: true
  }
});

const router = useRouter();
const authStore = useAuthStore();

const prosesLogout = async () => {
  const result = await Swal.fire({
    title: 'Keluar dari Sistem?',
    text: 'Anda harus login kembali untuk mengakses panel admin.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#c2413b',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Keluar',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  authStore.logout();
  await router.push('/login');

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Anda telah berhasil keluar.',
    showConfirmButton: false,
    timer: 1500
  });
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  color: #203348;
  background: #f3f8fd;
  font-family: 'Inter', 'Poppins', sans-serif;
}

.admin-navbar {
  padding: 14px 32px;
  color: #fff;
  background: linear-gradient(110deg, #102d4f, #1769aa);
  box-shadow: 0 3px 14px rgba(16, 45, 79, 0.18);
}

.navbar-content,
.admin-hero-content {
  width: min(1200px, 100%);
  margin: 0 auto;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  flex: 0 0 auto;
  color: #fff;
  font-size: 22px;
  font-weight: 750;
  text-decoration: none;
}

.admin-navigation {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.admin-navigation a,
.logout-button {
  padding: 9px 12px;
  border: 0;
  border-radius: 8px;
  color: #eaf4fc;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.admin-navigation a:hover,
.logout-button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
}

.admin-navigation a.active {
  color: #102d4f;
  background: #fff;
}

.admin-navigation .user-site-link {
  margin-left: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.logout-button {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.admin-hero {
  padding: 26px 32px;
  border-bottom: 1px solid #c9e0f3;
  background: linear-gradient(115deg, #d8ecfb, #edf6fd 55%, #c5e2f7);
}

.admin-hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.admin-eyebrow {
  margin: 0 0 5px;
  color: #1769aa;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.admin-hero h1 {
  margin: 0;
  color: #102d4f;
  font-size: clamp(24px, 3vw, 32px);
  letter-spacing: -0.5px;
}


.admin-content {
  min-height: 55vh;
  padding: 28px 20px 48px;
}

@media (max-width: 760px) {
  .admin-navbar {
    padding: 14px 18px;
  }

  .navbar-content {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .admin-navigation {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 4px;
  }

  .admin-navigation a,
  .logout-button {
    padding: 8px 9px;
    font-size: 13px;
  }

  .admin-navigation .user-site-link {
    margin-left: 0;
  }

  .admin-hero {
    padding: 22px 20px;
  }

  .admin-content {
    padding: 22px 14px 36px;
  }
}

@media (max-width: 420px) {
  .admin-hero-content {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
