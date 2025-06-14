// ==UserScript==
// @name         发送鸿蒙硬件指令
// @namespace    http://tampermonkey.net/
// @version      0.1
// @match       https://console.huaweicloud.com/iotdm/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function () {
  "use strict";

  // 可变的目标选项（初始也可保持任意结构，后端返回时覆盖）
  let targetOptions = { service: "", command: "", value: "" };


  let counter = 0;
  /**
   * 使用 GM_xmlhttpRequest 强化跨域 GET 请求
   * 假设后端提供 GET /options 返回 JSON 数组或对象
   */
  function fetchTargetOptions() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: "http://localhost:3000/options",
        responseType: "json",
        onload(res) {
          if (res.status >= 200 && res.status < 300 && res.response) {
            targetOptions = res.response;
            console.log("已获取 targetOptions:", targetOptions);
            resolve();
          } else {
            reject(new Error(`请求失败，状态 ${res.status}`));
          }
        },
        onerror(err) {
          reject(err);
        },
      });
    });
  }

  /**
   * 打开下拉并点击匹配项，完成后 resolve
   */
  function setSelectValue(rootItem, text) {
    if (!rootItem) return resolve();
    const selectEl = rootItem.closest("ti-select");
    if (!selectEl) return resolve();

    const selectId = selectEl.getAttribute("id");
    const dropdownBtn = selectEl.querySelector(
      `#${CSS.escape(selectId)}_dominator .ti3-select-dominator-dropdown-btn`
    );
    if (!dropdownBtn) return resolve();
    dropdownBtn.click();

    setTimeout(() => {
      document.querySelectorAll(".ti3-overflow-padding").forEach((option) => {
        if (text == "ON") {
          console.log(option);
        }
        const txt = option.querySelector("span")?.textContent;
        if (txt && txt.includes(text)) {
          console.log("点击:", txt);
          option.click();
        }
      });
    }, 100);
  }

  /**
   * 读取当前选中文本
   */
  function getSelectOptText(selectElement) {
    return (
      selectElement?.querySelector(".ti3-overflow-padding>span")?.textContent ||
      ""
    );
  }

  // 三项异步任务：服务、命令、值
  function modifyServiceTask(rootItem, item) {
    const current = getSelectOptText(rootItem);
    if (current !== item.service) {
      setSelectValue(rootItem, item.service);
    }
  }

  function modifyCommandTask(rootItem, item) {
    const current = getSelectOptText(rootItem);
    if (current !== item.command) {
      setSelectValue(rootItem, item.command);
    }
  }

  function modifyValueTask(rootItem, item) {
    const current = getSelectOptText(rootItem);
    if (current !== item.value) {
      setSelectValue(rootItem, item.value);
    }
  }

  // 主循环：拉取配置 → 串行执行三项任务 → 点击发送
  async function runLoop() {
    try {
      if (counter == 3) {
        document?.getElementById("ti_auto_id_39")?.click();
        await fetchTargetOptions();
        counter = 0;
      }
    } catch (err) {
      console.error("fetchTargetOptions 错误：", err);
      return;
    }

    let serviceRoots = document.querySelectorAll(
      "#Select\\.Device\\.RegisterDevice_resourceName_dominator_input"
    );
    let valueRoot =
      document.getElementById("light_dominator_input") ||
      document.getElementById("motor_dominator_input");

    if (!serviceRoots.length || !valueRoot) {
      return;
    }
    switch (counter) {
      case 0:
        modifyServiceTask(serviceRoots[0], targetOptions);
        break;
      case 1:
        modifyCommandTask(serviceRoots[1], targetOptions);
        break;
      case 2:
        modifyValueTask(valueRoot, targetOptions);
        break;
    }
    counter++;
  }

  window.addEventListener("load", () => {
        if (!location.hash.includes("dm-portal/monitor/online-debugger")) {
    console.log("当前不是在线调试页，不执行脚本");
    return;
  }
    setInterval(runLoop, 200);
  });
})();
