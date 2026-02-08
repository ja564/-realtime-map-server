
// <template>
//   <!-- 直接粘你现在 main.map-panel 里面的内容 -->
//   <main class="map-panel">
        
//         <button class="install-btn" :class="{ hide: !canInstall }" @click="onInstallClick">
//           安装到桌面
//         </button>

//         <!-- 地址搜索栏（香洲区） -->
//         <div class="search-bar">
//           <!-- 原来的输入和按钮保持不变 -->
//           <input
//             type="text"
//             v-model="addressLocal"
//             placeholder="此处输入珠海市香洲区子地址，例如（路名：XX路；地标：宝龙城、信息港；）"
//           />
//           <button type="button" class="btn-primary" @click="onSearchLocal">搜索</button>
//           <button type="button" class="btn-secondary" @click="onConfirmLocal">
//             确认并添加“请规范骑行”
//           </button>
//         </div>

//         <!-- 全局搜索 -->
//         <div class="search-row">
//           <input
//             type="text"
//             v-model="addressGlobal"
//             placeholder="输入任意城市/地址进行全局搜索，例如：广州市天河区体育西路"
//           />
//           <button type="button" class="btn-primary" @click="onSearchGlobal">搜索</button>
//           <button type="button" class="btn-secondary" @click="onConfirmGlobal">
//             确认并添加“请规范骑行”
//           </button>
//         </div>

//         <!-- 地图容器：放在右侧主体内部 -->
//         <div id="map" class="map-container">
//           <button class="locate-me-btn" @click="startLocateMe">定位到我</button>

//         </div>

//         <!-- 新建事件模态框 / 事件详情模态框 保持不变 -->
//         <div id="event-modal" class="modal-overlay" :class="{ hide: !showCreateModal }">
//           <div class="modal-content">
//             <h2>在此处标记新事件</h2>

//             <!-- <form @submit.prevent="onSubmitEvent">
//               <textarea
//                 v-model="newEventDesc"
//                 placeholder="输入事件描述，例如：交错动车..."
//                 required
//                 minlength="5"
//               ></textarea>
//               <div class="modal-actions">
//                 <button type="submit" class="btn-primary">提交</button>
//                 <button type="button" class="btn-secondary" @click="onCancelCreate">取消</button>
//               </div>
//             </form> -->

//             <!-- 使用 Element UI 表单 -->
//             <el-form @submit.native.prevent="onSubmitEvent">
//               <el-form-item label="点击填入">
//                 <el-button
//                   v-for="item in quickEventPresets"
//                   :key="item"
//                   size="mini"
//                   @click="applyPreset(item)"
//                 >
//                   {{ item }}
//                 </el-button>


//                 <el-form-item >
//                 <el-input
//                   type="textarea"
//                   v-model="newEventDesc"
//                   :rows="4"
//                   placeholder="输入事件描述，例如：正在查车..."
//                 />
//                 </el-form-item>

                
//               </el-form-item>

//               <div class="modal-actions">
//                 <el-button type="primary" @click="onSubmitEvent">提交</el-button>
//                 <el-button @click="onCancelCreate">取消</el-button>
//               </div>
//             </el-form>
//           </div>
//         </div>

//         <div class="modal-overlay" :class="{ hide: !showDetailModal }">
//           <div class="modal-content">
//             <h2>事件详情</h2>
//             <p v-if="currentEvent">{{ currentEvent.description }}</p>
//             <div class="modal-actions">
//               <button type="button" class="btn-secondary" @click="showDetailModal = false">
//                 关闭
//               </button>
//             </div>
//           </div>
//         </div>
//       </main>
// </template>

// <script>
// import maplibregl from 'maplibre-gl';

// const mapTilerApiKey = '...';
// const API_URL = 'https://realtime-map-server-1.onrender.com/api/events';

// const PI = 3.1415926535897932384626;
// const A = 6378245.0;
// const EE = 0.006693421622965943;

// export default {
//   name: 'MapPanel',
//   data() {
//     return {
//       // 你现在 data() 里的内容全部照搬
//     };
//   },
//   mounted() {
//     // 你现在的 mounted() 原样复制
//   },
//   methods: {
//     // 你现在 methods 里的所有函数原样复制
//   },
// };
// </script>

// <style scoped lang="scss">
// /* 针对 map-panel 的样式，可以从原 App.vue 或 style.scss 里复制 */
// </style>

<template>
  <div>这里是 MapPanel 测试</div>
</template>

<script setup>