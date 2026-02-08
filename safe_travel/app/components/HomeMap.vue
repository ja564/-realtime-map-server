<script lang="ts" setup>
import maplibregl from "maplibre-gl";

const mapTilerApiKey = "6kybY9Exzowy9u4AmHWC";
const API_URL = "https://realtime-map-server-1.onrender.com/api/events";

const PI = 3.1415926535897932384626;
const A = 6378245.0;
const EE = 0.006693421622965943;

// 地图和数据
const map: Ref<maplibregl.Map | null> = ref(null);
const events: Ref<any> = ref([]);
const clickedLngLat = ref();
const searchedLngLat = ref();
const searchMarker = ref();

const myLocationMarker = ref();
const myLocationWatchId = ref();
const selectedLngLat = ref();

// 表单 / 弹窗
const addressLocal = ref("");
const addressGlobal = ref("");
const showCreateModal = ref(false);
const newEventDesc = ref("");
const quickEventPresets = ref([
  "抓车",
  "查酒驾",
  "行车不规范",
  "电动车专项行动",
]); // 新增
const showDetailModal = ref(false);
const currentEvent = ref();

// PWA
const canInstall = ref(false);
const deferredPrompt = ref();

//等到map挂载好后才触发
const map_container_ref = useTemplateRef("map_container_ref");

// The watch will be triggered when the component is available
watch(
  map_container_ref,
  () => {
    // 1. 初始化地图

    map.value = new maplibregl.Map({
      container: "map",
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerApiKey}`,
      hash: true,
      center: [113.588914, 22.353487],
      zoom: 13,
    });
    map.value.addControl(new maplibregl.NavigationControl(), "top-right");

    // 2. 地图加载完拉取事件
    map.value.on("load", () => {
      console.log("地图已加载，开始获取事件...");
      fetchAndRenderEvents();
    });

    // 3. 地图点击：有事件看详情，无事件弹新增
    map.value.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      tryOpenCreateEventAt(lng, lat);
    });
  },
  { once: true },
);

if (
  import.meta.client &&
  "serviceWorker" in navigator &&
  window.location.protocol.startsWith("http")
) {
  useEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => console.log("Service Worker 注册成功:", reg.scope))
      .catch((err) => console.error("Service Worker 注册失败:", err));
  });
}

useEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt.value = e;
  canInstall.value = true;
});

// ==== 你原来的函数，逐个搬进来 ====

async function fetchAndRenderEvents() {
  try {
    const response: any = await $fetch(API_URL);
    //fetchWithTimeout(API_URL);
    const eventsData: any = response.data;
    console.log("获取到的事件:", eventsData);
    events.value = eventsData || [];
    events.value.forEach((ev) => addMarkerToMap(ev));
  } catch (error) {
    console.error("获取事件错误:", error);
    alert("服务器在唤醒，2分钟后再试。规范骑行消息你可以先在群聊中分享。");
  }
}

// 坐标系相关函数：outOfChina / transformLat / transformLng / gcj02ToWgs84
function outOfChina(lng: number, lat: number) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number) {
  let ret =
    -100.0 +
    2.0 * x +
    3.0 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  ret +=
    ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret +=
    ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) *
      2.0) /
    3.0;
  return ret;
}

function transformLng(x: number, y: number) {
  let ret =
    300.0 +
    x +
    2.0 * y +
    0.1 * x * x +
    0.1 * x * y +
    0.1 * Math.sqrt(Math.abs(x));
  ret +=
    ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret +=
    ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) *
      2.0) /
    3.0;
  return ret;
}

function gcj02ToWgs84(lng: number, lat: number) {
  if (outOfChina(lng, lat)) return { lng, lat };
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
  const mgLat = lat + dLat;
  const mgLng = lng + dLng;
  return { lng: lng - mgLng + lng, lat: lat - mgLat + lat };
}

async function geocodeAddress(address: string) {
  const apiBase = API_URL.replace("/events", "");
  const url = `${apiBase}/geocode?q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("地理编码请求失败，状态码: " + res.status);
    const data = await res.json();
    if (!data.length) return null;
    const first = data[0];
    const gcjLng = parseFloat(first.lon);
    const gcjLat = parseFloat(first.lat);
    const wgs = gcj02ToWgs84(gcjLng, gcjLat);
    return { lng: wgs.lng, lat: wgs.lat, displayName: first.display_name };
  } catch (err) {
    console.error("地理编码错误:", err);
    alert("地理编码服务暂时不可用，请稍后再试，或自行在地图上定位。");
    return null;
  }
}

function addMarkerToMap(event: any) {
  const el = document.createElement("div");
  el.className = "event-marker";
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    openEventDetailModal(event);
  });
  const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
    `<h3>事件详情</h3><p>${event.description}</p>`,
  );
  new maplibregl.Marker(el)
    .setLngLat(event.location.coordinates)
    .setPopup(popup)
    .addTo(map.value);
}

function openEventDetailModal(event: any) {
  currentEvent.value = event;
  showDetailModal.value = true;
}

function tryOpenCreateEventAt(lng: number, lat: number) {
  const hasEventNearby = events.value.some(
    (ev: { location: { coordinates: [any, any] } }) => {
      const [evLng, evLat] = ev.location.coordinates;
      const dx = Math.abs(evLng - lng);
      const dy = Math.abs(evLat - lat);
      return dx < 0.001 && dy < 0.001;
    },
  );
  if (hasEventNearby) {
    // 只看详情的话可以在这里找到最近一条并调用 openEventDetailModal
    return;
  }
  clickedLngLat.value = { lng, lat };
  newEventDesc.value = "";
  showCreateModal.value = true;
}

async function createEventAt(lng: number, lat: number, description: string) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("创建事件失败:", errText);
    alert("创建事件失败366");
    return null;
  }
  const { data: newEvent } = await res.json();
  events.value.push(newEvent);
  addMarkerToMap(newEvent);
  return newEvent;
}

function applyPreset(text: string) {
  // 覆盖填充
  newEventDesc.value = text;

  // 如果你想“追加”而不是覆盖，可以改成：
  // if (this.newEventDesc.trim()) {
  //   this.newEventDesc += `，${text}`;
  // } else {
  //   this.newEventDesc = text;
  // }
}

// === 表单 / 搜索 / 定位 / PWA 按钮（根据你原 app.js 按逻辑搬进来） ===
async function onSubmitEvent() {
  const desc = newEventDesc.value.trim();
  if (!desc || desc.length < 1) {
    alert("事件描述至少需要 1 个字符");
    return;
  }

  if (!clickedLngLat.value) {
    alert("请先在地图上点击选择位置");
    return;
  }
  if (!newEventDesc.value.trim()) {
    alert("请输入事件描述");
    return;
  }
  const { lng, lat } = clickedLngLat.value;
  await createEventAt(lng, lat, newEventDesc.value.trim());
  showCreateModal.value = false;
  clickedLngLat.value = null;
  newEventDesc.value = "";
}

function onCancelCreate() {
  showCreateModal.value = false;
  clickedLngLat.value = null;
  newEventDesc.value = "";
}

// ……这里把你 searchBtn / searchBtnGlobal / confirmSearchBtn / startLocateMe 里的逻辑
// 逐个复制成 onSearchLocal / onSearchGlobal / onConfirmLocal / startLocateMe 即可，
// 里面用 this.map / this.events 替代原来的全局变量。

async function onSearchLocal() {
  const ADDRESS_PREFIX = "珠海市香洲区";
  let userInput = addressLocal.value.trim();
  if (!userInput) {
    alert("请输入要搜索的地址");
    return;
  }

  // 如果用户输入里已经包含前缀，就不重复加
  let fullAddress;
  if (userInput.startsWith(ADDRESS_PREFIX)) {
    fullAddress = userInput;
  } else {
    fullAddress = ADDRESS_PREFIX + userInput;
  }

  const result = await geocodeAddress(fullAddress);
  if (!result) {
    alert("没有找到对应的位置，请尝试输入更详细的地址。");
    return;
  }

  const { lng, lat, displayName } = result;
  searchedLngLat.value = { lng, lat };

  // 地图飞到目标位置
  map.value.flyTo({ center: [lng, lat], zoom: 16 });

  // 如果已经有旧的搜索标记，先移除
  if (searchMarker.value) {
    searchMarker.value.remove();
  }

  // 在该位置添加一个临时标记
  const el = document.createElement("div");
  el.className = "event-marker";

  const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <h3>搜索结果</h3>
        <p>搜索地址：${fullAddress}</p>
        <p style="font-size:12px;color:#666;">${displayName}</p>
      `);

  searchMarker.value = new maplibregl.Marker(el)
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(map.value);

  searchMarker.value.togglePopup();
}
// 2b. 全局地址搜索按钮：不加任何前缀
async function onSearchGlobal() {
  const addr = addressGlobal.value.trim();
  if (!addr) {
    alert("请输入要搜索的地址");
    return;
  }

  const result = await geocodeAddress(addr); // 不加 ADDRESS_PREFIX
  if (!result) {
    alert("没有找到对应的位置，请尝试输入更详细的地址。");
    return;
  }

  const { lng, lat, displayName } = result;
  searchedLngLat.value = { lng, lat };

  map.value.flyTo({ center: [lng, lat], zoom: 16 });

  if (searchMarker.value) {
    searchMarker.value.remove();
  }

  const el = document.createElement("div");
  el.className = "event-marker";

  const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <h3>全局搜索结果</h3>
        <p>搜索地址：${addr}</p>
        <p style="font-size:12px;color:#666;">${displayName}</p>
      `);

  searchMarker.value = new maplibregl.Marker(el)
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(map.value);

  searchMarker.value.togglePopup();
}

// 3. 本地确认按钮：在搜索到的位置创建“请规范骑行”
async function onConfirmLocal() {
  if (!searchedLngLat.value) {
    alert("请先输入地址并点击“搜索”。");
    return;
  }

  const defaultDesc = "请规范骑行";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: defaultDesc,
        location: {
          type: "Point",
          coordinates: [searchedLngLat.value.lng, searchedLngLat.value.lat],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("通过搜索创建事件失败:", errText);
      alert("创建事件失败529");
      return;
    }

    const { data: newEvent } = await res.json();
    console.log("通过搜索创建的事件:", newEvent);

    events.value.push(newEvent);
    addMarkerToMap(newEvent);

    alert("已在该位置添加“请规范骑行”的事件");
    // 如需清空：this.searchedLngLat = null;
  } catch (err) {
    console.error("通过搜索创建事件错误:", err);
    alert("网络或服务器错误");
  }
}

// 3b. 全局确认按钮：逻辑与本地确认相同，复用 searchedLngLat
async function onConfirmGlobal() {
  if (!searchedLngLat.value) {
    alert("请先输入地址并点击“搜索”。");
    return;
  }

  const defaultDesc = "请规范骑行";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: defaultDesc,
        location: {
          type: "Point",
          coordinates: [searchedLngLat.value.lng, searchedLngLat.value.lat],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("通过搜索创建事件失败:", errText);
      alert("创建事件失败572");
      return;
    }

    const { data: newEvent } = await res.json();
    console.log("通过搜索创建的事件:", newEvent);

    events.value.push(newEvent);
    addMarkerToMap(newEvent);

    alert("已在该位置添加“请规范骑行”的事件");
  } catch (err) {
    console.error("通过搜索创建事件错误:", err);
    alert("网络或服务器错误");
  }
}

// 开启 GPS 定位，并在地图上显示当前所在位置
function startLocateMe() {
  if (!navigator.geolocation) {
    alert("当前浏览器不支持定位功能");
    return;
  }

  // 如果之前已经在监听了，先关闭，避免重复
  if (myLocationWatchId.value !== null) {
    navigator.geolocation.clearWatch(myLocationWatchId.value);
    myLocationWatchId.value = null;
  }

  // 开始持续监听位置变化
  myLocationWatchId.value = navigator.geolocation.watchPosition(
    (pos) => {
      // 注意：浏览器 geolocation 返回的就是 WGS‑84 坐标，和 MapTiler 一致
      const lng = pos.coords.longitude;
      const lat = pos.coords.latitude;

      console.log("GPS 定位:", lng, lat);

      // 第一次定位时或 marker 不存在时创建标记
      if (!myLocationMarker.value) {
        // 容器：里面放“蓝点 + 按钮”
        const container = document.createElement("div");
        container.className = "my-location-container";

        // 蓝点
        const dot = document.createElement("div");
        dot.className = "my-location-marker";
        container.appendChild(dot);
        // “添加事件”按钮
        const btn = document.createElement("button");
        btn.className = "my-location-add-btn";
        btn.textContent = "+";

        // 点击按钮时复用和地图点击一样的逻辑
        btn.addEventListener("click", async (e) => {
          e.stopPropagation(); // 不触发地图点击
          // tryOpenCreateEventAt(lng, lat);

          // 1. 先检查附近是否已有事件（复用你原来的逻辑）
          const hasEventNearby = events.value.some((ev) => {
            const [evLng, evLat] = ev.location.coordinates;
            const dx = Math.abs(evLng - lng);
            const dy = Math.abs(evLat - lat);
            return dx < 0.001 && dy < 0.001;
          });

          if (hasEventNearby) {
            alert("你当前位置附近已有标记事件，不重复添加。");
            return;
          }

          // 2. 没有事件 → 直接调用后端创建默认事件
          const defaultDesc = "请规范骑行";

          try {
            const res = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: defaultDesc,
                location: {
                  type: "Point",
                  coordinates: [lng, lat], // 注意：用当前位置，而不是 searchedLngLat
                },
              }),
            });

            if (!res.ok) {
              const errText = await res.text();
              console.error("通过定位创建事件失败:", errText);
              alert("创建事件失败665");
              return;
            }

            const { data: newEvent } = await res.json();
            console.log("通过定位创建的事件:", newEvent);

            events.value.push(newEvent);
            addMarkerToMap(newEvent);

            alert("已在你当前位置添加“请规范骑行”的事件");
          } catch (err) {
            console.error("通过定位创建事件错误:", err);
            alert("网络或服务器错误");
          }
        });
        container.appendChild(btn);

        // const el = document.createElement('div');
        // el.className = 'my-location-marker'; // 你可以在 CSS 里定义成蓝色小圆点

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(
          "<p>你当前的大致位置</p>",
        );

        myLocationMarker.value = new maplibregl.Marker({
          element: container,
          anchor: "center",
        })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.value);

        // 地图飞到当前位置
        map.value.flyTo({ center: [lng, lat], zoom: 16 });
      } else {
        // 已经有标记了，只更新位置
        myLocationMarker.value.setLngLat([lng, lat]);
      }
      // 2) 把当前位置当作“选中坐标”，复用事件创建逻辑
      selectedLngLat.value = { lng, lat }; // 关键：相当于在地图上点了这个位置

      // 3) 打开“在此处标记新事件”弹窗
      // openEventModal();
    },
    (err) => {
      console.error("定位失败:", err);
      switch (err.code) {
        case err.PERMISSION_DENIED:
          alert("定位被拒绝，请在浏览器中允许访问位置信息。");
          break;
        case err.POSITION_UNAVAILABLE:
          alert("无法获取位置信息，请检查手机 GPS 是否开启。");
          break;
        case err.TIMEOUT:
          alert("获取位置信息超时，请稍后重试。");
          break;
        default:
          alert("获取位置信息失败。");
      }
    },
    {
      enableHighAccuracy: true, // 尽量用高精度（会更耗电）
      timeout: 15000, // 15 秒超时
      maximumAge: 10000, // 10 秒内的缓存定位可接受
    },
  );
}

async function onInstallClick() {
  if (!deferredPrompt.value) {
    alert("当前暂不支持安装，请稍后再试。");
    return;
  }
  deferredPrompt.value.prompt();
  const choice = await deferredPrompt.value.userChoice;
  console.log("PWA 安装结果:", choice.outcome);
  deferredPrompt.value = null;
  canInstall.value = false;
}
</script>

<template>
  <ElButton class="install_btn" color="#007bffd9" @click="onInstallClick">
    安装到桌面
  </ElButton>
  <div class="map_container" :class="{ mobile: $device.isMobileOrTablet }">
    <!-- 地址搜索栏（香洲区） -->
    <div class="search_local_bar">
      <!-- 原来的输入和按钮保持不变 -->
      <ElInput
        type="text"
        v-model="addressLocal"
        placeholder="此处输入珠海市香洲区子地址，例如（路名：XX路；地标：宝龙城、信息港；）"
      />
      <ElButton type="primary" color="#007bff" @click="onSearchLocal"
        >搜索</ElButton
      >
      <ElButton @click="onConfirmLocal"> 确认并添加“请规范骑行” </ElButton>
    </div>

    <!-- 全局搜索 -->
    <div class="search_global_bar">
      <ElInput
        type="text"
        v-model="addressGlobal"
        placeholder="输入任意城市/地址进行全局搜索，例如：广州市天河区体育西路"
      />
      <ElButton type="primary" color="#007bff" @click="onSearchGlobal"
        >搜索</ElButton
      >
      <ElButton @click="onConfirmGlobal"> 确认并添加“请规范骑行” </ElButton>
    </div>

    <!-- 地图容器：放在右侧主体内部 -->
    <ClientOnly>
      <div
        id="map"
        class="map_box"
        :class="{ mobile: $device.isMobileOrTablet }"
        ref="map_container_ref"
      >
        <ElButton
          class="locate_me_btn"
          color="rgba(255, 60, 0, .7)"
          @click="startLocateMe"
          >定位到我</ElButton
        >
      </div>
    </ClientOnly>
  </div>

  <!-- 新建事件模态框 / 事件详情模态框 保持不变 -->
  <el-dialog
    v-model="showCreateModal"
    title="在此处标记新事件"
    :width="$device.isDesktop ? 500 : 'calc(100vw - 40px)'"
    :before-close="onCancelCreate"
  >
    <div class="new_event_box">
      <!-- <form @submit.prevent="onSubmitEvent">
              <textarea
                v-model="newEventDesc"
                placeholder="输入事件描述，例如：交错动车..."
                required
                minlength="5"
              ></textarea>
              <div class="modal-actions">
                <button type="submit" class="btn-primary">提交</button>
                <button type="button" class="btn-secondary" @click="onCancelCreate">取消</button>
              </div>
            </form> -->

      <div>
        <p>点击填入</p>
        <el-segmented v-model="newEventDesc" :options="quickEventPresets" />
      </div>

      <el-input
        type="textarea"
        v-model="newEventDesc"
        :rows="4"
        placeholder="输入事件描述，例如：正在查车..."
      />
    </div>
    <template #footer>
      <div class="modal-actions">
        <el-button type="primary" @click="onSubmitEvent">提交</el-button>
        <el-button @click="onCancelCreate">取消</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showDetailModal"
    title="事件详情"
    :width="$device.isDesktop ? 500 : 'calc(100vw - 40px)'"
    :before-close="onCancelCreate"
    ><div class="modal-content">
      <p v-if="currentEvent">{{ currentEvent.description }}</p>
      <div class="modal-actions">
        <ElButton @click="showDetailModal = false"> 关闭 </ElButton>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.search_local_bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  /*background: rgba(255, 255, 255, 0.9);
  z-index: 3;*/
}

.search_global_bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.map_container {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
  height: 100%;
}

.map_container.mobile {
  margin-bottom: 20px;
}

.map_box {
  flex: 1; /* 占满右侧面板剩余空间 */
  width: 100%;
  min-height: 0;
  position: relative; /* 新增：让内部绝对定位元素以它为参考 */
}

.map_box.mobile {
  min-height: 70vh;
}

.new_event_box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.install_btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  opacity: 0.85;
}

.locate_me_btn {
  position: absolute; /* 相对 .map-container 定位，而不是整个窗口 */
  top: 20px; /* 距离顶部，可以根据你的标题高度微调 */
  left: 10px; /* 距离左侧 80 像素 */
  z-index: 10; /* 保证在地图之上 */
}
</style>
