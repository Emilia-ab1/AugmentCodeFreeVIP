// Edge专用版本 - Background Service Worker
// 优化Native Messaging和邮箱管理

console.log('Edge专用 Augment Code 自动登录扩展 - Background启动');

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Edge扩展安装/更新:', details.reason);
  
  if (details.reason === 'install') {
    // 首次安装
    chrome.storage.local.set({
      browser: 'edge',
      version: '1.0.0',
      installTime: Date.now(),
      emailHistory: []
    });
    
    console.log('Edge扩展首次安装完成');
  }
});

// 监听来自popup和content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background收到消息:', message);
  
  switch (message.action) {
    case 'getVerificationCode':
      handleGetVerificationCode(message, sendResponse);
      return true; // 保持消息通道开放
      
    case 'generateRandomEmail':
      handleGenerateRandomEmail(sendResponse);
      return true;
      
    case 'saveEmailHistory':
      handleSaveEmailHistory(message.email);
      break;
      
    case 'checkNativeHost':
      handleCheckNativeHost(sendResponse);
      return true;
      
    default:
      console.log('未知消息类型:', message.action);
  }
});

// Edge专用增强随机邮箱生成
function generateEdgeOptimizedEmail() {
  // 使用Edge专用的随机算法
  const timestamp = Date.now();
  const random1 = Math.floor(Math.random() * 900000) + 100000;
  const random2 = Math.floor(Math.random() * 1000);
  const random3 = Math.floor(Math.random() * 100);
  const edgeEntropy = Math.floor(Math.random() * 999); // Edge专用熵值
  
  // 结合多个随机源
  const combined = (timestamp % 1000000) + random1 + random2 + random3 + edgeEntropy;
  const finalNumber = (combined % 900000) + 100000;
  
  // 确保是6位数字
  const emailNumber = String(finalNumber).padStart(6, '0').slice(-6);
  
  return `${emailNumber}@dddd.tools`;
}

// 处理随机邮箱生成请求
async function handleGenerateRandomEmail(sendResponse) {
  try {
    console.log('生成Edge优化随机邮箱...');
    
    // 获取历史邮箱记录
    const result = await chrome.storage.local.get(['emailHistory']);
    const emailHistory = result.emailHistory || [];
    
    // 生成新邮箱，确保不重复
    let newEmail;
    let attempts = 0;
    do {
      newEmail = generateEdgeOptimizedEmail();
      attempts++;
    } while (emailHistory.includes(newEmail) && attempts < 20);
    
    // 更新历史记录（保留最近50个）
    emailHistory.push(newEmail);
    if (emailHistory.length > 50) {
      emailHistory.shift();
    }
    
    await chrome.storage.local.set({ 
      emailHistory,
      lastGeneratedEmail: newEmail,
      lastGeneratedTime: Date.now()
    });
    
    console.log('Edge邮箱生成成功:', newEmail);
    sendResponse({ success: true, email: newEmail });
    
  } catch (error) {
    console.error('邮箱生成失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 处理验证码获取请求
async function handleGetVerificationCode(message, sendResponse) {
  try {
    console.log('请求验证码，邮箱:', message.email);
    
    // 发送到Native Host
    const nativeMessage = {
      action: 'getVerificationCode',
      email: message.email,
      browser: 'edge',
      timestamp: Date.now(),
      config: {
        enhanced: true,
        delay: 20000, // Edge专用延迟配置
        retries: 3
      }
    };
    
    chrome.runtime.sendNativeMessage(
      'com.augmentcode.email_verifier',
      nativeMessage,
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Native Host错误:', chrome.runtime.lastError);
          sendResponse({ 
            success: false, 
            error: chrome.runtime.lastError.message 
          });
        } else {
          console.log('验证码获取响应:', response);
          sendResponse(response);
        }
      }
    );
    
  } catch (error) {
    console.error('验证码获取失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 保存邮箱历史记录
async function handleSaveEmailHistory(email) {
  try {
    const result = await chrome.storage.local.get(['usedEmails']);
    const usedEmails = result.usedEmails || [];
    
    if (!usedEmails.includes(email)) {
      usedEmails.push(email);
      
      // 保留最近100个使用过的邮箱
      if (usedEmails.length > 100) {
        usedEmails.shift();
      }
      
      await chrome.storage.local.set({ usedEmails });
      console.log('邮箱历史已保存:', email);
    }
  } catch (error) {
    console.error('保存邮箱历史失败:', error);
  }
}

// 检查Native Host连接
async function handleCheckNativeHost(sendResponse) {
  try {
    console.log('检查Edge Native Host连接...');
    
    const testMessage = {
      action: 'ping',
      browser: 'edge',
      timestamp: Date.now()
    };
    
    chrome.runtime.sendNativeMessage(
      'com.augmentcode.email_verifier',
      testMessage,
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Native Host连接失败:', chrome.runtime.lastError);
          sendResponse({ 
            connected: false, 
            error: chrome.runtime.lastError.message 
          });
        } else {
          console.log('Native Host连接成功:', response);
          sendResponse({ 
            connected: true, 
            response: response 
          });
        }
      }
    );
    
  } catch (error) {
    console.error('Native Host检查失败:', error);
    sendResponse({ connected: false, error: error.message });
  }
}

// 监听标签页更新，检测登录完成
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('app.augmentcode.com/account/subscription')) {
    
    console.log('检测到登录完成页面');
    
    // 通知所有相关标签页
    chrome.tabs.sendMessage(tabId, {
      action: 'loginDetected',
      url: tab.url,
      browser: 'edge'
    }).catch(err => {
      console.log('发送登录检测消息失败:', err);
    });
  }
});

// 定期清理存储数据
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['emailHistory', 'usedEmails']);
    let needsUpdate = false;
    
    // 清理过期的邮箱历史（超过7天）
    if (result.emailHistory && result.emailHistory.length > 100) {
      result.emailHistory = result.emailHistory.slice(-50);
      needsUpdate = true;
    }
    
    if (result.usedEmails && result.usedEmails.length > 200) {
      result.usedEmails = result.usedEmails.slice(-100);
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await chrome.storage.local.set(result);
      console.log('存储数据已清理');
    }
  } catch (error) {
    console.error('清理存储数据失败:', error);
  }
}, 60 * 60 * 1000); // 每小时清理一次

// 扩展启动时的初始化
chrome.runtime.onStartup.addListener(() => {
  console.log('Edge扩展启动');
  
  // 设置Edge专用标识
  chrome.storage.local.set({
    browser: 'edge',
    startupTime: Date.now()
  });
});

console.log('Edge专用 Background Service Worker 初始化完成');
