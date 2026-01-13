// server/server.js

// 引入 dotenv 来加载.env 文件中的环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // 引入数据库连接函数// <--- 1. 在这里导入我们创建的函数

// 连接到 MongoDB 2. 调用函数，执行数据库连接
connectDB();

const eventRoutes = require('./routes/eventRoutes');
const geocodeRouter = require('./routes/geocode');

const app = express();


app.use(cors()); 
// 中间件，用于解析传入请求的 JSON 负载
app.use(express.json()); 

app.use('/api/events', eventRoutes);
app.use('/api', geocodeRouter);


// 定义服务器端口。优先使用环境变量中定义的 PORT，如果没有则使用 5000
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('实时事件地图 API 服务器已启动！');
});

app.listen(PORT, () => {
  console.log(`服务器正在 http://localhost:${PORT} 上运行`);
});

