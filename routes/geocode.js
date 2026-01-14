// filepath: d:\server\routes\geocode.js
const express = require('express');
const fetch = require('node-fetch');  // v2

const router = express.Router();

// GET /api/geocode?q=珠海市香洲区xx路
router.get('/geocode', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: '缺少 q 参数' });
  }

  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    console.error('缺少 AMAP_KEY 环境变量');
    return res.status(500).json({ error: 'server no amap key' });
  }

  // 调用高德地理编码 API
  const url = `https://restapi.amap.com/v3/geocode/geo?key=${encodeURIComponent(
    amapKey
  )}&address=${encodeURIComponent(q)}&output=json`;

  try {
    const r = await fetch(url);
    if (!r.ok) {
      console.error('高德地理编码 HTTP 异常，状态码:', r.status);
      return res
        .status(r.status)
        .json({ error: 'amap 请求失败', status: r.status });
    }

    const data = await r.json();

    if (data.status !== '1' || !data.geocodes || data.geocodes.length === 0) {
      // 高德返回“没找到”或错误
      return res.json([]); // 保持和旧接口兼容：返回空数组
    }

    const first = data.geocodes[0];   // 取第一个匹配
    // 高德的 location 是 "lng,lat" 字符串
    const [lng, lat] = first.location.split(',').map(Number);

    // 为了前端兼容 Nominatim 格式，这里构造一个类似的对象
    const result = [
      {
        lon: lng,
        lat: lat,
        display_name: first.formatted_address || q,
      },
    ];

    res.json(result);
  } catch (e) {
    console.error('服务器端地理编码错误(高德):', e);
    res.status(500).json({ error: 'geocode failed' });
  }
});

module.exports = router;
