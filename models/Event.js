//数据库设置
const mongoose=require('mongoose')

const pointSchema=new mongoose.Schema({
    type:{
        type:String,
        enum:['Point'],
        require:true
    },
    coordinates:{
        type:[Number],
        require:true
    }
});

const eventSchema = new mongoose.Schema({
    description: {
      type: String,
      required: [true, '事件描述不能为空'],
      trim: true,
      minlength: [5, '描述信息至少需要5个字符']
    },
    location: {
      type: pointSchema,
      required: true,
      // 为地理空间查询创建 2dsphere 索引
      index: '2dsphere' 
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // 设置 TTL (Time-To-Live) 索引
      expires: 3600 // 文档将在创建后 3600 秒 (1小时) 后自动删除
    }
  });
  
  module.exports = mongoose.model('Event', eventSchema);