const { createApp, ref, onMounted } = Vue;

const mapTilerApiKey = '6kybY9Exzowy9u4AmHWC';
// const API_URL = 'http://localhost:5000/api/events';
const API_URL = 'https://realtime-map-server-1.onrender.com/api/events';

createApp({
  setup() {
    // ---------- 状态（原来的全局变量） ----------
    const map = ref(null);

    const events = ref([]);          // 原 let events = []
    const clickedLngLat = ref(null); // 原 clickedLngLat
    const searchedLngLat = ref(null);
    const searchMarker = ref(null);

    const myLocationMarker = ref(null);
    const myLocationWatchId = ref(null);

    const selectedLngLat = ref(null);

    const addressLocal = ref('');    // 对应 addressInput.value
    const addressGlobal = ref('');   // 对应 addressInputGlobal.value

    const showCreateModal = ref(false);
    const newEventDesc = ref('');    // descriptionInput

    const showDetailModal = ref(false);
    const currentEvent = ref(null);

    // 安装 PWA 相关
    const canInstall = ref(false);
    const deferredPrompt = ref(null);

    // ---------- 工具函数：从原 app.js 复制过来 ----------
    // fetchWithTimeout
    async function fetchWithTimeout(url, options = {}, timeout = 20000) {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('请求超时')), timeout)
        ),
      ]);
    }

    // 坐标转换工具：PI, A, EE, outOfChina, transformLat, transformLng, gcj02ToWgs84
    const PI = 3.1415926535897932384626;
    const A = 6378245.0;
    const EE = 0.006693421622965943;

    function outOfChina(lng, lat) {
      return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
    }
    function transformLat(x, y) {
      let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y +
        0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) +
        20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(y * PI) +
        40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
      ret += (160.0 * Math.sin(y / 12.0 * PI) +
        320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
      return ret;
    }
    function transformLng(x, y) {
      let ret = 300.0 + x + 2.0 * y + 0.1 * x * x +
        0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) +
        20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(x * PI) +
        40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
      ret += (150.0 * Math.sin(x / 12.0 * PI) +
        300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
      return ret;
    }
    function gcj02ToWgs84(lng, lat) {
      if (outOfChina(lng, lat)) {
        return { lng, lat };
      }
      let dLat = transformLat(lng - 105.0, lat - 35.0);
      let dLng = transformLng(lng - 105.0, lat - 35.0);
      const radLat = lat / 180.0 * PI;
      let magic = Math.sin(radLat);
      magic = 1 - EE * magic * magic;
      const sqrtMagic = Math.sqrt(magic);
      dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
      dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
      const mgLat = lat + dLat;
      const mgLng = lng + dLng;
      return {
        lng: lng - mgLng + lng,
        lat: lat - mgLat + lat,
      };
    }

    // geocodeAddress：完全照你现在的实现
    async function geocodeAddress(address) {
      const apiBase = API_URL.replace('/events', '');
      const url = `${apiBase}/geocode?q=${encodeURIComponent(address)}`;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('地理编码请求失败，状态码: ' + res.status);
        }
        const data = await res.json();
        if (!data.length) return null;

        const first = data[0];
        const gcjLng = parseFloat(first.lon);
        const gcjLat = parseFloat(first.lat);
        const wgs = gcj02ToWgs84(gcjLng, gcjLat);
        return {
          lng: wgs.lng,
          lat: wgs.lat,
          displayName: first.display_name,
        };
      } catch (err) {
        console.error('地理编码错误:', err);
        alert('地理编码服务暂时不可用，请稍后再试，或自行在地图上定位。');
        return null;
      }
    }

    // ---------- 地图与事件 ----------
    async function fetchAndRenderEvents() {
      try {
        const response = await fetchWithTimeout(API_URL);
        if (!response.ok) throw new Error('获取事件失败');
        const { data: eventsData } = await response.json();
        console.log('获取到的事件:', eventsData);
        events.value = eventsData || [];
        events.value.forEach(addMarkerToMap);
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
      const hasEventNearby = events.value.some((ev) => {
        const [evLng, evLat] = ev.location.coordinates;
        const dx = Math.abs(evLng - lng);
        const dy = Math.abs(evLat - lat);
        return dx < 0.001 && dy < 0.001;
      });

      if (hasEventNearby) {
        // 只看详情 / 或直接 return
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
        const errText = await res.text();
        console.error('创建事件失败:', errText);
        alert('创建事件失败');
        return null;
      }
      const { data: newEvent } = await res.json();
      events.value.push(newEvent);
      addMarkerToMap(newEvent);
      return newEvent;
    }

    // ---------- 交互方法：替代原来的 addEventListener ----------
    const onSubmitEvent = async () => {
      if (!clickedLngLat.value) {
        alert('请先在地图上点击选择位置');
        return;
      }
      if (!newEventDesc.value.trim()) {
        alert('请输入事件描述');
        return;
      }
      const { lng, lat } = clickedLngLat.value;
      await createEventAt(lng, lat, newEventDesc.value.trim());
      showCreateModal.value = false;
      clickedLngLat.value = null;
      newEventDesc.value = '';
    };

    const onCancelCreate = () => {
      showCreateModal.value = false;
      clickedLngLat.value = null;
      newEventDesc.value = '';
    };

    const ADDRESS_PREFIX = '珠海市香洲区';

    const onSearchLocal = async () => {
      let userInput = addressLocal.value.trim();
      if (!userInput) {
        alert('请输入要搜索的地址');
        return;
      }
      let fullAddress = userInput.startsWith(ADDRESS_PREFIX)
        ? userInput
        : ADDRESS_PREFIX + userInput;

      const result = await geocodeAddress(fullAddress);
      if (!result) {
        alert('没有找到对应的位置，请尝试输入更详细的地址。');
        return;
      }
      const { lng, lat } = result;
      searchedLngLat.value = { lng, lat };
      map.value.flyTo({ center: [lng, lat], zoom: 16 });

      if (searchMarker.value) searchMarker.value.remove();
      const el = document.createElement('div');
      el.className = 'event-marker';
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<h3>搜索结果</h3><p>搜索地址：${fullAddress}</p>`);
      searchMarker.value = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.value);
      searchMarker.value.togglePopup();
    };

    const onSearchGlobal = async () => {
      const addr = addressGlobal.value.trim();
      if (!addr) {
        alert('请输入要搜索的地址');
        return;
      }
      const result = await geocodeAddress(addr);
      if (!result) {
        alert('没有找到对应的位置，请尝试输入更详细的地址。');
        return;
      }
      const { lng, lat } = result;
      searchedLngLat.value = { lng, lat };
      map.value.flyTo({ center: [lng, lat], zoom: 16 });

      if (searchMarker.value) searchMarker.value.remove();
      const el = document.createElement('div');
      el.className = 'event-marker';
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<h3>全局搜索结果</h3><p>搜索地址：${addr}</p>`);
      searchMarker.value = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.value);
      searchMarker.value.togglePopup();
    };

    const onConfirmLocal = async () => {
      if (!searchedLngLat.value) {
        alert('请先输入地址并点击“搜索”。');
        return;
      }
      const { lng, lat } = searchedLngLat.value;
      await createEventAt(lng, lat, '请规范骑行');
      alert('已在该位置添加“请规范骑行”的事件');
    };

    const onConfirmGlobal = async () => {
      if (!searchedLngLat.value) {
        alert('请先输入地址并点击“搜索”。');
        return;
      }
      const { lng, lat } = searchedLngLat.value;
      await createEventAt(lng, lat, '请规范骑行');
      alert('已在该位置添加“请规范骑行”的事件');
    };

    const onLocateMeClick = () => {
      if (!navigator.geolocation) {
        alert('当前浏览器不支持定位功能');
        return;
      }
      if (myLocationWatchId.value !== null) {
        navigator.geolocation.clearWatch(myLocationWatchId.value);
        myLocationWatchId.value = null;
      }
      myLocationWatchId.value = navigator.geolocation.watchPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          console.log('GPS 定位:', lng, lat);

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
              // 附近是否已有事件
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
              await createEventAt(lng, lat, '请规范骑行');
              alert('已在你当前位置添加“请规范骑行”的事件');
            });
            container.appendChild(btn);

            const popup = new maplibregl.Popup({ offset: 15 })
              .setHTML('<p>你当前的大致位置</p>');
            myLocationMarker.value = new maplibregl.Marker({
              element: container,
              anchor: 'center',
            })
              .setLngLat([lng, lat])
              .setPopup(popup)
              .addTo(map.value);

            map.value.flyTo({ center: [lng, lat], zoom: 16 });
          } else {
            myLocationMarker.value.setLngLat([lng, lat]);
          }
          selectedLngLat.value = { lng, lat };
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
      if (!deferredPrompt.value) {
        alert('当前暂不支持安装，请稍后再试。');
        return;
      }
      deferredPrompt.value.prompt();
      const choice = await deferredPrompt.value.userChoice;
      console.log('PWA 安装结果:', choice.outcome);
      deferredPrompt.value = null;
      canInstall.value = false;
    };

    // ---------- 生命周期 ----------
    onMounted(() => {
      map.value = new maplibregl.Map({
        container: 'map',
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerApiKey}`,
        hash: true,
        center: [113.588914, 22.353487],
        zoom: 13,
      });
      map.value.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.value.on('load', () => {
        console.log('地图已加载，开始获取事件...');
        fetchAndRenderEvents();
      });

      map.value.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        tryOpenCreateEventAt(lng, lat);
      });

      // Service Worker 注册逻辑可保持不变（或依然放在全局 script 里）
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
        deferredPrompt.value = e;
        canInstall.value = true;
      });
    });

    // ---------- 暴露给模板 ----------
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