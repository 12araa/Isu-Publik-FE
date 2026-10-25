import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue' 
import ManualFetchView from '../views/ManualFetchView.vue'
import KelolaIsuView from '../views/KelolaIsuView.vue'
import UserListIsuView from '../views/UserListIsuView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/admin/dashboard', 
      name: 'adminDashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/tarik-manual',
      name: 'tarik-manual',
      component: ManualFetchView,
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    },
    {
      path: '/kelola-isu',
      name: 'kelola-isu',
      component: KelolaIsuView,
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: UserListIsuView
    }
  ]
})

router.beforeEach((to, from) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated && to.name !== 'login') {
    return { name: 'login' };
  } 
  else if (to.meta.requiresGuest && isAuthenticated && to.name !== 'dashboard') {
    return { name: 'dashboard' };
  }
  
  return true;
});

export default router
