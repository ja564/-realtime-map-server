// client/app.js

const mapTilerApiKey = '6kybY9Exzowy9u4AmHWC'; // 请替换成你自己的 MapTiler API Key
// 后端服务器的地址，我们把它定义成一个常量，方便管理
// const API_URL = 'http://localhost:5000/api/events';
const API_URL = 'https://realtime-map-server-btex.onrender.com/api/events';
const map = new maplibregl.Map({
    container: 'map', // 地图容器的 ID,"去把自己画进去"
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerApiKey}`, 
    hash: true,
    center: [113.588914, 22.353487], // 初始中心点 [经度, 纬度] (以深圳为例)
    zoom: 13 // 初始缩放级别
});

// 添加地图缩放和旋转控件
map.addControl(new maplibregl.NavigationControl(), 'top-right');
// map.repaint=true;
// ---- DOM 元素获取 ----
const modal = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');
const cancelBtn = document.getElementById('cancel-btn');
const descriptionInput = document.getElementById('event-description');

// 新增：地址搜索相关 DOM
const addressInput = document.getElementById('address-input');
const searchBtn = document.getElementById('search-btn');
const confirmSearchBtn = document.getElementById('confirm-search-btn');


// 新增：不带前缀的全局地址搜索 DOM
const addressInputGlobal = document.getElementById('address-input-global');
const searchBtnGlobal = document.getElementById('search-btn-global');
const confirmSearchBtnGlobal = document.getElementById('confirm-search-btn-global');


let clickedLngLat = null; // 用于存储点击的坐标


// 新增：搜索得到的坐标和临时标记
let searchedLngLat = null;
let searchMarker = null;

// 假设你有一个 events 数组保存当前加载的事件
let events = [];   // 如果原来已经有，就不要重复声明
// 我的定位相关
let myLocationMarker = null;   // 地图上的“我的位置”标记
let myLocationWatchId = null;  // watchPosition 的 ID，方便后面停止监听
// 已有：准备创建事件时的经纬度
let selectedLngLat = null;
// ---------------------- 函数定义 ----------------------

//在 fetchAndRenderEvents 外面包一层超时逻辑，例如 20 秒超时后提示“服务器正在唤醒，请稍后重试”。
async function fetchWithTimeout(url, options = {}, timeout = 20000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('请求超时')), timeout)
        ),
    ]);
}

// 从后端获取并渲染事件的函数
async function fetchAndRenderEvents() {
    try {
        const response = await fetchWithTimeout(API_URL);
        if (!response.ok) {
            throw new Error('获取事件失败');
        }
        const { data: eventsData } = await response.json();
        console.log('获取到的事件:', eventsData);
        events = eventsData;   // 保存所有事件，用于“附近是否已有事件”的判断

        // 清理旧标记的话，可以额外维护一个 markers 数组，这里先简单只添加
        events.forEach(ev => addMarkerToMap(ev));
    } catch (error) {
        console.error('获取事件错误:', error);
        alert('服务器在唤醒，2分钟后再试。规范骑行消息你可以先在群聊中分享。');
    }
}

// ------- 坐标系转换：GCJ‑02 -> WGS‑84（高德 -> GPS/MapTiler） -------

const PI = 3.1415926535897932384626;
const A = 6378245.0;              // 地球长半轴
const EE = 0.006693421622965943;  // 偏心率平方

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
    // 高德(GCJ‑02) -> WGS‑84
    if (outOfChina(lng, lat)) {
        return { lng, lat }; // 国外不做偏移
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
        lat: lat - mgLat + lat
    };
}


// 使用后端（高德代理）将地址地理编码为经纬度
async function geocodeAddress(address) {
    // API_URL = '.../api/events'
    const apiBase = API_URL.replace('/events', ''); // 得到 .../api
    const url = `${apiBase}/geocode?q=${encodeURIComponent(address)}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error('地理编码请求失败，状态码: ' + res.status);
        }

        const data = await res.json();
        if (!data.length) {
            return null; // 真没找到
        }

        const first = data[0];
         // 后端通过高德拿到的是 GCJ‑02，经纬度字段是 first.lon / first.lat
        const gcjLng = parseFloat(first.lon);
        const gcjLat = parseFloat(first.lat);

        // 转成 WGS‑84，再给地图和事件使用
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

// // 打开/关闭“新事件”弹窗（如果你已经有，就不要重复定义）
// function openEventModal() {
//     document.getElementById('event-modal').classList.remove('hide');
// }
// function closeEventModal() {
//     document.getElementById('event-modal').classList.add('hide');
// }

// 开启 GPS 定位，并在地图上显示当前所在位置
function startLocateMe() {
    if (!navigator.geolocation) {
        alert('当前浏览器不支持定位功能');
        return;
    }

    // 如果之前已经在监听了，先关闭，避免重复
    if (myLocationWatchId !== null) {
        navigator.geolocation.clearWatch(myLocationWatchId);
        myLocationWatchId = null;
    }

    // 开始持续监听位置变化
    myLocationWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            // 注意：浏览器 geolocation 返回的就是 WGS‑84 坐标，和 MapTiler 一致
            const lng = pos.coords.longitude;
            const lat = pos.coords.latitude;

            console.log('GPS 定位:', lng, lat);

            // 第一次定位时或 marker 不存在时创建标记
            if (!myLocationMarker) {
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
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 不触发地图点击
                    tryOpenCreateEventAt(lng, lat);
                });
                container.appendChild(btn);

                // const el = document.createElement('div');
                // el.className = 'my-location-marker'; // 你可以在 CSS 里定义成蓝色小圆点

                const popup = new maplibregl.Popup({ offset: 15 }).setHTML(
                    '<p>你当前的大致位置</p>'
                );

                myLocationMarker = new maplibregl.Marker({
                    element: container,
                    anchor: 'center',   
                })
                    .setLngLat([lng, lat])
                    .setPopup(popup)
                    .addTo(map);

                // 地图飞到当前位置
                map.flyTo({ center: [lng, lat], zoom: 16 });
            } else {
                // 已经有标记了，只更新位置
                myLocationMarker.setLngLat([lng, lat]);
            }
            // 2) 把当前位置当作“选中坐标”，复用事件创建逻辑
            selectedLngLat = { lng, lat };  // 关键：相当于在地图上点了这个位置

            // 3) 打开“在此处标记新事件”弹窗
            openEventModal();
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
}


// 将单个事件作为标记添加到地图上的函数
function addMarkerToMap(event) {
    const el = document.createElement('div');
    el.className = 'event-marker';

    // 点击已有事件：这里只做查看，不弹新增输入框
    el.addEventListener('click', (e) => {
        e.stopPropagation();        // 防止触发 map 的 click
        openEventDetailModal(event);
    });

    const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<h3>事件详情</h3><p>${event.description}</p>`);

    new maplibregl.Marker(el)
        .setLngLat(event.location.coordinates)
        .setPopup(popup)
        .addTo(map);

    
}

function tryOpenCreateEventAt(lng, lat) {
    const hasEventNearby = events.some(ev => {
        const [evLng, evLat] = ev.location.coordinates;
        const dx = Math.abs(evLng - lng);
        const dy = Math.abs(evLat - lat);
        return dx < 0.0003 && dy < 0.0003;
    });

    if (hasEventNearby) {
        alert('附近已有标记事件，此处不再新增。');
        return;
    }

    // 记录坐标并显示新增事件的模态框
    clickedLngLat = { lng, lat };
    modal.classList.remove('hide');
}


// 地图点击事件：只在附近没有事件时才弹新增输入框
map.on('click', (e) => {
    const { lng, lat } = e.lngLat;
    tryOpenCreateEventAt(lng, lat);
});

// 3. 在渲染事件点时，为已有事件的 marker/图层单独绑定点击逻辑，且阻止冒泡
// function renderEventsOnMap(events) {
//     events.forEach(ev => {
//         const markerEl = document.createElement('div');
//         markerEl.className = 'event-marker';

//         // 点击已有事件：这里只做“查看”，不弹新增输入
//         markerEl.addEventListener('click', (e) => {
//             e.stopPropagation(); // 阻止事件继续冒泡到 map.on('click')
//             openEventDetailModal(ev);
//         });

//         // 这里使用 MongoDB GeoJSON 的 coordinates
//         const [lng, lat] = ev.location.coordinates;

//         new maplibregl.Marker(markerEl)
//             .setLngLat([lng, lat])
//             .addTo(map);
//     });
// }

// 1. 加载事件时，把结果保存到 events
// async function loadEvents() {
//   const res = await fetch(`${API_BASE_URL}/api/events`);
//   const data = await res.json();
//   events = data;                   // <--- 关键：保存所有事件
//   renderEventsOnMap(events);
// }

// 你原来用来打开“新增事件”输入框的函数保持不变
function openCreateEventModal(coordinate) {
  // ...existing code...
  // 打开 #event-modal，设置当前点击坐标等
}

// 你可以添加一个事件详情弹窗函数（如果需要）
function openEventDetailModal(event) {
  // 简单实现：先用 alert，看确认逻辑没问题
  alert(`已有事件：\n${event.description}`);
  // 之后可以改成单独的“只读详情弹窗”
}

// ---------------------- 事件监听器 ----------------------

// 1. 监听地图加载完成事件
map.on('load', () => {
    console.log('地图已加载，开始获取事件...');
    fetchAndRenderEvents();
});

// 额外：给“定位到我”按钮绑定点击事件
const locateMeBtn = document.getElementById('locate-me-btn');
if (locateMeBtn) {
    locateMeBtn.addEventListener('click', () => {
        startLocateMe();
    });
}

// 2. 地址搜索按钮：根据输入地址定位地图
const ADDRESS_PREFIX = '珠海市香洲区';   // 你想固定在最前面的部分

searchBtn.addEventListener('click', async () => {
    let userInput = addressInput.value.trim();
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

    const result = await geocodeAddress(fullAddress);
    if (!result) {
        alert('没有找到对应的位置，请尝试输入更详细的地址。');
        return;
    }

    const { lng, lat, displayName } = result;
    searchedLngLat = { lng, lat };

    // 地图飞到目标位置
    map.flyTo({ center: [lng, lat], zoom: 16 });

    // 如果已经有旧的搜索标记，先移除
    if (searchMarker) {
        searchMarker.remove();
    }

    // 在该位置添加一个临时标记
    const el = document.createElement('div');
    el.className = 'event-marker';

    const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
            <h3>搜索结果</h3>
            <p>搜索地址：${fullAddress}</p>
            <p style="font-size:12px;color:#666;">${displayName}</p>
        `);

    searchMarker = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

    searchMarker.togglePopup();
});

// 2b. 全局地址搜索按钮：不加任何前缀，直接用用户输入
searchBtnGlobal.addEventListener('click', async () => {
    const addr = addressInputGlobal.value.trim();
    if (!addr) {
        alert('请输入要搜索的地址');
        return;
    }

    const result = await geocodeAddress(addr);  // 这里不加 ADDRESS_PREFIX
    if (!result) {
        alert('没有找到对应的位置，请尝试输入更详细的地址。');
        return;
    }

    const { lng, lat, displayName } = result;
    searchedLngLat = { lng, lat };   // 仍然复用同一个 searchedLngLat，方便确认按钮使用

    // 地图飞到目标位置
    map.flyTo({ center: [lng, lat], zoom: 16 });

    // 如果已经有旧的搜索标记，先移除
    if (searchMarker) {
        searchMarker.remove();
    }

    // 在该位置添加一个临时标记
    const el = document.createElement('div');
    el.className = 'event-marker';

    const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
            <h3>全局搜索结果</h3>
            <p>搜索地址：${addr}</p>
            <p style="font-size:12px;color:#666;">${displayName}</p>
        `);

    searchMarker = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

    searchMarker.togglePopup();
});

// 3. 确认按钮：在搜索到的位置创建一个默认“正在查车中”的事件
confirmSearchBtn.addEventListener('click', async () => {
    if (!searchedLngLat) {
        alert('请先输入地址并点击“搜索”。');
        return;
    }

    const defaultDesc = '正在查车中';

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: defaultDesc,
                location: {
                    type: 'Point',
                    coordinates: [searchedLngLat.lng, searchedLngLat.lat],
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('通过搜索创建事件失败:', errText);
            alert('创建事件失败');
            return;
        }

        const { data: newEvent } = await res.json();
        console.log('通过搜索创建的事件:', newEvent);

        events.push(newEvent);
        addMarkerToMap(newEvent);

        alert('已在该位置添加“正在查车中”的事件');

        // 保留 searchedLngLat（方便以后继续用），也可以选择清空：
        // searchedLngLat = null;
    } catch (err) {
        console.error('通过搜索创建事件错误:', err);
        alert('网络或服务器错误');
    }
});

// 3b. 全局确认按钮：在搜索到的位置创建一个默认“正在查车中”的事件
confirmSearchBtnGlobal.addEventListener('click', async () => {
    if (!searchedLngLat) {
        alert('请先输入地址并点击“搜索”。');
        return;
    }

    const defaultDesc = '正在查车中';

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: defaultDesc,
                location: {
                    type: 'Point',
                    coordinates: [searchedLngLat.lng, searchedLngLat.lat],
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('通过搜索创建事件失败:', errText);
            alert('创建事件失败');
            return;
        }

        const { data: newEvent } = await res.json();
        console.log('通过搜索创建的事件:', newEvent);

        events.push(newEvent);
        addMarkerToMap(newEvent);

        alert('已在该位置添加“正在查车中”的事件');

        // 保留 searchedLngLat（方便以后继续用），也可以选择清空：
        // searchedLngLat = null;
    } catch (err) {
        console.error('通过搜索创建事件错误:', err);
        alert('网络或服务器错误');
    }
});


// 提交表单：在点击地图选定坐标后，提交新事件
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 阻止表单默认刷新页面

    if (!clickedLngLat) {
        alert('请先在地图上点击选择位置');
        return;
    }

    const description = descriptionInput.value.trim();
    if (!description) {
        alert('请输入事件描述');
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description,
                // 按后端的 GeoJSON 要求发送 location
                location: {
                    type: 'Point',
                    coordinates: [clickedLngLat.lng, clickedLngLat.lat],
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('创建事件失败:', errText);
            alert('创建事件失败');
            return;
        }

        const { data: newEvent } = await res.json();
        console.log('创建成功的事件:', newEvent);

        // 把新事件加到本地数组，方便后续“附近已有事件”判断
        events.push(newEvent);

        // 在地图上添加新标记
        addMarkerToMap(newEvent);

        // 关闭弹窗并重置输入
        modal.classList.add('hide');
        descriptionInput.value = '';
        clickedLngLat = null;
    } catch (err) {
        console.error('提交事件错误:', err);
        alert('网络或服务器错误');
    }
});

// “取消”按钮：关闭弹窗
cancelBtn.addEventListener('click', () => {
    modal.classList.add('hide');
    descriptionInput.value = '';
    clickedLngLat = null;
});


// // 注册 Service Worker（PWA 必备）
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker
//             .register('/service-worker.js')
//             .then((reg) => {
//                 console.log('Service Worker 注册成功:', reg.scope);
//             })
//             .catch((err) => {
//                 console.error('Service Worker 注册失败:', err);
//             });
//     });
// }

// 只在 http(s) 环境下注册 Service Worker
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => {
        console.log('Service Worker 注册成功:', reg.scope);
      })
      .catch(err => {
        console.error('Service Worker 注册失败:', err);
      });
  });
} else {
  console.log('当前协议不支持 Service Worker:', window.location.protocol);
}

if (!('BeforeInstallPromptEvent' in window)) {
  // 非标准浏览器
  alert('当前浏览器可能不支持一键安装。\n你可以在浏览器菜单里选择“添加到桌面”来创建快捷方式。');
}

let deferredPrompt = null;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt 触发');
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.classList.remove('hide');
  }
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      alert('当前暂不支持安装，请稍后再试。');
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log('PWA 安装结果:', choice.outcome);
    deferredPrompt = null;
    installBtn.classList.add('hide');
  });
}