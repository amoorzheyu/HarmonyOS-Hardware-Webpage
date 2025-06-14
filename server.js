// server.js

// 使用 ES Module 语法引入依赖
import express from "express";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";


const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// 静态资源访问支持（如有其他前端文件）
app.use(express.static(__dirname));

// 访问根路径时返回 index.htm
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.htm"));
});


// 内存中保存的目标对象
let targetOptions = {
  0: {
    service: "sdas",
    command: "Agriculture_Control_Motor",
    value: "OFF",
  },
  1: {
    service: "sdas",
    command: "Agriculture_Control_light",
    value: "OFF",
  },
};

let uploadDigitalData = {
  "temperature":{ //温度数据
    "value": 32,
    "unit": "℃"
  },
  "humidity":{
    "value": 50,
    "unit": "%"
  },
  "luminance":{
    "value": 500,
    "unit": "Lux"
  }
}

let nowIndex = 1;

// 启用跨域请求
app.use(cors());

// 解析 JSON 格式的请求体
app.use(express.json());

/**
 * GET /options
 * 返回当前的 targetOptions 对象
 */
app.get("/options", (req, res) => {
  if (nowIndex == 1) {
    nowIndex = 0;
  } else {
    nowIndex = 1;
  }
  targetOptions[nowIndex].index = nowIndex; 
  res.json(targetOptions[nowIndex]);
});

/**
 * POST /options
 * 接收新的 targetOptions 并更新内存中的值
 * 请求体示例：{ service: "...", command: "...", value: "..." }
 */
app.post("/options", (req, res) => {
  targetOptions = req.body;
  console.log(req.body);
  res.json({
    message: "更新成功",
    data: targetOptions,
  });
});

// 获取uploadDigitalData
app.get("/getDigitalData", (req, res) => {
  res.json(uploadDigitalData);
});

//  上传数字数据
app.post("/uploadDigitalData", (req, res) => {
  uploadDigitalData = req.body;
  res.json({
    message: "上传成功",
    data: uploadDigitalData,
  });
});

// 启动服务器并监听指定端口
app.listen(PORT, () => {
  console.log(`服务器已启动，访问地址：http://localhost:${PORT}`);
});
