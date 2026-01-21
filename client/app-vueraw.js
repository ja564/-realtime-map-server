// filepath: d:\server\client\app-vue.js
const { createApp, onMounted, ref } = Vue;

const mapTilerApiKey = '6kybY9Exzowy9u4AmHWC';
// const API_URL = 'http://localhost:5000/api/events';
const API_URL = 'https://realtime-map-server-1.onrender.com/api/events';

createApp({
  setup() {
    // 状态
    const addressLocal = ref('');
    const addressGlobal = ref('');
    const showCreateModal = ref(false);
    const newEventDesc = ref('');
    const showDetailModal = ref(false);
    const currentEvent = ref(null);

    const canInstall = ref(false);
    const deferredPrompt = ref(null);

    const map = ref(null);
    const events = ref([]);
    const clickedLngLat = ref(null);
    const myLocationMarker = ref(null);
    const myLocationWatchId = ref(null);

    // 带超时的 fetch
    async function fetchWithTimeout(url, options = {}, timeout = 20000) {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('请求超时')), timeout),
        ),
      ]);
    }

    // === 工具函数（从你原来的 app.js 复制/精简） ===// 从后端获取并渲染事件（Vue 版）
    async function fetchEvents() {
    //   const res = await fetch(API_URL);
    //   if (!res.ok) throw new Error('获取事件失败');
    //   const json = await res.json();
    //   events.value = json.data || json; // 看你后端返回结构
    //   // 画点
    //   events.value.forEach(addMarkerToMap);
      try {
        const response = await fetchWithTimeout(API_URL);
        if (!response.ok) {
          throw new Error('获取事件失败');
        }
        const { data: eventsData } = await response.json();
        console.log('获取到的事件:', eventsData);

        // 保存到 ref
        events.value = eventsData || [];

        // 把事件画到地图上
        events.value.forEach(ev => addMarkerToMap(ev));
      } catch (error) {
        console.error('获取事件错误:', error);
        alert('服务器在唤醒，2分钟后再试。规范骑行消息你可以先在群聊中分享。');
      }
    }






    function addMarkerToMap(event) {
      const el = document.createElement('div');
      el.className = 'event-marker';

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openEventDetailModal(event);
      });

      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<h3>事件详情</h3><p>${event.description}</p>`);

      new maplibregl.Marker(el)
        .setLngLat(event.location.coordinates)
        .setPopup(popup)
        .addTo(map.value);
    }

    function openEventDetailModal(event) {
      currentEvent.value = event;
      showDetailModal.value = true;
    }

    function tryOpenCreateEventAt(lng, lat) {
      // 找最近事件
      let nearestEvent = null;
      let nearestDist = Infinity;
      events.value.forEach((ev) => {
        const [evLng, evLat] = ev.location.coordinates;
        const dx = evLng - lng;
        const dy = evLat - lat;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.0003 && dist < nearestDist) {
          nearestDist = dist;
          nearestEvent = ev;
        }
      });

      if (nearestEvent) {
        openEventDetailModal(nearestEvent);
        return;
      }

      clickedLngLat.value = { lng, lat };
      newEventDesc.value = '';
      showCreateModal.value = true;
    }

    async function createEventAt(lng, lat, description) {
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
        const text = await res.text();
        console.error('创建事件失败:', text);
        alert('创建事件失败');
        return;
      }
      const { data: newEvent } = await res.json();
      events.value.push(newEvent);
      addMarkerToMap(newEvent);
    }

    // === 事件处理 ===
    const onSearchLocal = async () => {
      // 这里调用你原来 geocodeAddress(addressLocal.value) 的逻辑
      // 成功后：居中地图 + 只移动视图，不立刻创建事件
      if (!addressLocal.value.trim()) {
        alert('请输入地址');
        return;
      }
      const geo = await geocodeAddress(addressLocal.value); // 从旧 app.js 搬过来
      if (!geo) return;
      map.value.flyTo({ center: [geo.lng, geo.lat], zoom: 16 });
    };

    const onConfirmLocal = async () => {
      if (!addressLocal.value.trim()) {
        alert('请输入地址');
        return;
      }
      const geo = await geocodeAddress(addressLocal.value);
      if (!geo) return;
      await createEventAt(geo.lng, geo.lat, '请规范骑行');
      alert('已在该位置添加“请规范骑行”的事件');
    };

    const onSearchGlobal = async () => {
      if (!addressGlobal.value.trim()) {
        alert('请输入地址');
        return;
      }
      const geo = await geocodeAddress(addressGlobal.value);
      if (!geo) return;
      map.value.flyTo({ center: [geo.lng, geo.lat], zoom: 16 });
    };

    const onConfirmGlobal = async () => {
      if (!addressGlobal.value.trim()) {
        alert('请输入地址');
        return;
      }
      const geo = await geocodeAddress(addressGlobal.value);
      if (!geo) return;
      await createEventAt(geo.lng, geo.lat, '请规范骑行');
      alert('已在该位置添加“请规范骑行”的事件');
    };

    const onSubmitEvent = async () => {
      if (!clickedLngLat.value) return;
      const { lng, lat } = clickedLngLat.value;
      await createEventAt(lng, lat, newEventDesc.value);
      showCreateModal.value = false;
    };

    const onCancelCreate = () => {
      showCreateModal.value = false;
      clickedLngLat.value = null;
    };

    const onLocateMeClick = () => {
      if (!navigator.geolocation) {
        alert('当前浏览器不支持定位');
        return;
      }
      if (myLocationWatchId.value) {
        // 已经在定位，可按你原逻辑停止等
        return;
      }
      myLocationWatchId.value = navigator.geolocation.watchPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;

          if (!myLocationMarker.value) {
            const container = document.createElement('div');
            container.className = 'my-location-container';
            const dot = document.createElement('div');
            dot.className = 'my-location-marker';
            container.appendChild(dot);

            const btn = document.createElement('button');
            btn.className = 'my-location-add-btn';
            btn.textContent = '+';
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              // 先检查附近是否已有事件
              const hasEventNearby = events.value.some((ev) => {
                const [evLng, evLat] = ev.location.coordinates;
                const dx = Math.abs(evLng - lng);
                const dy = Math.abs(evLat - lat);
                return dx < 0.001 && dy < 0.001;
              });
              if (hasEventNearby) {
                alert('你当前位置附近已有标记事件，不重复添加。');
                return;
              }
              await createEventAt(lng, lat, '正在查车中');
              alert('已在你当前位置添加“正在查车中”的事件');
            });
            container.appendChild(btn);

            myLocationMarker.value = new maplibregl.Marker(container)
              .setLngLat([lng, lat])
              .addTo(map.value);
          } else {
            myLocationMarker.value.setLngLat([lng, lat]);
          }

          map.value.easeTo({ center: [lng, lat], zoom: 16 });
        },
        (err) => {
          console.error('定位失败:', err);
          alert('定位失败，请检查权限或 GPS 设置');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    };

    const onInstallClick = async () => {
      if (!deferredPrompt.value) return;
      deferredPrompt.value.prompt();
      const { outcome } = await deferredPrompt.value.userChoice;
      if (outcome === 'accepted') {
        console.log('用户接受安装');
      }
      deferredPrompt.value = null;
      canInstall.value = false;
    };

    // === Lifecycle ===
    onMounted(() => {
      // 初始化地图
      map.value = new maplibregl.Map({
        container: 'map',
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerApiKey}`,
        hash: true,
        center: [113.588914, 22.353487],
        zoom: 13,
      });
      map.value.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.value.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        tryOpenCreateEventAt(lng, lat);
      });

      fetchEvents().catch((e) => console.error(e));

      // PWA 安装提示
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt.value = e;
        canInstall.value = true;
      });
    });

    // TODO: 把 gcj02ToWgs84、geocodeAddress 等从原 app.js 搬进来（放在上面工具函数区域）

    return {
      addressLocal,
      addressGlobal,
      showCreateModal,
      newEventDesc,
      showDetailModal,
      currentEvent,
      canInstall,
      onSearchLocal,
      onConfirmLocal,
      onSearchGlobal,
      onConfirmGlobal,
      onSubmitEvent,
      onCancelCreate,
      onLocateMeClick,
      onInstallClick,
    };
  },
}).mount('#app');
