// app.js

// 初始化地图
const map = new maplibregl.Map({
    container: 'map', // 地图容器的ID
    style: 'https://demotiles.maplibre.org/style.json', // 地图样式
    center: [120.1551, 30.2741], // 初始中心坐标 [经度, 纬度]
    zoom: 12 // 初始缩放级别
});

// 添加地图控件
map.addControl(new maplibregl.NavigationControl());

// 事件标记功能
let marker;

map.on('click', (e) => {
    // 如果已有标记，先移除
    if (marker) {
        marker.remove();
    }

    // 创建新标记
    marker = new maplibregl.Marker()
        .setLngLat(e.lngLat)
        .addTo(map);

    // 显示模态框
    document.getElementById('event-modal').classList.remove('hide');
});

// 处理表单提交
document.getElementById('event-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const description = document.getElementById('event-description').value;

    // 在控制台输出事件描述
    console.log('事件描述:', description);

    // 清空输入框
    document.getElementById('event-description').value = '';

    // 移除标记
    if (marker) {
        marker.remove();
        marker = null;
    }

    // 隐藏模态框
    document.getElementById('event-modal').classList.add('hide');
});

// 处理取消按钮
document.getElementById('cancel-btn').addEventListener('click', () => {
    // 隐藏模态框
    document.getElementById('event-modal').classList.add('hide');

    // 移除标记
    if (marker) {
        marker.remove();
        marker = null;
    }
});