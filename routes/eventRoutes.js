// server/routes/eventRoutes.js
const express = require('express');
const { getAllEvents, createEvent } = require('../controllers/eventController');
const router = express.Router();//创建了一个“微型”的、可插拔的路由模块。

router.route('/')
 .get(getAllEvents)  //前台的核心工作：登记转接规则。传递的是函数名本身 
 .post(createEvent);

module.exports = router;