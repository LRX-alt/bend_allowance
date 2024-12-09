import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue'; // Assicurati di avere una pagina Home o creane una
import PezziLamiera from '../modules/gestionePezzi/components/PezziLamiera.vue'; // Importa il componente PezziLamiera

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/gestione-pezzi',
    name: 'GestionePezzi',
    component: PezziLamiera
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
