<template>
  <div id="app">
    <h1 class="page-title">文明珠海安全出行</h1>

    <div class="layout">
      <!-- 左侧：导航 + 当前 tab 内容 -->
      <aside class="side-panel">
        <nav class="nav-links">
          <button
            class="nav-btn"
            :class="{ active: activeTab === 'notice' }"
            @click="activeTab = 'notice'"
          >
            公告
          </button>
          |
          <button
            class="nav-btn"
            :class="{ active: activeTab === 'usage' }"
            @click="activeTab = 'usage'"
          >
            使用说明
          </button>
          |
          <button
            class="nav-btn"
            :class="{ active: activeTab === 'suggest' }"
            @click="activeTab = 'suggest'"
          >
            功能建议
          </button>
        </nav>

        <!-- 根据 activeTab 显示不同内容 -->
        <section class="tab-content">
          <NoticePanel v-if="activeTab === 'notice'" />
          <UsagePanel v-else-if="activeTab === 'usage'" />
          <SuggestPanel v-else />
        </section>
      </aside>

      <!-- 右侧：地图区域（仅在客户端挂载） -->
      <main class="map-panel">
        <client-only>
          <MapPanel />
        </client-only>
      </main>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 左侧三个内容组件（按上一步放在 components/ 里）
import NoticePanel from '~/components/NoticePanel.vue';
import UsagePanel from '~/components/UsagePanel.vue';
import SuggestPanel from '~/components/SuggestPanel.vue';
import MapPanel from '~/components/MapPanel.vue';
import SiteFooter from '~/components/SiteFooter.vue';

const activeTab = ref<'notice' | 'usage' | 'suggest'>('notice');
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
}

.layout {
  display: flex;
  height: 100vh;
}

.side-panel {
  width: 400px;
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid #eee;
}

.map-panel {
  flex: 1;
  position: relative;
}

/* 导航按钮样式 */
.nav-links {
  margin-bottom: 10px;
}

.nav-btn {
  border: none;
  background: transparent;
  padding: 0 4px;
  cursor: pointer;
  font-weight: bold;
  color: #2c3e50;
  font-size: 16px;
}

.nav-btn.active {
  color: #42b983;
}

/* tab 内容区域 */
.tab-content {
  margin-top: 12px;
}
</style>
