document.addEventListener('DOMContentLoaded', function() {
  const statusEl = document.getElementById('status');
  const autoLoginToggle = document.getElementById('autoLoginToggle');
  const toggleSwitch = document.getElementById('toggleSwitch');
  const loginBtn = document.getElementById('loginBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const refreshEmailBtn = document.getElementById('refreshEmailBtn');
  const logsEl = document.getElementById('logs');
  const emailValueEl = document.getElementById('emailValue');

  // 初始化
  init();

  async function init() {
    // 加载设置
    const result = await chrome.storage.local.get(['autoLogin']);

    if (result.autoLogin !== undefined) {
      autoLoginToggle.checked = result.autoLogin;
    } else {
      // 默认启用自动登录
      autoLoginToggle.checked = true;
    }

    // 更新视觉开关状态
    if (autoLoginToggle.checked) {
      toggleSwitch.classList.add('active');
    } else {
      toggleSwitch.classList.remove('active');
    }

    // 从Go程序获取邮箱配置
    await loadEmailConfig();

    // 检查当前页面
    checkCurrentPage();

    // 初始化完成
    addLog('✅ 扩展初始化完成');
  }

  // 生成新的随机邮箱
  function generateRandomEmail() {
    const randomNum = 100000 + Math.floor(Math.random() * 900000);
    return `${randomNum}@dddd.tools`;
  }

  // 刷新邮箱配置
  async function refreshEmailConfig() {
    addLog('🔄 正在生成新的随机邮箱...');
    refreshEmailBtn.classList.add('loading');

    try {
      // 生成新的随机邮箱
      const newEmail = generateRandomEmail();

      // 更新显示
      emailValueEl.textContent = newEmail;
      addLog(`✅ 新邮箱已生成: ${newEmail}`);

      // 更新本地存储
      const result = await chrome.storage.local.get(['emailConfig']);
      const updatedConfig = {
        ...result.emailConfig,
        email: newEmail,
        generatedTime: new Date().toISOString()
      };

      await chrome.storage.local.set({ emailConfig: updatedConfig });
      addLog('💾 邮箱配置已更新到本地存储');

      // 通知后端更新配置
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendNativeMessage(
            'com.augmentcode.emailverifier',
            {
              action: 'updateEmailConfig',
              email: newEmail
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });

        if (response && response.success) {
          addLog('📡 后端配置已同步更新');
        } else {
          addLog('⚠️ 后端同步失败，但前端配置已更新');
        }
      } catch (nativeError) {
        addLog('⚠️ 无法连接后端，仅更新前端配置');
        console.warn('Native Host同步失败:', nativeError);
      }

    } catch (error) {
      addLog('❌ 邮箱刷新失败: ' + error.message);
      console.error('刷新邮箱失败:', error);
    } finally {
      refreshEmailBtn.classList.remove('loading');
    }
  }

  // 从后端获取邮箱配置
  async function loadEmailConfig() {
    try {
      addLog('📧 获取邮箱配置...');

      // 首先尝试从本地存储获取
      const result = await chrome.storage.local.get(['emailConfig']);
      if (result.emailConfig && result.emailConfig.email) {
        emailValueEl.textContent = result.emailConfig.email;
        addLog(`✅ 从缓存加载邮箱配置: ${result.emailConfig.email}`);
        return;
      }

      // 尝试从Native Host获取
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendNativeMessage(
            'com.augmentcode.emailverifier',
            { action: 'getEmailConfig' },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });

        if (response && response.success && response.email) {
          emailValueEl.textContent = response.email;
          addLog(`✅ 生成邮箱配置加载成功: ${response.email}`);
          

          // 保存到本地存储供其他地方使用
          chrome.storage.local.set({
            emailConfig: {
              email: response.email,
              actualEmail: response.actualEmail || response.email,
              server: response.server,
              port: response.port,
              generatedTime: response.generatedTime
            }
          });
        } else {
          throw new Error('Native Host返回无效配置');
        }
      } catch (nativeError) {
        addLog('❌ Native Host连接失败: ' + nativeError.message);

        // 使用默认配置
        const randomNum = 100000 + Math.floor(Math.random() * 900000);
        const defaultEmail = `${randomNum}@dddd.tools`;
        emailValueEl.textContent = defaultEmail;
        addLog(`⚠️ 使用默认生成邮箱: ${defaultEmail}`);

        // 保存默认配置
        chrome.storage.local.set({
          emailConfig: {
            email: defaultEmail,
            actualEmail: '158011@newmeng.cn',
            server: 'imap.qiye.aliyun.com',
            port: 993
          }
        });
      }
    } catch (error) {
      const randomNum = 100000 + Math.floor(Math.random() * 900000);
      const defaultEmail = `${randomNum}@dddd.tools`;
      emailValueEl.textContent = defaultEmail;
      addLog('❌ 配置加载失败，使用默认生成邮箱: ' + defaultEmail);
      // 保存默认配置
      chrome.storage.local.set({
        emailConfig: {
          email: defaultEmail,
          actualEmail: '158011@newmeng.cn',
          server: 'imap.qiye.aliyun.com',
          port: 993
        }
      });
    }
  }

  async function checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url.startsWith('https://app.augmentcode.com/') ||
          tab.url.startsWith('https://login.augmentcode.com/') ||
          tab.url.startsWith('https://auth.augmentcode.com/')) {
        setStatus('ready', '✅ 已在目标网站');
        addLog('当前在目标网站，可以开始登录');
      } else {
        setStatus('info', 'ℹ️ 请先访问登录页面');
        addLog('当前不在目标网站');
      }
    } catch (error) {
      console.error('检查页面失败:', error);
    }
  }

  function setStatus(type, message) {
    statusEl.className = `status ${type}`;
    statusEl.textContent = message;
  }

  function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${timestamp}] ${message}`;
    logsEl.appendChild(logEntry);
    logsEl.scrollTop = logsEl.scrollHeight;

    // 确保日志区域可见
    logsEl.style.display = 'block';

    console.log(`[Popup Log] ${message}`);
  }

  // 自动登录开关事件处理
  function updateToggleState() {
    const autoLoginEnabled = autoLoginToggle.checked;
    chrome.storage.local.set({ autoLogin: autoLoginEnabled });

    // 更新视觉开关状态
    if (autoLoginEnabled) {
      toggleSwitch.classList.add('active');
    } else {
      toggleSwitch.classList.remove('active');
    }

    addLog(autoLoginEnabled ? '自动登录已启用' : '自动登录已禁用');
  }

  // 监听checkbox变化
  autoLoginToggle.addEventListener('change', updateToggleState);

  // 监听视觉开关点击
  toggleSwitch.addEventListener('click', function() {
    console.log('Toggle switch clicked');
    autoLoginToggle.checked = !autoLoginToggle.checked;
    updateToggleState();
  });

  // 监听刷新邮箱按钮点击
  refreshEmailBtn.addEventListener('click', function() {
    console.log('Refresh email button clicked');
    refreshEmailConfig();
  });

  // 开始登录按钮
  loginBtn.addEventListener('click', async function() {
    console.log('登录按钮被点击');
    addLog('🖱️ 登录按钮被点击');
    setStatus('working', '🔄 正在登录...');
    addLog('开始自动登录流程');

    try {
      // 检查当前页面
      addLog('检查当前页面...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      addLog(`当前页面: ${tab.url}`);

      if (!tab.url.startsWith('https://app.augmentcode.com/') &&
          !tab.url.startsWith('https://login.augmentcode.com/') &&
          !tab.url.startsWith('https://auth.augmentcode.com/')) {
        // 重定向到目标网站
        addLog('重定向到目标网站');
        chrome.tabs.update(tab.id, { url: 'https://app.augmentcode.com/' });
        setStatus('working', '🔄 正在跳转到登录页面...');
        return;
      }

      // 开始自动登录流程
      addLog('🚀 启动自动登录...');
      console.log('发送startAutoLogin消息到background');

      chrome.runtime.sendMessage({ action: 'startAutoLogin' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('发送消息失败:', chrome.runtime.lastError);
          addLog('❌ 发送登录指令失败: ' + chrome.runtime.lastError.message);
          setStatus('error', '❌ 发送登录指令失败');
        } else {
          console.log('消息发送成功:', response);
          addLog('✅ 登录指令已发送');
        }
      });

      setStatus('working', '🔄 正在执行自动登录...');

    } catch (error) {
      console.error('登录按钮点击处理失败:', error);
      setStatus('error', '❌ 登录失败');
      addLog('登录失败: ' + error.message);
    }
  });

  // 设置按钮
  settingsBtn.addEventListener('click', function() {
    // 测试Native Host连接和配置获取
    testNativeHostConfig();
  });

  // 测试Native Host配置
  async function testNativeHostConfig() {
    addLog('🔧 测试Native Host配置获取...');

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendNativeMessage(
          'com.augmentcode.emailverifier',
          { action: 'getEmailConfig' },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      addLog('📧 Native Host响应: ' + JSON.stringify(response));

      if (response && response.success) {
        addLog(`✅ 获取到生成邮箱: ${response.email}`);
        addLog(`📧 实际接收邮箱: ${response.actualEmail}`);
        addLog(`⏰ 生成时间: ${response.generatedTime}`);
        emailValueEl.textContent = response.email;

        // 保存配置到本地存储
        chrome.storage.local.set({
          emailConfig: {
            email: response.email,
            actualEmail: response.actualEmail,
            server: response.server,
            port: response.port,
            generatedTime: response.generatedTime
          }
        });
      } else {
        addLog('❌ Native Host返回失败: ' + (response?.error || '未知错误'));
      }
    } catch (error) {
      addLog('❌ Native Host连接失败: ' + error.message);
    }
  }

  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateStatus') {
      setStatus(request.type, request.message);
      addLog(request.message);
    }
  });

  // 清理日志按钮（隐藏功能，双击状态栏清理）
  statusEl.addEventListener('dblclick', function() {
    logsEl.innerHTML = '';
    addLog('日志已清理');
  });
});
