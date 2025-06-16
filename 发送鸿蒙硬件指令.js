// ==UserScript==
// @name         发送鸿蒙硬件指令
// @namespace    http://tampermonkey.net/
// @version      0.2
// @match        https://console.huaweicloud.com/iotdm/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function () {
  "use strict";

  let targetOptions = { service: "", command: "", value: "" };
  let lastCase = {
    Agriculture_Control_light: { value: "OFF" },
    Agriculture_Control_Motor: { value: "OFF" },
  };

  let counter = 0;      // 流程步数：0=service, 1=command, 2=value, 3=click, 4=待检测
  let sending = false;  // 是否在一个流程内
  let isSend = false;   // 标记当前数据是否需要发

  async function fetchTargetOptions() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: "http://localhost:3000/options",
        responseType: "json",
        onload(res) {
          if (res.status >= 200 && res.status < 300 && res.response) {
            targetOptions = res.response;
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

  function setSelectValue(rootItem, text) {
    if (!rootItem) return;
    const selectEl = rootItem.closest("ti-select");
    if (!selectEl) return;
    const selectId = selectEl.getAttribute("id");
    const dropdownBtn = selectEl.querySelector(
      `#${CSS.escape(selectId)}_dominator .ti3-select-dominator-dropdown-btn`
    );
    if (!dropdownBtn) return;
    dropdownBtn.click();
    setTimeout(() => {
      document.querySelectorAll(".ti3-overflow-padding").forEach((option) => {
        const txt = option.querySelector("span")?.textContent;
        if (txt && txt.includes(text)) {
          option.click();
        }
      });
    }, 100);
  }

  function getSelectOptText(selectElement) {
    return (
      selectElement?.querySelector(".ti3-overflow-padding>span")?.textContent ||
      ""
    );
  }

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

  // 主循环
  async function runLoop() {
    let serviceRoots = document.querySelectorAll(
      "#Select\\.Device\\.RegisterDevice_resourceName_dominator_input"
    );
    let valueRoot =
      document.getElementById("light_dominator_input") ||
      document.getElementById("motor_dominator_input");

    // ===== 0. 检查是否需要进入新一轮流程 =====
    if (!sending && counter === 0) {
      // 检查数据是否需要发送
      try {
        await fetchTargetOptions();
      } catch (err) {
        console.error("fetchTargetOptions 错误：", err);
        return;
      }
      // 判断需不需要触发新流程
      const cmd = targetOptions.command;
      if (
        !cmd ||
        !lastCase[cmd] ||
        lastCase[cmd].value == targetOptions.value
      ) {
        // 不需要发，等待下一次检测
        return;
      }
      // 有新数据需要发
      sending = true;
      isSend = true;
      counter = 0; // 开始新流程
      // 更新已发记录
      lastCase[cmd].value = targetOptions.value;
      console.log("检测到数据变更，准备执行新一轮指令流程！");
    }

    // ===== 1. 正在执行流程 0-1-2-3 步 =====
    if (sending && isSend) {
      if (!serviceRoots.length || !valueRoot) {
        // UI 还没加载好，等待
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
        case 3:
          document?.getElementById("ti_auto_id_39")?.click();
          sending = false;   // 结束流程
          isSend = false;
          counter = 0;
          return; // 此轮结束，等待下一轮检测
      }
      counter++;
    }
  }

  window.addEventListener("load", () => {
    console.log("指令发送脚本加载成功！");
    if (!location.hash.includes("dm-portal/monitor/online-debugger")) {
      console.log("当前不是在线调试页，不执行脚本");
      return;
    }
    setInterval(runLoop, 300);
  });
})();
