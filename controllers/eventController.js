// // 存放处理请求的实际逻辑。
// // server/controllers/eventController.js
// const Event = require('../models/Event');

// // @desc    获取所有当前事件
// // @route   GET /api/events
// // @access  Public
// const getAllEvents = async (req, res) => {
//   try {
//     const events = await Event.find();
//     res.status(200).json({ success: true, data: events });
//   } catch (error) {
//     res.status(500).json({ success: false, error: '服务器错误' });
//   }
// };

// // @desc    创建一个新事件
// // @route   POST /api/events
// // @access  Public
// const createEvent = async (req, res) => {

//   console.log('--- 进入了 createEvent 函数 ---'); // <-- 日志1
//   console.log('收到的请求体 req.body:', req.body); // <-- 日志2

//   try {
//     const event = await Event.create(req.body);//?
//     res.status(201).json({ success: true, data: event });
//   } catch (error) {
//     // 处理 Mongoose 验证错误
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(val => val.message);
//       return res.status(400).json({ success: false, error: messages });
//     }
//     res.status(500).json({ success: false, error: '服务器错误' });
//   }
// };

// module.exports = {
//   getAllEvents,
//   createEvent
// };

// server/controllers/eventController.js
const Event = require('../models/Event');

// @desc    获取所有当前事件
// @route   GET /api/events
// @access  Public
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
};

// @desc    创建一个新事件
// @route   POST /api/events
// @access  Public
const createEvent = async (req, res) => {
  // 我们之前的调试日志，可以暂时保留或删除
  console.log('--- 进入了 createEvent 函数 ---');
  console.log('收到的请求体 req.body:', req.body);

  try {
    // --- 【修改点 1】 ---
    // 从 req.body 中只解构出我们明确需要的字段。
    // 这样可以忽略前端可能发送的任何其他无关或恶意的字段。
    const { description, location } = req.body;

    // --- 【修改点 2】(可选但推荐) ---
    // 在访问数据库之前，先进行一次快速的基础验证。
    if (!description || !location) {
      return res.status(400).json({ success: false, error: '请求体中缺少 description 或 location 字段' });
    }

    // --- 【修改点 3】 ---
    // 使用我们自己构建的、干净且安全的对象来创建事件，而不是直接用整个 req.body。
    const event = await Event.create({
      description,
      location,
    });

    res.status(201).json({ success: true, data: event });

  } catch (error) {
    console.error('捕获到错误:', error); // 建议在 catch 中也加上日志
    // 处理 Mongoose 验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }
    // 其他服务器内部错误
    res.status(500).json({ success: false, error: '服务器错误' });
  }
};

module.exports = {
  getAllEvents,
  createEvent,
};