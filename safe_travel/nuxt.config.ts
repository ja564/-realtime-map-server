// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/scripts", "@element-plus/nuxt", "@vueuse/nuxt", "@nuxtjs/device"],
  css: ["@/assets/global.css", "maplibre-gl/dist/maplibre-gl.css"],
  app: {
    rootAttrs: {
      id: "safe",
    },
    head: {
      title: "文明珠海安全出行",
      link: [{ rel: "icon", type: "image/png", href: "/icon-192.png" }],
      htmlAttrs: {
        lang: "zh-CN",
      },
    },
  },
});