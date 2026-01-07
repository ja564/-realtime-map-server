// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose 6 及以上版本不再需要设置 useUnifiedTopology 等选项
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB 已连接: ${conn.connection.host}`);
  } catch (error) {
    console.error(`错误: ${error.message}`);
    process.exit(1); // 如果连接失败，则退出进程
  }
};

module.exports = connectDB;