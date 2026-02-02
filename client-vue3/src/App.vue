<template>
  <div id="app">
    <h1 class="page-title">文明珠海安全出行</h1>

    <!-- 整体左右布局容器 -->
    <div class="layout">
      <!-- 左侧：导航 + 路由内容 -->
      <aside class="side-panel">
        <nav class="nav-links">
          <router-link to="/">公告</router-link> |
          <router-link to="/about">使用说明</router-link>
        </nav>

        <!-- 路由页面内容会显示在这里 -->
        <router-view />
      </aside>

      <!-- 右侧：地图 + 搜索 + 按钮 + 弹窗 -->
      <main class="map-panel">
        
        <button class="install-btn" :class="{ hide: !canInstall }" @click="onInstallClick">
          安装到桌面
        </button>

        <!-- 地址搜索栏（香洲区） -->
        <div class="search-bar">
          <!-- 原来的输入和按钮保持不变 -->
          <input
            type="text"
            v-model="addressLocal"
            placeholder="此处输入珠海市香洲区子地址，例如（路名：XX路；地标：宝龙城、信息港；）"
          />
          <button type="button" class="btn-primary" @click="onSearchLocal">搜索</button>
          <button type="button" class="btn-secondary" @click="onConfirmLocal">
            确认并添加“请规范骑行”
          </button>
        </div>

        <!-- 全局搜索 -->
        <div class="search-row">
          <input
            type="text"
            v-model="addressGlobal"
            placeholder="输入任意城市/地址进行全局搜索，例如：广州市天河区体育西路"
          />
          <button type="button" class="btn-primary" @click="onSearchGlobal">搜索</button>
          <button type="button" class="btn-secondary" @click="onConfirmGlobal">
            确认并添加“请规范骑行”
          </button>
        </div>

        <!-- 地图容器：放在右侧主体内部 -->
        <div id="map" class="map-container">
          <button class="locate-me-btn" @click="startLocateMe">定位到我</button>

        </div>

        <!-- 新建事件模态框 / 事件详情模态框 保持不变 -->
        <div id="event-modal" class="modal-overlay" :class="{ hide: !showCreateModal }">
          <div class="modal-content">
            <h2>在此处标记新事件</h2>

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

            <!-- 使用 Element UI 表单 -->
            <el-form @submit.native.prevent="onSubmitEvent">
              <el-form-item label="点击填入">
                <el-button
                  v-for="item in quickEventPresets"
                  :key="item"
                  size="mini"
                  @click="applyPreset(item)"
                >
                  {{ item }}
                </el-button>


                <el-form-item >
                <el-input
                  type="textarea"
                  v-model="newEventDesc"
                  :rows="4"
                  placeholder="输入事件描述，例如：正在查车..."
                />
                </el-form-item>

                
              </el-form-item>

              <div class="modal-actions">
                <el-button type="primary" @click="onSubmitEvent">提交</el-button>
                <el-button @click="onCancelCreate">取消</el-button>
              </div>
            </el-form>
          </div>
        </div>

        <div class="modal-overlay" :class="{ hide: !showDetailModal }">
          <div class="modal-content">
            <h2>事件详情</h2>
            <p v-if="currentEvent">{{ currentEvent.description }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showDetailModal = false">
                关闭
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 新增：页面底部 footer -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-column">
          <h4>文明出行</h4>
          <ul>
            <li>安全头盔</li>
            <li>规范停放</li>
            <li>礼让行人</li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>平台信息</h4>
          <ul>
            <li>使用说明</li>
            <li>数据来源</li>
            <li>隐私与声明</li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>联系与反馈</h4>
          <ul>
            <router-link to="/suggest">功能建议</router-link>
          </ul>

          <!-- 微信二维码 -->
          <div class="wechat-qrcode">
            <p>微信扫码联系作者：</p>
            <img src="@/assets/wechat-qrcode.png" alt="微信二维码" />
          </div>
        </div>

        <div class="footer-column newsletter">
          <h4>订阅更新</h4>
          <p>获取电动车整治与文明出行相关更新。</p>
          <div class="newsletter-input">
            <input type="email" placeholder="you@domain.com" />
            <button type="button">订阅</button>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>Copyright © 2026 文明安全出行</span>
      </div>
    </footer>
  </div>
</template>

<script>
import maplibregl from 'maplibre-gl';

const mapTilerApiKey = '6kybY9Exzowy9u4AmHWC';
const API_URL = 'https://realtime-map-server-1.onrender.com/api/events';

const PI = 3.1415926535897932384626;
const A = 6378245.0;
const EE = 0.006693421622965943;

export default {
  name: 'App',
  data() {
    return {
      // 地图和数据
      map: null,
      events: [],
      clickedLngLat: null,
      searchedLngLat: null,
      searchMarker: null,

      myLocationMarker: null,
      myLocationWatchId: null,
      selectedLngLat: null,

      // 表单 / 弹窗
      addressLocal: '',
      addressGlobal: '',
      showCreateModal: false,
      newEventDesc: '',
      quickEventPresets: ['抓车', '查酒驾', '行车不规范', '电动车专项行动'], // 新增
      showDetailModal: false,
      currentEvent: null,

      // PWA
      canInstall: false,
      deferredPrompt: null,
    };
  },
  mounted() {
    // 1. 初始化地图
    this.map = new maplibregl.Map({
      container: 'map',
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerApiKey}`,
      hash: true,
      center: [113.588914, 22.353487],
      zoom: 13,
    });
    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // 2. 地图加载完拉取事件
    this.map.on('load', () => {
      console.log('地图已加载，开始获取事件...');
      this.fetchAndRenderEvents();
    });

    // 3. 地图点击：有事件看详情，无事件弹新增
    this.map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      this.tryOpenCreateEventAt(lng, lat);
    });

    // 4. PWA 安装事件
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => console.log('Service Worker 注册成功:', reg.scope))
          .catch((err) => console.error('Service Worker 注册失败:', err));
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall = true;
    });
  },
  methods: {
    // ==== 你原来的函数，逐个搬进来 ====

    async fetchWithTimeout(url, options = {}, timeout = 20000) {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('请求超时')), timeout),
        ),
      ]);
    },

    async fetchAndRenderEvents() {
      try {
        const response = await this.fetchWithTimeout(API_URL);
        if (!response.ok) throw new Error('获取事件失败');
        const { data: eventsData } = await response.json();
        console.log('获取到的事件:', eventsData);
        this.events = eventsData || [];
        this.events.forEach((ev) => this.addMarkerToMap(ev));
      } catch (error) {
        console.error('获取事件错误:', error);
        alert('服务器在唤醒，2分钟后再试。规范骑行消息你可以先在群聊中分享。');
      }
    },

    // 坐标系相关函数：outOfChina / transformLat / transformLng / gcj02ToWgs84
    outOfChina(lng, lat) {
      return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
    },
    transformLat(x, y) {
      let ret =
        -100.0 +
        2.0 * x +
        3.0 * y +
        0.2 * y * y +
        0.1 * x * y +
        0.2 * Math.sqrt(Math.abs(x));
      ret +=
        ((20.0 * Math.sin(6.0 * x * PI) +
          20.0 * Math.sin(2.0 * x * PI)) *
          2.0) /
        3.0;
      ret +=
        ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) /
        3.0;
      ret +=
        ((160.0 * Math.sin((y / 12.0) * PI) +
          320 * Math.sin((y * PI) / 30.0)) *
          2.0) /
        3.0;
      return ret;
    },
    transformLng(x, y) {
      let ret =
        300.0 +
        x +
        2.0 * y +
        0.1 * x * x +
        0.1 * x * y +
        0.1 * Math.sqrt(Math.abs(x));
      ret +=
        ((20.0 * Math.sin(6.0 * x * PI) +
          20.0 * Math.sin(2.0 * x * PI)) *
          2.0) /
        3.0;
      ret +=
        ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) /
        3.0;
      ret +=
        ((150.0 * Math.sin((x / 12.0) * PI) +
          300.0 * Math.sin((x / 30.0) * PI)) *
          2.0) /
        3.0;
      return ret;
    },
    gcj02ToWgs84(lng, lat) {
      if (this.outOfChina(lng, lat)) return { lng, lat };
      let dLat = this.transformLat(lng - 105.0, lat - 35.0);
      let dLng = this.transformLng(lng - 105.0, lat - 35.0);
      const radLat = (lat / 180.0) * PI;
      let magic = Math.sin(radLat);
      magic = 1 - EE * magic * magic;
      const sqrtMagic = Math.sqrt(magic);
      dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
      dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
      const mgLat = lat + dLat;
      const mgLng = lng + dLng;
      return { lng: lng - mgLng + lng, lat: lat - mgLat + lat };
    },

    async geocodeAddress(address) {
      const apiBase = API_URL.replace('/events', '');
      const url = `${apiBase}/geocode?q=${encodeURIComponent(address)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('地理编码请求失败，状态码: ' + res.status);
        const data = await res.json();
        if (!data.length) return null;
        const first = data[0];
        const gcjLng = parseFloat(first.lon);
        const gcjLat = parseFloat(first.lat);
        const wgs = this.gcj02ToWgs84(gcjLng, gcjLat);
        return { lng: wgs.lng, lat: wgs.lat, displayName: first.display_name };
      } catch (err) {
        console.error('地理编码错误:', err);
        alert('地理编码服务暂时不可用，请稍后再试，或自行在地图上定位。');
        return null;
      }
    },

    addMarkerToMap(event) {
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEventDetailModal(event);
      });
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
        `<h3>事件详情</h3><p>${event.description}</p>`,
      );
      new maplibregl.Marker(el)
        .setLngLat(event.location.coordinates)
        .setPopup(popup)
        .addTo(this.map);
    },

    openEventDetailModal(event) {
      this.currentEvent = event;
      this.showDetailModal = true;
    },

    tryOpenCreateEventAt(lng, lat) {
      const hasEventNearby = this.events.some((ev) => {
        const [evLng, evLat] = ev.location.coordinates;
        const dx = Math.abs(evLng - lng);
        const dy = Math.abs(evLat - lat);
        return dx < 0.001 && dy < 0.001;
      });
      if (hasEventNearby) {
        // 只看详情的话可以在这里找到最近一条并调用 openEventDetailModal
        return;
      }
      this.clickedLngLat = { lng, lat };
      this.newEventDesc = '';
      this.showCreateModal = true;
    },

    async createEventAt(lng, lat, description) {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          location: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('创建事件失败:', errText);
        alert('创建事件失败366');
        return null;
      }
      const { data: newEvent } = await res.json();
      this.events.push(newEvent);
      this.addMarkerToMap(newEvent);
      return newEvent;
    },

    applyPreset(text) {
      // 覆盖填充
      this.newEventDesc = text;

      // 如果你想“追加”而不是覆盖，可以改成：
      // if (this.newEventDesc.trim()) {
      //   this.newEventDesc += `，${text}`;
      // } else {
      //   this.newEventDesc = text;
      // }
    },

    // === 表单 / 搜索 / 定位 / PWA 按钮（根据你原 app.js 按逻辑搬进来） ===
    async onSubmitEvent() {
      const desc = this.newEventDesc.trim();
      if (!desc || desc.length < 1) {
        alert('事件描述至少需要 1 个字符');
        return;
      }

      if (!this.clickedLngLat) {
        alert('请先在地图上点击选择位置');
        return;
      }
      if (!this.newEventDesc.trim()) {
        alert('请输入事件描述');
        return;
      }
      const { lng, lat } = this.clickedLngLat;
      await this.createEventAt(lng, lat, this.newEventDesc.trim());
      this.showCreateModal = false;
      this.clickedLngLat = null;
      this.newEventDesc = '';
    },
    onCancelCreate() {
      this.showCreateModal = false;
      this.clickedLngLat = null;
      this.newEventDesc = '';
    },

    // ……这里把你 searchBtn / searchBtnGlobal / confirmSearchBtn / startLocateMe 里的逻辑
    // 逐个复制成 onSearchLocal / onSearchGlobal / onConfirmLocal / startLocateMe 即可，
    // 里面用 this.map / this.events 替代原来的全局变量。
    

    async onSearchLocal() {
      const ADDRESS_PREFIX = '珠海市香洲区';
      let userInput = this.addressLocal.trim();
      if (!userInput) {
        alert('请输入要搜索的地址');
        return;
      }

      // 如果用户输入里已经包含前缀，就不重复加
      let fullAddress;
      if (userInput.startsWith(ADDRESS_PREFIX)) {
        fullAddress = userInput;
      } else {
        fullAddress = ADDRESS_PREFIX + userInput;
      }

      const result = await this.geocodeAddress(fullAddress);
      if (!result) {
        alert('没有找到对应的位置，请尝试输入更详细的地址。');
        return;
      }

      const { lng, lat, displayName } = result;
      this.searchedLngLat = { lng, lat };

      // 地图飞到目标位置
      this.map.flyTo({ center: [lng, lat], zoom: 16 });

      // 如果已经有旧的搜索标记，先移除
      if (this.searchMarker) {
        this.searchMarker.remove();
      }

      // 在该位置添加一个临时标记
      const el = document.createElement('div');
      el.className = 'event-marker';

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <h3>搜索结果</h3>
        <p>搜索地址：${fullAddress}</p>
        <p style="font-size:12px;color:#666;">${displayName}</p>
      `);

      this.searchMarker = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(this.map);

      this.searchMarker.togglePopup();
    },
    // 2b. 全局地址搜索按钮：不加任何前缀
    async onSearchGlobal() {
      const addr = this.addressGlobal.trim();
      if (!addr) {
        alert('请输入要搜索的地址');
        return;
      }

      const result = await this.geocodeAddress(addr); // 不加 ADDRESS_PREFIX
      if (!result) {
        alert('没有找到对应的位置，请尝试输入更详细的地址。');
        return;
      }

      const { lng, lat, displayName } = result;
      this.searchedLngLat = { lng, lat };

      this.map.flyTo({ center: [lng, lat], zoom: 16 });

      if (this.searchMarker) {
        this.searchMarker.remove();
      }

      const el = document.createElement('div');
      el.className = 'event-marker';

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <h3>全局搜索结果</h3>
        <p>搜索地址：${addr}</p>
        <p style="font-size:12px;color:#666;">${displayName}</p>
      `);

      this.searchMarker = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(this.map);

      this.searchMarker.togglePopup();
    },

    // 3. 本地确认按钮：在搜索到的位置创建“请规范骑行”
    async onConfirmLocal() {
      if (!this.searchedLngLat) {
        alert('请先输入地址并点击“搜索”。');
        return;
      }

      const defaultDesc = '请规范骑行';

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: defaultDesc,
            location: {
              type: 'Point',
              coordinates: [this.searchedLngLat.lng, this.searchedLngLat.lat],
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('通过搜索创建事件失败:', errText);
          alert('创建事件失败529');
          return;
        }

        const { data: newEvent } = await res.json();
        console.log('通过搜索创建的事件:', newEvent);

        this.events.push(newEvent);
        this.addMarkerToMap(newEvent);

        alert('已在该位置添加“请规范骑行”的事件');
        // 如需清空：this.searchedLngLat = null;
      } catch (err) {
        console.error('通过搜索创建事件错误:', err);
        alert('网络或服务器错误');
      }
    },

    // 3b. 全局确认按钮：逻辑与本地确认相同，复用 searchedLngLat
    async onConfirmGlobal() {
      if (!this.searchedLngLat) {
        alert('请先输入地址并点击“搜索”。');
        return;
      }

      const defaultDesc = '请规范骑行';

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: defaultDesc,
            location: {
              type: 'Point',
              coordinates: [this.searchedLngLat.lng, this.searchedLngLat.lat],
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('通过搜索创建事件失败:', errText);
          alert('创建事件失败572');
          return;
        }

        const { data: newEvent } = await res.json();
        console.log('通过搜索创建的事件:', newEvent);

        this.events.push(newEvent);
        this.addMarkerToMap(newEvent);

        alert('已在该位置添加“请规范骑行”的事件');
      } catch (err) {
        console.error('通过搜索创建事件错误:', err);
        alert('网络或服务器错误');
      }
    },

    

    // 开启 GPS 定位，并在地图上显示当前所在位置
    startLocateMe() {
        if (!navigator.geolocation) {
            alert('当前浏览器不支持定位功能');
            return;
        }

        // 如果之前已经在监听了，先关闭，避免重复
        if (this.myLocationWatchId !== null) {
            navigator.geolocation.clearWatch(this.myLocationWatchId);
            this.myLocationWatchId = null;
        }

        // 开始持续监听位置变化
        this.myLocationWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                // 注意：浏览器 geolocation 返回的就是 WGS‑84 坐标，和 MapTiler 一致
                const lng = pos.coords.longitude;
                const lat = pos.coords.latitude;

                console.log('GPS 定位:', lng, lat);

                // 第一次定位时或 marker 不存在时创建标记
                if (!this.myLocationMarker) {
                    // 容器：里面放“蓝点 + 按钮”
                    const container = document.createElement('div');
                    container.className = 'my-location-container';

                    // 蓝点
                    const dot = document.createElement('div');
                    dot.className = 'my-location-marker';
                    container.appendChild(dot);
                    // “添加事件”按钮
                    const btn = document.createElement('button');
                    btn.className = 'my-location-add-btn';
                    btn.textContent = '+';

                    // 点击按钮时复用和地图点击一样的逻辑
                    btn.addEventListener('click', async(e) => {
                        e.stopPropagation(); // 不触发地图点击
                        // tryOpenCreateEventAt(lng, lat);

                        // 1. 先检查附近是否已有事件（复用你原来的逻辑）
                        const hasEventNearby = this.events.some(ev => {
                            const [evLng, evLat] = ev.location.coordinates;
                            const dx = Math.abs(evLng - lng);
                            const dy = Math.abs(evLat - lat);
                            return dx < 0.001 && dy < 0.001;
                        });             

                        if (hasEventNearby) {
                            alert('你当前位置附近已有标记事件，不重复添加。');
                            return;
                        }

                        // 2. 没有事件 → 直接调用后端创建默认事件
                        const defaultDesc = '请规范骑行';

                        try {
                            const res = await fetch(API_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    description: defaultDesc,
                                    location: {
                                        type: 'Point',
                                        coordinates: [lng, lat],   // 注意：用当前位置，而不是 searchedLngLat
                                    },
                                }),
                            });

                            if (!res.ok) {
                                const errText = await res.text();
                                console.error('通过定位创建事件失败:', errText);
                                alert('创建事件失败665');
                                return;
                            }

                            const { data: newEvent } = await res.json();
                            console.log('通过定位创建的事件:', newEvent);

                            this.events.push(newEvent);
                            this.addMarkerToMap(newEvent);

                            alert('已在你当前位置添加“请规范骑行”的事件');
                        } catch (err) {
                            console.error('通过定位创建事件错误:', err);
                            alert('网络或服务器错误');
                        }
                    });
                    container.appendChild(btn);

                    // const el = document.createElement('div');
                    // el.className = 'my-location-marker'; // 你可以在 CSS 里定义成蓝色小圆点

                    const popup = new maplibregl.Popup({ offset: 15 }).setHTML(
                        '<p>你当前的大致位置</p>'
                    );

                    this.myLocationMarker = new maplibregl.Marker({
                        element: container,
                        anchor: 'center',   
                    })
                        .setLngLat([lng, lat])
                        .setPopup(popup)
                        .addTo(this.map);

                    // 地图飞到当前位置
                    this.map.flyTo({ center: [lng, lat], zoom: 16 });
                } else {
                    // 已经有标记了，只更新位置
                    this.myLocationMarker.setLngLat([lng, lat]);
                }
                // 2) 把当前位置当作“选中坐标”，复用事件创建逻辑
                this.selectedLngLat = { lng, lat };  // 关键：相当于在地图上点了这个位置

                // 3) 打开“在此处标记新事件”弹窗
                // openEventModal();
            },
            (err) => {
                console.error('定位失败:', err);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        alert('定位被拒绝，请在浏览器中允许访问位置信息。');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        alert('无法获取位置信息，请检查手机 GPS 是否开启。');
                        break;
                    case err.TIMEOUT:
                        alert('获取位置信息超时，请稍后重试。');
                        break;
                    default:
                        alert('获取位置信息失败。');
                }
            },
            {
                enableHighAccuracy: true, // 尽量用高精度（会更耗电）
                timeout: 15000,           // 15 秒超时
                maximumAge: 10000,        // 10 秒内的缓存定位可接受
            }
        );
    },


    async onInstallClick() {
      if (!this.deferredPrompt) {
        alert('当前暂不支持安装，请稍后再试。');
        return;
      }
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      console.log('PWA 安装结果:', choice.outcome);
      this.deferredPrompt = null;
      this.canInstall = false;
    },

    // TODO: 按你现有 app.js 复制 onSearchLocal / onSearchGlobal / onConfirmLocal /
    // onConfirmGlobal / startLocateMe 内容……
  },
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
}



/* 导航链接样式 */
.nav-links {
  margin-bottom: 16px;

  a {
    font-weight: bold;
    color: #2c3e50;
    text-decoration: none;
    margin-right: 4px;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
