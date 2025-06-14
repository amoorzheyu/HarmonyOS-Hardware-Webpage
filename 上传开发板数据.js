// ==UserScript==
// @name         上传开发板数据（仅设备详情页）
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  每秒上传温湿度亮度，只在设备详情页生效
// @match        https://console.huaweicloud.com/iotdm/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function () {
  'use strict';

  function getValueByLabel(label) {
    const cards = document.querySelectorAll(".card_style");
    for (const card of cards) {
      const name = card.querySelector(".properties")?.textContent?.trim();
      const value = card.querySelector(".value")?.textContent?.trim();
      if (name?.toLowerCase() === label.toLowerCase()) {
        return parseFloat(value?.replace(/"/g, "")) || 0;
      }
    }
    return null;
  }

  function upload() {
    const uploadDigitalData = {
      temperature: { value: getValueByLabel("Temperature"), unit: "℃" },
      humidity: { value: getValueByLabel("Humidity"), unit: "%" },
      luminance: { value: getValueByLabel("Luminance"), unit: "Lux" },
    };

    GM_xmlhttpRequest({
      method: "POST",
      url: "http://localhost:3000/uploadDigitalData",
      data: JSON.stringify(uploadDigitalData),
      headers: { "Content-Type": "application/json" },
      onload: () => console.log("✅ 上传成功:", uploadDigitalData),
      onerror: err => console.error("❌ 上传失败:", err),
    });
  }

  window.addEventListener("load", () => {
    // ✅ 页面加载后延迟判断 hash，确保 SPA 渲染完成
    setTimeout(() => {
      if (!location.hash.includes("/device/all-device/device-detail/")) {
        console.log("⛔ 当前不是设备详情页，不启动上传");
        return;
      }

      // ✅ 启动定时上传任务
      console.log("✅ 检测到设备详情页，启动上传任务");
      setInterval(upload, 1000);
    }, 1000); // 延迟1秒判断 hash 与 DOM 是否就绪
  });
})();
