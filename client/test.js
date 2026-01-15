// client/app.js

const mapTilerApiKey = '6kybY9Exzowy9u4AmHWC'; // 请替换成你自己的 MapTiler API Key
// 后端服务器的地址，我们把它定义成一个常量，方便管理
// const API_URL = 'http://localhost:5000/api/events';
// const API_URL = 'https://realtime-map-server-btex.onrender.com/api/events';
const API_URL = 'https://realtime-map-server-1.onrender.com/api/events';

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

btn.addEventListener('click', async(e) => {
    e.stopPropagation();
    
    // --- [新增 1] 开始前：保存原文，给按钮“上锁” ---
    const originalText = btn.innerText; // 先把“提交”这两个字存起来
    btn.disabled = true;                // 禁用按钮，变灰，防止再次点击
    btn.innerText = '提交中...';        // 提示用户正在处理
    // ---------------------------------------------

    // 我们把主要的逻辑包在一个大的 try...finally 里
    // 这样能保证不管发生什么，最后按钮都能恢复
    try {
        tryOpenCreateEventAt(lng, lat);

        // 1. 检查附近事件
        const hasEventNearby = events.some(ev => {
            const [evLng, evLat] = ev.location.coordinates;
            const dx = Math.abs(evLng - lng);
            const dy = Math.abs(evLat - lat);
            return dx < 0.001 && dy < 0.001;
        });            

        if (hasEventNearby) {
            alert('你当前位置附近已有标记事件，不重复添加。');
            return; // 即使在这里 return，下面的 finally 也会执行！不用担心按钮不恢复。
        }

        // 2. 发起请求
        const defaultDesc = '正在查车中';

        // 注意：这里不需要原来的 try...catch 了，因为外层已经有 try 了
        // 或者保留也没关系，只要错误能抛出来就行
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: defaultDesc,
                location: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText); // 主动抛出错误，跳到 catch
        }

        const { data: newEvent } = await res.json();
        console.log('通过定位创建的事件:', newEvent);

        events.push(newEvent);
        addMarkerToMap(newEvent);

        alert('已在你当前位置添加“正在查车中”的事件');

    } catch (err) {
        // --- [修改] 统一错误处理 ---
        console.error('创建事件流程出错:', err);
        alert('操作失败，请重试');
        
    } finally {
        // --- [新增 2] 结束后：无论成功还是失败，都“解锁”按钮 ---
        btn.disabled = false;           // 恢复按钮可点
        btn.innerText = originalText;   // 恢复原来的文字
        // ---------------------------------------------------
    }
})}