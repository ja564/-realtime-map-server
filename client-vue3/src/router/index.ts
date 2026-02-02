import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import AboutView from '../views/AboutView.vue';
import SuggestView from '../views/SuggestionView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
  {
    path: '/suggest',
    name: 'suggest',
    component: SuggestView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;