// Augment Code Auto Login - Background Script
console.log('Augment Code Auto Login Extension loaded');

// 配置信息
const CONFIG = {
  targetUrl: 'https://app.augmentcode.com/',
  email: '1810002@newmeng.cn',
  nativeAppName: 'com.augmentcode.emailverifier',
  alternativeNativeAppName: 'augmentcode.emailverifier'
};

// 监听标签页更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);

    // 检查自动登录是否启用
    const settings = await chrome.storage.local.get(['autoLogin']);
    if (settings.autoLogin === false) {
      console.log('Auto login is disabled');
      return;
    }

    // 定义目标域名
    const targetDomains = [
      'https://app.augmentcode.com',
      'https://login.augmentcode.com',
      'https://auth.augmentcode.com'
    ];

    // 定义排除的URL模式
    const excludePatterns = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'about:',
      'file://',
      'data:',
      'javascript:',
      'localhost',
      '127.0.0.1'
    ];

    const isOnTargetDomain = targetDomains.some(domain => tab.url.startsWith(domain));
    const shouldExclude = excludePatterns.some(pattern => tab.url.includes(pattern));

    if (!isOnTargetDomain && !shouldExclude) {
      console.log('Checking if redirect is needed for:', tab.url);

      // 发送消息到content script检查是否需要重定向
      try {
        await chrome.tabs.sendMessage(tabId, {
          action: 'checkRedirect',
          targetUrl: CONFIG.targetUrl
        });
      } catch (err) {
        console.log('Failed to send message to content script:', err);
        // 如果content script还没加载，直接重定向
        if (err.message && err.message.includes('Could not establish connection')) {
          console.log('Content script not ready, redirecting directly');
          chrome.tabs.update(tabId, { url: CONFIG.targetUrl });
        }
      }
    } else if (isOnTargetDomain) {
      console.log('Already on target domain, checking for auto-login opportunities');
    }
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'getConfig':
      sendResponse(CONFIG);
      break;
      
    case 'getVerificationCode':
      console.log('🔍 Background: Received getVerificationCode request');
      getVerificationCodeFromNative()
        .then(code => {
          console.log('✅ Background: Got verification code:', code);
          sendResponse({ success: true, code });
        })
        .catch(error => {
          console.error('❌ Background: Error getting verification code:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 保持消息通道开放
      
    case 'log':
      console.log('[Content Script]:', request.message);
      break;
      
    case 'redirectToTarget':
      if (sender.tab && sender.tab.id) {
        chrome.tabs.update(sender.tab.id, { url: CONFIG.targetUrl });
      } else {
        console.error('无效的tab信息');
      }
      break;

    case 'startAutoLogin':
      console.log('🚀 Background: Starting auto login process');
      if (sender.tab && sender.tab.id) {
        startAutoLoginProcess(sender.tab.id);
      } else {
        // 如果没有tab信息，获取当前活动tab
        console.log('从popup发起的请求，获取当前活动tab');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            console.log('找到活动tab，开始自动登录');
            startAutoLoginProcess(tabs[0].id);
          } else {
            console.error('无法找到活动tab');
            updatePopupStatus('error', '❌ 无法找到活动页面');
          }
        });
      }
      break;

    case 'loginComplete':
      console.log('🎉 Background: Login completed successfully');
      console.log('Login completion details:', request);
      updatePopupStatus('success', '🎉 已登录完成');

      // 记录登录完成信息
      chrome.storage.local.set({
        lastLoginTime: new Date().toISOString(),
        lastLoginUrl: request.url,
        loginStatus: 'completed'
      });

      console.log('🎉 自动登录任务已完成，到达订阅页面');
      break;

    default:
      console.log('Unknown action:', request.action);
  }
});

// 通过Native Messaging获取验证码
async function getVerificationCodeFromNative() {
  console.log('📡 Background: Starting Native Messaging request...');

  // 尝试主要的Native Host名称
  try {
    console.log('📡 Background: Trying primary native app:', CONFIG.nativeAppName);
    return await tryNativeMessage(CONFIG.nativeAppName, { action: 'getVerificationCode' });
  } catch (error) {
    console.log('❌ Background: Primary native app failed:', error.message);

    // 尝试备用的Native Host名称
    try {
      console.log('📡 Background: Trying alternative native app:', CONFIG.alternativeNativeAppName);
      return await tryNativeMessage(CONFIG.alternativeNativeAppName, { action: 'getVerificationCode' });
    } catch (altError) {
      console.error('❌ Background: Both native apps failed');
      throw new Error(`Native messaging failed: ${error.message}`);
    }
  }
}

// 尝试发送Native Message
function tryNativeMessage(appName, message) {
  return new Promise((resolve, reject) => {
    try {
      console.log('📤 Background: Sending message to:', appName);

      chrome.runtime.sendNativeMessage(
        appName,
        message,
        (response) => {
          console.log('📨 Background: Native host response:', response);

          if (chrome.runtime.lastError) {
            console.error('❌ Background: Native messaging error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response && response.success) {
            console.log('✅ Background: Native host returned code:', response.code);
            resolve(response.code);
          } else {
            console.error('❌ Background: Native host error:', response?.error);
            reject(new Error(response?.error || 'Failed to get verification code'));
          }
        }
      );
    } catch (error) {
      console.error('❌ Background: Exception calling native app:', error);
      reject(error);
    }
  });
}

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Augment Code Auto Login Extension installed');
  
  // 设置默认配置
  chrome.storage.local.set({
    autoLogin: true,
    email: CONFIG.email,
    lastLoginTime: null
  });
});

// 监听扩展启动
chrome.runtime.onStartup.addListener(() => {
  console.log('Augment Code Auto Login Extension started');
});

// 启动自动登录流程
async function startAutoLoginProcess(tabId) {
  try {
    // 发送状态更新到popup
    updatePopupStatus('working', '🔄 开始自动登录流程...');

    // 检查当前页面
    updatePopupStatus('working', '📍 检查当前页面...');
    const tab = await chrome.tabs.get(tabId);

    if (!tab.url.startsWith('https://app.augmentcode.com/') &&
        !tab.url.startsWith('https://login.augmentcode.com/') &&
        !tab.url.startsWith('https://auth.augmentcode.com/')) {
      updatePopupStatus('working', '🔄 重定向到登录页面...');
      chrome.tabs.update(tabId, { url: CONFIG.targetUrl });
      return;
    }

    // 测试Native Host连接
    updatePopupStatus('working', '🔗 连接邮箱服务...');

    try {
      await tryNativeMessage(CONFIG.nativeAppName, { action: 'ping' });
      updatePopupStatus('working', '✅ 邮箱服务连接成功');
    } catch (error) {
      updatePopupStatus('error', '❌ 邮箱服务连接失败: ' + error.message);
      return;
    }

    // 获取邮箱配置
    updatePopupStatus('working', '📧 获取邮箱配置...');

    const emailConfig = await getEmailConfig();
    console.log('获取到的邮箱配置:', emailConfig);

    if (!emailConfig || !emailConfig.email) {
      updatePopupStatus('error', '❌ 无法获取邮箱配置');
      console.error('邮箱配置无效:', emailConfig);
      return;
    }

    // 准备完整配置
    const fullConfig = {
      ...CONFIG,
      email: emailConfig.email,
      server: emailConfig.server,
      port: emailConfig.port
    };

    console.log('准备发送的完整配置:', fullConfig);

    // 注入content script并开始登录
    updatePopupStatus('working', '🚀 开始自动填写登录信息...');

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('注入content script失败:', chrome.runtime.lastError);
        updatePopupStatus('error', '❌ 注入脚本失败');
        return;
      }

      // 等待一下确保content script加载完成
      setTimeout(() => {
        // 发送开始登录的消息
        chrome.tabs.sendMessage(tabId, {
          action: 'startLogin',
          config: fullConfig
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('发送消息失败:', chrome.runtime.lastError);
            updatePopupStatus('error', '❌ 发送登录指令失败');
          } else {
            console.log('登录指令发送成功:', response);
          }
        });
      }, 500);
    });

  } catch (error) {
    console.error('Auto login process failed:', error);
    updatePopupStatus('error', '❌ 自动登录失败: ' + error.message);
  }
}

// 更新popup状态
function updatePopupStatus(type, message) {
  console.log(`Status Update [${type}]: ${message}`);

  // 尝试发送消息到popup
  chrome.runtime.sendMessage({
    action: 'updateStatus',
    type: type,
    message: message
  }).catch(() => {
    // popup可能已关闭，忽略错误
  });
}

// 获取邮箱配置
async function getEmailConfig() {
  try {
    // 首先尝试从本地存储获取
    const result = await chrome.storage.local.get(['emailConfig']);
    if (result.emailConfig && result.emailConfig.email) {
      console.log('从本地存储获取邮箱配置:', result.emailConfig.email);

      // 检查配置是否是最近更新的（5分钟内）
      if (result.emailConfig.generatedTime) {
        const configTime = new Date(result.emailConfig.generatedTime);
        const now = new Date();
        const timeDiff = now - configTime;

        // 如果配置是5分钟内更新的，直接使用本地配置
        if (timeDiff < 5 * 60 * 1000) {
          console.log('使用最近更新的本地邮箱配置');
          return result.emailConfig;
        }
      }

      return result.emailConfig;
    }

    // 如果本地存储没有，从Native Host获取
    console.log('从Native Host获取邮箱配置...');

    try {
      const response = await tryNativeMessage(CONFIG.nativeAppName, { action: 'getEmailConfig' });
      console.log('Native Host响应:', response);

      if (response && response.success && response.email) {
        const emailConfig = {
          email: response.email,                    // 生成的dddd.tools邮箱
          actualEmail: response.actualEmail,       // 实际接收邮件的邮箱
          server: response.server || 'unknown',
          port: response.port || 993,
          generatedTime: response.generatedTime
        };

        // 保存到本地存储
        chrome.storage.local.set({ emailConfig });
        console.log('生成邮箱配置获取成功:', emailConfig.email, '(实际:', emailConfig.actualEmail, ')');
        return emailConfig;
      } else {
        console.error('Native Host返回无效配置:', response);

        // 如果Native Host失败，使用默认配置
        console.log('使用默认邮箱配置');
        const randomNum = 100000 + Math.floor(Math.random() * 900000);
        const defaultConfig = {
          email: `${randomNum}@dddd.tools`,        // 生成默认的dddd.tools邮箱
          actualEmail: '158011@newmeng.cn',        // 实际接收邮件的邮箱
          server: 'imap.qiye.aliyun.com',
          port: 993
        };

        // 保存默认配置
        chrome.storage.local.set({ emailConfig: defaultConfig });
        return defaultConfig;
      }
    } catch (nativeError) {
      console.error('Native Host连接失败:', nativeError);

      // 使用默认配置
      console.log('Native Host连接失败，使用默认配置');
      const randomNum = 100000 + Math.floor(Math.random() * 900000);
      const defaultConfig = {
        email: `${randomNum}@dddd.tools`,        // 生成默认的dddd.tools邮箱
        actualEmail: '158011@newmeng.cn',        // 实际接收邮件的邮箱
        server: 'imap.qiye.aliyun.com',
        port: 993
      };

      chrome.storage.local.set({ emailConfig: defaultConfig });
      return defaultConfig;
    }
  } catch (error) {
    console.error('获取邮箱配置异常:', error);

    // 最后的备用配置
    return {
      email: '130120@newmeng.cn',
      server: 'imap.qiye.aliyun.com',
      port: 993
    };
  }
}
