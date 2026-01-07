// client/app.js

const mapTilerApiKey = '6kybY9Exzowy9u4AmHWC'; // 请替换成你自己的 MapTiler API Key
// 后端服务器的地址，我们把它定义成一个常量，方便管理
const API_URL = 'http://localhost:5000/api/events';

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

let clickedLngLat = null; // 用于存储点击的坐标

// 假设你有一个 events 数组保存当前加载的事件
let events = [];   // 如果原来已经有，就不要重复声明

// ---------------------- 函数定义 ----------------------

// 从后端获取并渲染事件的函数
async function fetchAndRenderEvents() {
    try {
        const response = await fetch(API_URL);
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
    }
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

// 地图点击事件：只在附近没有事件时才弹新增输入框
map.on('click', (e) => {
    const { lng, lat } = e.lngLat;

    const hasEventNearby = events.some(ev => {
        const [evLng, evLat] = ev.location.coordinates;
        const dx = Math.abs(evLng - lng);
        const dy = Math.abs(evLat - lat);
        return dx < 0.0003 && dy < 0.0003;
    });

    if (hasEventNearby) {
        return; // 附近已有事件，不再弹输入框
    }

    // 记录点击坐标并显示新增事件的模态框
    clickedLngLat = { lng, lat };
    modal.classList.remove('hide');
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

// 2. 监听“取消”按钮，关闭对话框并重置状态
cancelBtn.addEventListener('click', () => {
    // 隐藏模态框
    modal.classList.add('hide');
    // 清空输入内容
    descriptionInput.value = '';
    // 清空当前点击坐标（可选）
    clickedLngLat = null;
});
