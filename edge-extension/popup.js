// Edge专用版本 - Augment Code 自动登录扩展
// 优化随机邮箱生成算法，确保每次都是真正随机的

document.addEventListener('DOMContentLoaded', async function() {
  // DOM元素
  const startLoginBtn = document.getElementById('startLoginBtn');
  const stopLoginBtn = document.getElementById('stopLoginBtn');
  const refreshEmailBtn = document.getElementById('refreshEmailBtn');
  const emailValueEl = document.getElementById('emailValue');
  const logContentEl = document.getElementById('logContent');
  const extensionStatusEl = document.getElementById('extensionStatus');
  const nativeHostStatusEl = document.getElementById('nativeHostStatus');

  // 状态变量
  let isLoginInProgress = false;
  let currentEmail = '';

  // 初始化
  await initializeExtension();

  // 事件监听器
  startLoginBtn.addEventListener('click', startAutoLogin);
  stopLoginBtn.addEventListener('click', stopAutoLogin);
  refreshEmailBtn.addEventListener('click', refreshEmailConfig);

  // 初始化扩展
  async function initializeExtension() {
    addLog('🚀 Edge专用扩展初始化中...');
    
    // 检查Native Host连接
    await checkNativeHostConnection();
    
    // 生成初始随机邮箱
    await generateNewRandomEmail();
    
    // 初始化完成
    addLog('✅ Edge扩展初始化完成');
  }

  // Edge专用增强随机邮箱生成算法
  function generateRandomEmail() {
    // 使用多重随机源确保真正的随机性
    const timestamp = Date.now();
    const random1 = Math.floor(Math.random() * 900000) + 100000;
    const random2 = Math.floor(Math.random() * 1000);
    const random3 = Math.floor(Math.random() * 100);
    const edgeEntropy = Math.floor(Math.random() * 999); // Edge专用熵值

    // 结合时间戳和多个随机数
    const combined = (timestamp % 1000000) + random1 + random2 + random3 + edgeEntropy;
    const finalNumber = (combined % 900000) + 100000;

    // 确保是6位数字
    const emailNumber = String(finalNumber).padStart(6, '0').slice(-6);

    return `${emailNumber}@dddd.tools`;
  }

  // 生成新的随机邮箱（Edge优化版）
  async function generateNewRandomEmail() {
    addLog('🔄 Edge增强算法生成随机邮箱...');
    
    try {
      // 生成新的随机邮箱
      const newEmail = generateRandomEmail();
      
      // 确保与之前的邮箱不同
      let attempts = 0;
      let uniqueEmail = newEmail;
      while (uniqueEmail === currentEmail && attempts < 10) {
        uniqueEmail = generateRandomEmail();
        attempts++;
      }
      
      currentEmail = uniqueEmail;
      
      // 更新显示
      emailValueEl.textContent = currentEmail;
      addLog(`✅ 新邮箱已生成: ${currentEmail}`);
      
      // 保存到存储
      await chrome.storage.local.set({ 
        currentEmail: currentEmail,
        lastGenerated: Date.now(),
        browser: 'edge'
      });
      
      return currentEmail;
    } catch (error) {
      addLog(`❌ 邮箱生成失败: ${error.message}`);
      throw error;
    }
  }

  // 刷新邮箱配置
  async function refreshEmailConfig() {
    addLog('🔄 正在刷新邮箱配置...');
    refreshEmailBtn.classList.add('loading');

    try {
      // 生成新的随机邮箱
      await generateNewRandomEmail();
      
      addLog('✅ 邮箱配置已刷新');
    } catch (error) {
      addLog(`❌ 刷新失败: ${error.message}`);
    } finally {
      refreshEmailBtn.classList.remove('loading');
    }
  }

  // 检查Native Host连接
  async function checkNativeHostConnection() {
    try {
      addLog('🔍 检查Native Host连接...');
      
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('连接超时'));
        }, 5000);

        chrome.runtime.sendNativeMessage(
          'com.augmentcode.email_verifier',
          { action: 'ping', browser: 'edge' },
          (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response && response.status === 'ok') {
        nativeHostStatusEl.textContent = '✅ 已连接';
        nativeHostStatusEl.className = 'status-value status-ready';
        addLog('✅ Native Host连接正常');
      } else {
        throw new Error('响应无效');
      }
    } catch (error) {
      nativeHostStatusEl.textContent = '❌ 连接失败';
      nativeHostStatusEl.className = 'status-value status-error';
      addLog(`❌ Native Host连接失败: ${error.message}`);
    }
  }

  // 开始自动登录
  async function startAutoLogin() {
    if (isLoginInProgress) {
      addLog('⚠️ 登录已在进行中');
      return;
    }

    isLoginInProgress = true;
    startLoginBtn.disabled = true;
    stopLoginBtn.disabled = false;

    addLog('🚀 开始Edge自动登录流程...');

    try {
      // 检查当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('app.augmentcode.com')) {
        addLog('⚠️ 请先访问 https://app.augmentcode.com/');
        return;
      }

      // 确保有最新的随机邮箱
      if (!currentEmail) {
        await generateNewRandomEmail();
      }

      // 发送登录指令到content script
      await chrome.tabs.sendMessage(tab.id, {
        action: 'startLogin',
        email: currentEmail,
        browser: 'edge',
        config: {
          enhanced: true,
          randomAlgorithm: 'edge-optimized'
        }
      });

      addLog(`📧 使用邮箱: ${currentEmail}`);
      addLog('⏳ 等待登录完成...');

    } catch (error) {
      addLog(`❌ 登录启动失败: ${error.message}`);
      stopAutoLogin();
    }
  }

  // 停止自动登录
  function stopAutoLogin() {
    isLoginInProgress = false;
    startLoginBtn.disabled = false;
    stopLoginBtn.disabled = true;
    
    addLog('⏹️ 自动登录已停止');
  }

  // 添加日志
  function addLog(message) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `<span class="log-time">[${timeStr}]</span>${message}`;
    
    logContentEl.appendChild(logEntry);
    logContentEl.scrollTop = logContentEl.scrollHeight;

    // 限制日志条数
    const entries = logContentEl.querySelectorAll('.log-entry');
    if (entries.length > 50) {
      entries[0].remove();
    }
  }

  // 监听来自content script的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'loginProgress') {
      addLog(message.message);
    } else if (message.action === 'loginComplete') {
      addLog('🎉 登录完成！');
      stopAutoLogin();
    } else if (message.action === 'loginError') {
      addLog(`❌ 登录错误: ${message.error}`);
      stopAutoLogin();
    } else if (message.action === 'needNewEmail') {
      // Edge专用：动态生成新邮箱
      generateNewRandomEmail().then(() => {
        sendResponse({ email: currentEmail });
      });
      return true; // 保持消息通道开放
    }
  });

  // 监听标签页更新
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('app.augmentcode.com/account/subscription')) {
      addLog('🎯 检测到登录完成页面');
      if (isLoginInProgress) {
        addLog('✅ 自动登录成功完成！');
        stopAutoLogin();
      }
    }
  });

  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    if (isLoginInProgress) {
      stopAutoLogin();
    }
  });
});
