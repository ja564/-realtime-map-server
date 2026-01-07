# 实时事件地图项目

该项目是一个实时事件地图应用，使用MapLibre GL库来显示地图，并允许用户标记事件。

## 文件结构

```
realtime-map-project
├── client
│   ├── index.html       # 主HTML文件，包含页面结构和样式链接
│   ├── style.css        # 项目的样式定义
│   ├── app.js           # JavaScript逻辑文件，处理地图交互和事件标记
│   └── README.md        # 项目的文档，使用和运行说明
└── README.md            # 项目的根文档，概述、安装和使用说明
```

## 使用说明

1. **克隆项目**：
   ```bash
   git clone <项目的Git仓库地址>
   cd realtime-map-project/client
   ```

2. **打开HTML文件**：
   在浏览器中打开 `index.html` 文件以查看地图和事件标记功能。

3. **样式和功能**：
   - `style.css` 文件包含了页面的样式定义。
   - `app.js` 文件负责地图的交互和事件标记功能。

## 部署

可以将该项目部署到任何支持静态文件托管的免费服务器，例如GitHub Pages、Netlify或Vercel。只需将 `client` 文件夹中的所有文件上传到所选平台即可。

## 贡献

欢迎任何形式的贡献！请提交问题或拉取请求。