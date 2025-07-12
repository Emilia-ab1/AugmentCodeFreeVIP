// Edge专用版本 - Content Script
// 优化页面操作和邮箱处理逻辑

console.log('Edge专用 Augment Code 自动登录 Content Script 已加载');

// 全局变量
let isLoginInProgress = false;
let currentEmail = '';
let loginConfig = {};

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content Script收到消息:', message);
  
  switch (message.action) {
    case 'startLogin':
      handleStartLogin(message);
      break;
    case 'stopLogin':
      handleStopLogin();
      break;
    case 'loginDetected':
      handleLoginDetected(message);
      break;
    default:
      console.log('未知消息类型:', message.action);
  }
});

// 处理开始登录
async function handleStartLogin(message) {
  if (isLoginInProgress) {
    sendMessageToPopup('loginProgress', '⚠️ 登录已在进行中');
    return;
  }

  isLoginInProgress = true;
  currentEmail = message.email;
  loginConfig = message.config || {};
  
  sendMessageToPopup('loginProgress', `🚀 Edge专用登录流程启动`);
  sendMessageToPopup('loginProgress', `📧 使用邮箱: ${currentEmail}`);
  
  try {
    await executeLoginFlow();
  } catch (error) {
    console.error('登录流程失败:', error);
    sendMessageToPopup('loginError', error.message);
    isLoginInProgress = false;
  }
}

// 处理停止登录
function handleStopLogin() {
  isLoginInProgress = false;
  sendMessageToPopup('loginProgress', '⏹️ 登录流程已停止');
}

// 处理登录检测
function handleLoginDetected(message) {
  if (message.url.includes('app.augmentcode.com/account/subscription')) {
    sendMessageToPopup('loginProgress', '🎯 检测到登录完成页面');
    sendMessageToPopup('loginComplete', '登录成功完成');
    isLoginInProgress = false;
  }
}

// 执行登录流程
async function executeLoginFlow() {
  try {
    // 步骤1: 填写邮箱
    sendMessageToPopup('loginProgress', '📝 步骤1: 填写邮箱地址');
    await fillEmailAddress();
    
    // 步骤2: 处理人机验证
    sendMessageToPopup('loginProgress', '🤖 步骤2: 处理人机验证');
    await handleHumanVerification();
    
    // 步骤3: 获取验证码
    sendMessageToPopup('loginProgress', '📨 步骤3: 获取邮箱验证码');
    await getAndFillVerificationCode();
    
    // 步骤4: 接受条款并提交
    sendMessageToPopup('loginProgress', '📋 步骤4: 接受条款并提交');
    await acceptTermsAndSubmit();
    
    sendMessageToPopup('loginProgress', '✅ 登录流程完成，等待页面跳转...');
    
  } catch (error) {
    throw new Error(`登录流程失败: ${error.message}`);
  }
}

// 填写邮箱地址
async function fillEmailAddress() {
  const emailInput = await waitForElement('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="email"]', 10000);
  
  if (!emailInput) {
    throw new Error('未找到邮箱输入框');
  }
  
  // Edge专用：确保邮箱是最新生成的
  if (loginConfig.enhanced) {
    // 请求新的随机邮箱
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'needNewEmail' }, resolve);
    });
    
    if (response && response.email) {
      currentEmail = response.email;
      sendMessageToPopup('loginProgress', `🔄 Edge优化: 使用新邮箱 ${currentEmail}`);
    }
  }
  
  // 清空并填写邮箱
  emailInput.value = '';
  emailInput.focus();
  
  // 模拟真实输入
  for (let i = 0; i < currentEmail.length; i++) {
    emailInput.value += currentEmail[i];
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(50 + Math.random() * 50); // 随机延迟
  }
  
  emailInput.dispatchEvent(new Event('change', { bubbles: true }));
  sendMessageToPopup('loginProgress', `✅ 邮箱已填写: ${currentEmail}`);
  
  await sleep(1000);
}

// 处理人机验证
async function handleHumanVerification() {
  sendMessageToPopup('loginProgress', '🔍 检查人机验证...');
  
  // 等待页面稳定
  await sleep(2000);
  
  // 检查Cloudflare验证
  const cloudflareFrame = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
  if (cloudflareFrame) {
    sendMessageToPopup('loginProgress', '🛡️ 检测到Cloudflare验证');
    await handleCloudflareVerification(cloudflareFrame);
    return;
  }
  
  // 检查其他验证框
  const verifyCheckbox = await waitForElement('input[type="checkbox"]', 3000);
  if (verifyCheckbox) {
    const parentText = verifyCheckbox.parentElement?.textContent || '';
    if (parentText.includes('human') || parentText.includes('robot') || parentText.includes('验证')) {
      sendMessageToPopup('loginProgress', '🤖 检测到人机验证，需要手动点击');
      
      // 等待用户手动点击
      await waitForVerificationComplete();
      return;
    }
  }
  
  sendMessageToPopup('loginProgress', '✅ 无需人机验证或已完成');
}

// 处理Cloudflare验证
async function handleCloudflareVerification(iframe) {
  try {
    sendMessageToPopup('loginProgress', '⏳ 等待Cloudflare验证完成...');
    
    // 等待验证完成的标志
    let attempts = 0;
    const maxAttempts = 60; // 最多等待60秒
    
    while (attempts < maxAttempts) {
      // 检查成功标志
      const successElement = document.querySelector('#success');
      if (successElement && successElement.style.display === 'grid' && successElement.style.visibility === 'visible') {
        const successText = successElement.querySelector('#success-text');
        if (successText && successText.textContent.includes('Success!')) {
          sendMessageToPopup('loginProgress', '✅ Cloudflare验证成功');
          await sleep(2000); // 等待页面更新
          return;
        }
      }
      
      await sleep(1000);
      attempts++;
      
      if (attempts % 10 === 0) {
        sendMessageToPopup('loginProgress', `⏳ 继续等待验证... (${attempts}/${maxAttempts})`);
      }
    }
    
    throw new Error('Cloudflare验证超时');
    
  } catch (error) {
    sendMessageToPopup('loginProgress', '⚠️ Cloudflare验证需要手动处理');
    throw error;
  }
}

// 等待验证完成
async function waitForVerificationComplete() {
  sendMessageToPopup('loginProgress', '⏳ 等待人机验证完成...');
  
  let attempts = 0;
  const maxAttempts = 60;
  
  while (attempts < maxAttempts) {
    // 检查验证是否完成（页面元素变化）
    const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], .submit-btn');
    if (submitBtn && !submitBtn.disabled) {
      sendMessageToPopup('loginProgress', '✅ 人机验证已完成');
      return;
    }
    
    await sleep(1000);
    attempts++;
    
    if (attempts % 15 === 0) {
      sendMessageToPopup('loginProgress', `⏳ 请完成人机验证... (${attempts}/${maxAttempts})`);
    }
  }
  
  throw new Error('人机验证超时');
}

// 获取并填写验证码
async function getAndFillVerificationCode() {
  sendMessageToPopup('loginProgress', '📨 正在获取验证码...');
  
  // Edge专用：延迟20秒确保邮件到达
  sendMessageToPopup('loginProgress', '⏳ Edge优化: 等待20秒确保邮件送达...');
  await sleep(20000);
  
  try {
    // 请求验证码
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('获取验证码超时'));
      }, 30000);
      
      chrome.runtime.sendMessage({
        action: 'getVerificationCode',
        email: currentEmail,
        browser: 'edge'
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (!response.success) {
      throw new Error(response.error || '获取验证码失败');
    }
    
    const verificationCode = response.code;
    sendMessageToPopup('loginProgress', `✅ 验证码获取成功: ${verificationCode}`);
    
    // 查找验证码输入框
    const codeInput = await waitForElement('input[name*="code"], input[placeholder*="验证码"], input[placeholder*="code"], input[type="text"]:not([name="email"])', 10000);
    
    if (!codeInput) {
      throw new Error('未找到验证码输入框');
    }
    
    // 填写验证码
    codeInput.value = '';
    codeInput.focus();
    
    for (let i = 0; i < verificationCode.length; i++) {
      codeInput.value += verificationCode[i];
      codeInput.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(100);
    }
    
    codeInput.dispatchEvent(new Event('change', { bubbles: true }));
    sendMessageToPopup('loginProgress', '✅ 验证码已填写');
    
    await sleep(1000);
    
  } catch (error) {
    throw new Error(`验证码处理失败: ${error.message}`);
  }
}

// 接受条款并提交
async function acceptTermsAndSubmit() {
  // 查找并勾选条款复选框
  const termsCheckbox = await waitForElement('input[type="checkbox"]', 5000);
  if (termsCheckbox && !termsCheckbox.checked) {
    termsCheckbox.click();
    sendMessageToPopup('loginProgress', '✅ 已接受服务条款');
    await sleep(500);
  }
  
  // 查找并点击提交按钮
  const submitBtn = await waitForElement('button[type="submit"], input[type="submit"], .submit-btn, button:contains("提交"), button:contains("登录")', 5000);
  
  if (!submitBtn) {
    throw new Error('未找到提交按钮');
  }
  
  submitBtn.click();
  sendMessageToPopup('loginProgress', '✅ 表单已提交');
  
  // 等待页面跳转
  await sleep(3000);
}

// 工具函数：等待元素出现
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// 工具函数：延迟
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 工具函数：发送消息到popup
function sendMessageToPopup(action, message) {
  chrome.runtime.sendMessage({
    action: action,
    message: message,
    timestamp: Date.now(),
    browser: 'edge'
  }).catch(err => {
    console.log('发送消息到popup失败:', err);
  });
}

console.log('Edge专用 Content Script 初始化完成');
