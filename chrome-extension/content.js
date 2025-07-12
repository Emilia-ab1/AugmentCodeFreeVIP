// Augment Code Auto Login - Content Script
console.log('Augment Code Auto Login Content Script loaded on:', window.location.href);

// 配置和状态
let config = null;
let isProcessing = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// 初始化
async function init() {
  try {
    console.log('Augment Code Auto Login Content Script loaded on:', window.location.href);
    config = await getConfig();
    console.log('Config loaded:', config);

    // 如果是邮箱登录页面，记录日志
    if (window.location.href.includes('login.augmentcode.com/u/login/identifier')) {
      console.log('� 邮箱登录页面，将监控SVG成功图标');
    }

    // 等待页面完全加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handlePageLoad);
    } else {
      handlePageLoad();
    }
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
}

// 处理页面加载
function handlePageLoad() {
  const url = window.location.href;
  console.log('Handling page load for:', url);

  // 根据URL判断当前页面类型并执行相应操作
  if (url.includes('login.augmentcode.com/u/login/identifier')) {
    // 邮箱登录页面 - 函数会自己获取配置
    console.log('检测到邮箱登录页面，开始处理...');
    logToBackground('检测到邮箱登录页面，开始处理...');
    handleEmailLoginPage();
  } else if (url.includes('login.augmentcode.com/u/login/passwordless-email-challenge')) {
    // 验证码页面 - 不需要配置
    console.log('检测到验证码页面，开始处理...');
    logToBackground('检测到验证码页面，开始处理...');
    handleVerificationPage();
  } else if (url.includes('auth.augmentcode.com/terms-accept') ||
             url.includes('auth.augmentcode.com/terms') ||
             url.includes('terms-of-service') ||
             url.includes('agreement') ||
             (url.includes('auth.augmentcode.com') && document.body.textContent.toLowerCase().includes('terms'))) {
    // 条款页面 - 多种可能的URL
    console.log('检测到条款页面，开始处理...');
    logToBackground('检测到条款页面，开始处理...');
    handleTermsAcceptPage();
  } else if (url.includes('app.augmentcode.com/account/subscription')) {
    // 登录完成页面 - 订阅页面表示登录成功
    console.log('🎉 检测到登录完成页面，自动登录任务结束');
    logToBackground('🎉 检测到登录完成页面，自动登录任务结束');
    handleLoginCompletePage();
  } else if (url.startsWith('https://app.augmentcode.com/')) {
    // 已经在目标网站的其他页面
    console.log('已在目标网站，检查是否为登录完成页面');
    logToBackground('已在目标网站，检查是否为登录完成页面');
    // 等待一下再检查URL，因为可能还在跳转中
    setTimeout(() => {
      const currentUrl = window.location.href;
      if (currentUrl.includes('app.augmentcode.com/account/subscription')) {
        handleLoginCompletePage();
      } else {
        updateStatus('ready', '🎉 登录成功！');
      }
    }, 2000);
  } else {
    // 检查是否需要重定向
    checkAndRedirect();
  }
}

// 检查并重定向到目标网站
function checkAndRedirect() {
  const currentUrl = window.location.href;
  const targetDomains = [
    'https://app.augmentcode.com',
    'https://login.augmentcode.com',
    'https://auth.augmentcode.com'
  ];

  // 检查是否已经在目标域名
  const isOnTargetDomain = targetDomains.some(domain => currentUrl.startsWith(domain));

  if (!isOnTargetDomain) {
    // 排除一些不应该重定向的页面
    const excludePatterns = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'about:',
      'file://',
      'data:',
      'javascript:'
    ];

    const shouldExclude = excludePatterns.some(pattern => currentUrl.startsWith(pattern));

    if (!shouldExclude) {
      console.log('Current URL:', currentUrl);
      console.log('Redirecting to target URL:', config.targetUrl);
      logToBackground(`Redirecting from ${currentUrl} to ${config.targetUrl}`);

      // 使用延迟重定向，避免过于频繁的跳转
      setTimeout(() => {
        window.location.href = config.targetUrl;
      }, 1000);
    }
  } else {
    console.log('Already on target domain:', currentUrl);
  }
}



// 处理登录完成页面
function handleLoginCompletePage() {
  console.log('🎉 handleLoginCompletePage 函数开始执行');
  logToBackground('🎉 登录完成！到达订阅页面');

  // 更新状态为登录完成
  updateStatus('success', '🎉 已登录完成');

  // 发送登录完成消息到background
  try {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'loginComplete',
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.log('发送登录完成消息失败:', error);
  }

  // 记录成功日志
  logToBackground('🎉 自动登录任务已完成');
  logToBackground(`✅ 最终页面: ${window.location.href}`);
  logToBackground('🔚 自动执行任务结束');

  // 显示成功提示
  console.log('🎉 自动登录流程完成！');

  // 可选：显示页面提示
  try {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
    `;
    notification.textContent = '🎉 自动登录完成！';
    document.body.appendChild(notification);

    // 3秒后移除提示
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  } catch (error) {
    console.log('显示页面提示失败:', error);
  }
}

// 处理条款接受页面
async function handleTermsAcceptPage() {
  if (isProcessing) return;
  isProcessing = true;

  console.log('📋 handleTermsAcceptPage 函数开始执行');
  console.log('Handling terms accept page');
  logToBackground('📋 开始处理条款接受页面');
  logToBackground('Detected terms accept page');
  updateStatus('working', '📋 处理条款页面...');

  // 首先分析页面的基本结构
  console.log('=== 条款页面结构分析 ===');
  console.log(`页面标题: ${document.title}`);
  console.log(`页面URL: ${window.location.href}`);
  console.log(`页面文本长度: ${document.body.textContent.length}`);

  // 检查页面是否完全加载
  if (document.readyState !== 'complete') {
    console.log('页面还在加载中，等待加载完成...');
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
    console.log('页面加载完成');
  }

  try {
    // 检查自动登录是否启用
    const settings = await chrome.storage.local.get(['autoLogin']);
    if (settings.autoLogin === false) {
      console.log('Auto login is disabled');
      return;
    }

    // 等待页面完全加载
    await sleep(2000);

    // 查找并勾选条款复选框
    const checkboxSelectors = [
      'input[type="checkbox"]',
      '#terms-of-service-checkbox',
      '#terms-checkbox',
      '.terms-checkbox',
      'input[name*="terms" i]',
      'input[name*="agreement" i]',
      'input[id*="terms" i]',
      'input[id*="agreement" i]'
    ];

    let termsCheckbox = null;
    for (const selector of checkboxSelectors) {
      try {
        termsCheckbox = document.querySelector(selector);
        if (termsCheckbox) {
          console.log('Found terms checkbox with selector:', selector);
          break;
        }
      } catch (e) {
        console.log(`Checkbox selector "${selector}" failed:`, e.message);
        // 继续尝试下一个选择器
      }
    }

    if (termsCheckbox) {
      if (!termsCheckbox.checked) {
        console.log('Checking terms checkbox');
        logToBackground('Accepting terms of service');

        // 确保复选框可见
        termsCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(500);

        // 点击复选框
        termsCheckbox.click();

        // 触发事件
        termsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        termsCheckbox.dispatchEvent(new Event('click', { bubbles: true }));

        await sleep(1000);
      } else {
        console.log('Terms checkbox already checked');
      }
    } else {
      console.log('Terms checkbox not found, analyzing page structure...');

      // 详细分析页面结构
      const allInputs = document.querySelectorAll('input');
      console.log(`页面上共有 ${allInputs.length} 个input元素:`);
      allInputs.forEach((input, index) => {
        console.log(`Input${index}: type="${input.type}", name="${input.name}", id="${input.id}", class="${input.className}"`);
      });

      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      console.log(`页面上共有 ${allCheckboxes.length} 个checkbox元素:`);
      allCheckboxes.forEach((checkbox, index) => {
        console.log(`Checkbox${index}: name="${checkbox.name}", id="${checkbox.id}", class="${checkbox.className}", checked=${checkbox.checked}`);
      });

      // 检查是否有任何包含terms相关文本的元素
      try {
        const allElements = document.querySelectorAll('*');
        const termsRelatedElements = [];
        allElements.forEach((el, index) => {
          if (index < 500) { // 只检查前500个元素
            try {
              const text = (el.textContent || '').toLowerCase();
              const id = (el.id || '').toLowerCase();
              const className = (el.className || '').toString().toLowerCase();

              if (text.includes('terms') || text.includes('agreement') || text.includes('accept') ||
                  id.includes('terms') || id.includes('agreement') ||
                  className.includes('terms') || className.includes('agreement')) {
                termsRelatedElements.push({
                  tag: el.tagName,
                  id: el.id,
                  class: el.className,
                  text: text.substring(0, 100)
                });
              }
            } catch (e) {
              // 跳过有问题的元素
              console.log(`跳过元素 ${index}:`, e.message);
            }
          }
        });

        console.log(`找到 ${termsRelatedElements.length} 个terms相关元素:`);
        termsRelatedElements.forEach((el, index) => {
          console.log(`Terms${index}: <${el.tag}> id="${el.id}" class="${el.class}" text="${el.text}"`);
        });
      } catch (e) {
        console.log('分析页面元素时出错:', e.message);
      }
    }

    // 查找并点击提交按钮 - 移除不支持的:contains选择器
    const submitSelectors = [
      '#signup-button',                    // 具体的ID
      'button[type="submit"]',
      'input[type="submit"]',
      '.sign-link',                        // 从HTML中的class
      '.gsi-material-button',              // 从HTML中的class
      '.submit-button',
      '.accept-button',
      '.continue-button',
      'button[data-testid="submit"]',
      'button[data-testid="accept"]',
      // 根据JSON添加XPath对应的选择器
      'form div[2] button',                // 从XPath: /html/body/div/div/div/form/div[2]/button
      'form button'                        // 简化的表单按钮选择器
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = document.querySelector(selector);
        if (submitButton && !submitButton.disabled) {
          console.log('Found submit button with selector:', selector);
          break;
        }
      } catch (e) {
        console.log(`Selector "${selector}" failed:`, e.message);
        // 继续尝试下一个选择器
      }
    }

    if (submitButton && !submitButton.disabled) {
      console.log('Clicking submit button');
      logToBackground('Submitting terms acceptance');

      // 确保按钮可见
      submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(500);

      submitButton.click();
      logToBackground('Terms accepted and submitted successfully');
    } else {
      console.log('Submit button not found or disabled, analyzing page...');
      logToBackground('Warning: Could not find enabled submit button');

      // 列出所有按钮并尝试文本匹配
      const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
      console.log(`页面上共有 ${allButtons.length} 个按钮:`);

      let foundByText = null;
      allButtons.forEach((btn, index) => {
        const text = (btn.textContent || btn.value || '').trim().toLowerCase();
        const disabled = btn.disabled;
        const type = btn.type || '';
        console.log(`Button${index}: text="${text}", type="${type}", disabled=${disabled}, class="${btn.className}"`);

        // 尝试文本匹配查找按钮
        if (!disabled && !foundByText && (
          text.includes('sign up') ||
          text.includes('start coding') ||
          text.includes('accept') ||
          text.includes('continue') ||
          text.includes('agree') ||
          text.includes('submit') ||
          text.includes('注册') ||
          text.includes('接受') ||
          text.includes('同意') ||
          text.includes('继续')
        )) {
          console.log(`找到文本匹配的按钮: "${text}"`);
          foundByText = btn;
        }
      });

      // 如果找到了文本匹配的按钮，尝试点击
      if (foundByText) {
        console.log('尝试点击文本匹配的按钮');
        logToBackground('尝试点击文本匹配的按钮');

        foundByText.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(500);
        foundByText.click();
        logToBackground('已点击文本匹配的按钮');
      }

      // 尝试查找任何可能的提交按钮
      let foundButton = null;
      allButtons.forEach(btn => {
        const text = (btn.textContent || btn.value || '').toLowerCase();
        const id = (btn.id || '').toLowerCase();
        if (!btn.disabled && (
          text.includes('submit') ||
          text.includes('continue') ||
          text.includes('accept') ||
          text.includes('agree') ||
          text.includes('next') ||
          text.includes('sign up') ||           // 新增
          text.includes('start coding') ||      // 新增
          text.includes('确认') ||
          text.includes('提交') ||
          text.includes('注册') ||              // 新增
          btn.type === 'submit' ||
          id === 'signup-button'               // 新增：匹配具体ID
        )) {
          foundButton = btn;
          console.log(`找到匹配的按钮: text="${text}", id="${btn.id}"`);
        }
      });

      if (foundButton) {
        console.log('找到可能的提交按钮，尝试点击');

        // 检查按钮是否被禁用
        if (foundButton.disabled) {
          console.log('按钮被禁用，尝试启用后点击');
          foundButton.disabled = false;
          foundButton.removeAttribute('disabled');
        }

        foundButton.click();
        logToBackground('点击了可能的提交按钮');
      } else {
        // 根据JSON分析，查找包含"Sign up and start coding"文本的按钮
        console.log('未找到标准按钮，查找包含特定文本的按钮...');

        const allButtons = document.querySelectorAll('button');
        let foundSpecialButton = null;

        allButtons.forEach(btn => {
          // 检查按钮内的span元素文本
          const spans = btn.querySelectorAll('span');
          spans.forEach(span => {
            const spanText = (span.textContent || '').trim();
            if (spanText === 'Sign up and start coding') {
              foundSpecialButton = btn;
              console.log('找到包含"Sign up and start coding"文本的按钮');
            }
          });

          // 也检查按钮本身的文本
          const btnText = (btn.textContent || '').trim();
          if (btnText.includes('Sign up and start coding')) {
            foundSpecialButton = btn;
            console.log('找到按钮文本包含"Sign up and start coding"');
          }
        });

        if (foundSpecialButton) {
          console.log('找到特殊按钮，尝试点击');

          // 移除disabled属性
          if (foundSpecialButton.disabled) {
            foundSpecialButton.disabled = false;
            foundSpecialButton.removeAttribute('disabled');
          }

          foundSpecialButton.click();
          logToBackground('点击了包含"Sign up and start coding"的按钮');
        } else {
          // 特别检查signup-button，即使被禁用也尝试点击
          const signupButton = document.querySelector('#signup-button');
          if (signupButton) {
            console.log('找到signup-button，尝试强制点击');

            // 移除disabled属性
            signupButton.disabled = false;
            signupButton.removeAttribute('disabled');

            // 尝试触发onclick事件
            if (signupButton.onclick) {
              console.log('触发onclick事件');
              signupButton.onclick(new Event('click'));
            } else {
              console.log('直接点击按钮');
              signupButton.click();
            }

            logToBackground('强制点击了signup-button');
          } else {
            // 尝试查找表单并提交
            const form = document.querySelector('form');
            if (form) {
              console.log('Submitting form directly');
              form.submit();
              logToBackground('Form submitted directly');
            } else {
              console.log('未找到表单，尝试查找任何链接');
              const links = document.querySelectorAll('a[href]');
              links.forEach((link, index) => {
                const text = (link.textContent || '').toLowerCase();
                const href = link.href || '';
                console.log(`Link${index}: text="${text}", href="${href}"`);

                if (text.includes('continue') || text.includes('next') || href.includes('app.augmentcode.com')) {
                  console.log('找到可能的继续链接，点击');
                  link.click();
                }
              });
            }
          }
        }
      }
    }

    // 等待页面跳转
    await sleep(2000);

    // 检查是否成功跳转到主页面
    const currentUrl = window.location.href;
    if (currentUrl.includes('app.augmentcode.com/account/subscription')) {
      console.log('🎉 Successfully logged in and redirected to subscription page');
      logToBackground('🎉 登录完成！跳转到订阅页面');
      handleLoginCompletePage();
    } else if (currentUrl.includes('app.augmentcode.com')) {
      console.log('Successfully logged in and redirected to main app');
      logToBackground('Login completed successfully!');

      // 等待一下再检查是否跳转到订阅页面
      setTimeout(() => {
        const finalUrl = window.location.href;
        if (finalUrl.includes('app.augmentcode.com/account/subscription')) {
          handleLoginCompletePage();
        } else {
          updateStatus('ready', '🎉 登录成功！');
          // 保存登录时间
          chrome.storage.local.set({
            lastLoginTime: new Date().toISOString(),
            loginSuccess: true
          });
        }
      }, 3000);
    }

  } catch (error) {
    console.error('Error handling terms accept page:', error);
    logToBackground('Error in terms acceptance: ' + error.message);
  } finally {
    isProcessing = false;
  }
}

// 工具函数
async function getConfig() {
  return new Promise((resolve) => {
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'getConfig' }, resolve);
      } else {
        // 扩展上下文失效，返回默认配置
        resolve({
          targetUrl: 'https://app.augmentcode.com/',
          email: '130131@newmeng.cn',
          nativeAppName: 'com.augmentcode.emailverifier'
        });
      }
    } catch (error) {
      console.log('获取配置失败，使用默认配置');
      resolve({
        targetUrl: 'https://app.augmentcode.com/',
        email: '130131@newmeng.cn',
        nativeAppName: 'com.augmentcode.emailverifier'
      });
    }
  });
}

async function getVerificationCode(withDelay = true) {
  console.log('🔍 Starting verification code request...');
  logToBackground('Starting verification code request...');

  // 如果需要延迟，等待验证码发送
  if (withDelay) {
    const waitTime = 20; // 等待20秒，确保新验证码已发送
    console.log(`⏰ 等待 ${waitTime} 秒确保验证码已发送...`);
    logToBackground(`⏰ 等待 ${waitTime} 秒确保验证码已发送...`);
    logToBackground('💡 这个等待是为了避免获取到旧的验证码');

    for (let i = waitTime; i > 0; i--) {
      console.log(`⏰ 倒计时: ${i}秒`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('⏰ 等待完成，开始获取验证码');
    logToBackground('⏰ 等待完成，开始获取验证码');
  }

  return new Promise((resolve) => {
    console.log('📡 Sending message to background script...');

    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'getVerificationCode' }, (response) => {
          console.log('📨 Received response from background:', response);

          if (chrome.runtime.lastError) {
            console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
            logToBackground(`Chrome runtime error: ${chrome.runtime.lastError.message}`);
            resolve(null);
            return;
          }

          if (response && response.success) {
            console.log('✅ Successfully got verification code:', response.code);
            logToBackground(`Successfully got verification code: ${response.code}`);
            resolve(response.code);
          } else {
            console.error('❌ Failed to get verification code:', response?.error);
            logToBackground(`Failed to get verification code: ${response?.error || 'Unknown error'}`);
            resolve(null);
          }
        });
      } else {
        console.log('扩展上下文失效，无法获取验证码');
        resolve(null);
      }
    } catch (error) {
      console.error('获取验证码异常:', error);
      resolve(null);
    }
  });
}

function logToBackground(message) {
  try {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'log', message });
    }
  } catch (error) {
    // 扩展上下文失效，输出到控制台
    console.log('[Content Script]:', message);
  }
}

async function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
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
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

async function typeText(element, text) {
  for (let i = 0; i < text.length; i++) {
    element.value += text[i];
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(50); // 模拟真实输入速度
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 旧的waitForHumanVerification函数已删除，使用新的waitForCaptchaCompletion

// 监听来自background的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Content script received message:', request);

  switch (request.action) {
    case 'checkRedirect':
      if (!window.location.href.startsWith(request.targetUrl)) {
        try {
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'redirectToTarget' });
          }
        } catch (error) {
          console.log('扩展上下文失效，无法发送重定向请求');
        }
      }
      break;

    case 'test':
      handleTestRequest();
      sendResponse({ success: true, message: 'Test completed' });
      break;

    case 'forceLogin':
      handlePageLoad();
      sendResponse({ success: true, message: 'Login process started' });
      break;

    case 'startLogin':
      logToBackground('🚀 收到开始登录指令');
      logToBackground('📧 收到的配置: ' + JSON.stringify(request.config));

      // 验证配置
      if (!request.config) {
        logToBackground('❌ 配置为空');
        updateStatus('error', '❌ 配置为空');
        sendResponse({ success: false, error: '配置为空' });
        break;
      }

      if (!request.config.email) {
        logToBackground('❌ 邮箱配置缺失');
        updateStatus('error', '❌ 邮箱配置缺失');
        sendResponse({ success: false, error: '邮箱配置缺失' });
        break;
      }

      logToBackground(`✅ 配置验证通过，邮箱: ${request.config.email}`);
      updateStatus('working', '🔍 分析当前页面...');

      handleAutoLogin(request.config).catch(error => {
        logToBackground('自动登录过程出错: ' + error.message);
        updateStatus('error', '❌ 自动登录失败: ' + error.message);
      });
      sendResponse({ success: true, message: 'Auto login started' });
      break;
  }
});

// 处理测试请求
function handleTestRequest() {
  const url = window.location.href;
  logToBackground(`Test request on page: ${url}`);

  if (url.includes('login.augmentcode.com/u/login/identifier')) {
    logToBackground('Test: Email login page detected');
  } else if (url.includes('login.augmentcode.com/u/login/passwordless-email-challenge')) {
    logToBackground('Test: Verification code page detected');
  } else if (url.includes('auth.augmentcode.com/terms-accept')) {
    logToBackground('Test: Terms accept page detected');
  } else if (url.startsWith('https://app.augmentcode.com/')) {
    logToBackground('Test: Already on target site');
  } else {
    logToBackground('Test: Not on target domain, would redirect');
  }
}

// 添加页面可见性检测
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && !isProcessing) {
    // 页面变为可见时，重新检查是否需要处理
    setTimeout(handlePageLoad, 1000);
  }
});

// 添加错误恢复机制
window.addEventListener('error', function(event) {
  console.error('Page error:', event.error);
  logToBackground(`Page error: ${event.error?.message || 'Unknown error'}`);

  // 重置处理状态
  isProcessing = false;
});

// 添加网络状态检测
window.addEventListener('online', function() {
  logToBackground('Network connection restored');
  if (!isProcessing) {
    setTimeout(handlePageLoad, 2000);
  }
});

window.addEventListener('offline', function() {
  logToBackground('Network connection lost');
});

// 启动
init();

// 更新状态到popup
function updateStatus(type, message) {
  try {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'updateStatus',
        type: type,
        message: message
      });
    }
  } catch (error) {
    // 扩展上下文失效，忽略错误
    console.log('扩展上下文失效，无法发送状态更新:', message);
  }
}

// 处理自动登录
async function handleAutoLogin(config) {
  const url = window.location.href;
  logToBackground(`开始自动登录流程，当前页面: ${url}`);

  // 等待页面完全加载
  setTimeout(async () => {
    try {
      // 特殊处理：Auth0登录页面
      if (url.includes('login.augmentcode.com/u/login/identifier')) {
        updateStatus('working', '🔐 检测到Auth0邮箱登录页面...');
        logToBackground('这是Auth0邮箱输入页面，直接处理');
        await handleAuth0EmailPage(config);
        return;
      }

      if (url.includes('login.augmentcode.com/u/login/password')) {
        updateStatus('working', '🔑 检测到Auth0验证码页面...');
        logToBackground('这是Auth0验证码页面，直接处理');
        handleVerificationPage(config);
        return;
      }

      // 检查页面内容来确定页面类型
      const hasEmailInput = document.querySelector('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="邮箱"], input[placeholder*="email"]');
      const hasCodeInput = document.querySelector('input[placeholder*="验证码"], input[placeholder*="code"], input[name*="code"], input[id*="code"]');
      const hasLoginButton = document.querySelector('a[href*="login"], button[class*="login"], .login-btn, .sign-in');

      logToBackground(`页面分析: hasEmailInput=${!!hasEmailInput}, hasCodeInput=${!!hasCodeInput}, hasLoginButton=${!!hasLoginButton}`);

      if (hasCodeInput) {
        updateStatus('working', '🔑 检测到验证码页面...');
        handleVerificationPage(config);
      } else if (hasEmailInput) {
        updateStatus('working', '📧 检测到邮箱登录页面...');
        await handleEmailLoginPage();
      } else if (hasLoginButton || url.includes('app.augmentcode.com')) {
        updateStatus('working', '🏠 检测到主页面，查找登录入口...');
        handleMainPage();
      } else {
        updateStatus('info', '📍 分析当前页面结构...');
        logToBackground('页面类型未知，进行详细分析');

        // 详细分析页面
        analyzeCurrentPage();

        // 默认尝试主页面处理
        setTimeout(() => {
          handleMainPage();
        }, 2000);
      }
    } catch (error) {
      logToBackground('页面处理出错: ' + error.message);
      updateStatus('error', '❌ 页面处理失败');
    }
  }, 1000);
}

// 分析当前页面
function analyzeCurrentPage() {
  const url = window.location.href;
  const title = document.title;
  const allInputs = document.querySelectorAll('input');
  const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');

  logToBackground(`页面详细信息:`);
  logToBackground(`URL: ${url}`);
  logToBackground(`标题: ${title}`);
  logToBackground(`输入框数量: ${allInputs.length}`);
  logToBackground(`按钮数量: ${allButtons.length}`);

  // 分析输入框
  allInputs.forEach((input, index) => {
    if (index < 5) { // 只显示前5个
      logToBackground(`输入框${index}: type=${input.type}, name=${input.name || 'N/A'}, id=${input.id || 'N/A'}, placeholder="${input.placeholder || 'N/A'}"`);
    }
  });

  // 分析按钮
  allButtons.forEach((button, index) => {
    if (index < 5) { // 只显示前5个
      const text = button.textContent?.trim() || button.value || 'N/A';
      logToBackground(`按钮${index}: "${text}" - class=${button.className || 'N/A'}`);
    }
  });
}

// 处理主页面
function handleMainPage() {
  updateStatus('working', '🔍 查找登录按钮...');

  // 查找登录相关的按钮或链接
  const loginSelectors = [
    'a[href*="login"]',
    'button[class*="login"]',
    '.login-btn',
    '.sign-in',
    '[data-testid*="login"]'
  ];

  let loginElement = null;
  for (const selector of loginSelectors) {
    loginElement = document.querySelector(selector);
    if (loginElement) {
      logToBackground(`找到登录元素: ${selector}`);
      break;
    }
  }

  if (loginElement) {
    updateStatus('working', '🖱️ 点击登录按钮...');
    loginElement.click();

    // 等待页面跳转
    setTimeout(() => {
      if (window.location.href !== url) {
        updateStatus('working', '✅ 已跳转到登录页面');
      }
    }, 1000);
  } else {
    updateStatus('info', '❓ 未找到登录按钮，可能已经在登录页面');
  }
}

// 处理邮箱登录页面
async function handleEmailLoginPage() {
  console.log('handleEmailLoginPage 函数开始执行');
  logToBackground('handleEmailLoginPage 函数开始执行');
  updateStatus('working', '📧 查找邮箱输入框...');

  // 如果没有配置，尝试获取
  if (!config) {
    console.log('📧 配置为空，尝试获取配置...');
    logToBackground('📧 配置为空，尝试获取配置...');

    try {
      console.log('正在从存储获取配置...');
      // 从存储中获取配置
      const result = await chrome.storage.local.get(['emailConfig']);
      console.log('存储结果:', result);

      if (result.emailConfig && result.emailConfig.email) {
        config = result.emailConfig;
        console.log(`✅ 从存储获取配置: ${config.email}`);
        logToBackground(`✅ 从存储获取配置: ${config.email}`);
      } else {
        console.log('存储中没有配置，使用默认配置');
        // 使用默认配置
        config = {
          email: '130131@newmeng.cn',
          server: 'imap.qiye.aliyun.com',
          port: 993
        };
        console.log(`⚠️ 使用默认配置: ${config.email}`);
        logToBackground(`⚠️ 使用默认配置: ${config.email}`);
      }
    } catch (error) {
      console.error(`❌ 获取配置失败: ${error.message}`);
      logToBackground(`❌ 获取配置失败: ${error.message}`);
      // 使用默认配置
      config = {
        email: '130131@newmeng.cn',
        server: 'imap.qiye.aliyun.com',
        port: 993
      };
      console.log(`⚠️ 使用默认配置: ${config.email}`);
      logToBackground(`⚠️ 使用默认配置: ${config.email}`);
    }
  } else {
    console.log('已有配置:', config);
  }

  console.log(`📧 使用邮箱配置: ${config.email}`);
  logToBackground(`📧 使用邮箱配置: ${config.email}`);

  console.log('开始查找邮箱输入框...');
  // 扩展的邮箱输入框选择器
  const emailSelectors = [
    'input[type="email"]',
    'input[name*="email"]',
    'input[id*="email"]',
    'input[placeholder*="邮箱"]',
    'input[placeholder*="email"]',
    'input[placeholder*="Email"]',
    'input[placeholder*="用户名"]',
    'input[placeholder*="username"]',
    'input[name="username"]',
    'input[name="identifier"]',
    'input[id="username"]',
    'input[id="identifier"]',
    'input[class*="email"]',
    'input[class*="username"]',
    'input[data-testid*="email"]',
    'input[data-testid*="username"]',
    'input[aria-label*="邮箱"]',
    'input[aria-label*="email"]',
    'input[type="text"]' // 最后尝试文本输入框
  ];

  let emailInput = null;
  let usedSelector = '';

  // 逐个尝试选择器
  console.log('开始尝试邮箱选择器...');
  for (const selector of emailSelectors) {
    console.log(`尝试选择器: ${selector}`);
    const elements = document.querySelectorAll(selector);
    console.log(`找到 ${elements.length} 个元素`);

    if (elements.length > 0) {
      // 如果有多个元素，选择第一个可见的
      for (const element of elements) {
        const isVisible = element.offsetParent !== null;
        const isEnabled = !element.disabled && !element.readOnly;
        console.log(`元素检查: visible=${isVisible}, enabled=${isEnabled}`);

        if (isVisible && isEnabled) {
          emailInput = element;
          usedSelector = selector;
          console.log(`✅ 找到可用的邮箱输入框: ${selector}`);
          break;
        }
      }
      if (emailInput) break;
    }
  }

  console.log('邮箱输入框查找完成，结果:', emailInput ? '找到' : '未找到');

  if (emailInput) {
    logToBackground(`找到邮箱输入框，使用选择器: ${usedSelector}`);
    updateStatus('working', '✅ 找到邮箱输入框，正在填写...');

    // 强制填写邮箱的多种方法
    const fillEmail = async () => {
      const email = config.email;
      logToBackground(`开始填写邮箱: ${email}`);

      // 方法1: 直接设置value
      emailInput.value = '';
      emailInput.focus();
      await new Promise(resolve => setTimeout(resolve, 100));

      emailInput.value = email;
      logToBackground(`方法1完成，当前值: "${emailInput.value}"`);

      // 方法2: 模拟用户输入
      emailInput.focus();
      emailInput.select();

      // 清空输入框
      emailInput.value = '';

      // 逐字符输入
      for (let i = 0; i < email.length; i++) {
        emailInput.value += email[i];
        emailInput.dispatchEvent(new KeyboardEvent('keydown', {
          key: email[i],
          bubbles: true
        }));
        emailInput.dispatchEvent(new KeyboardEvent('keypress', {
          key: email[i],
          bubbles: true
        }));
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new KeyboardEvent('keyup', {
          key: email[i],
          bubbles: true
        }));
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      logToBackground(`方法2完成，当前值: "${emailInput.value}"`);

      // 方法3: 使用React/Vue的方式
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(emailInput, email);

      // 触发React/Vue事件
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));

      logToBackground(`方法3完成，当前值: "${emailInput.value}"`);

      // 最终验证
      await new Promise(resolve => setTimeout(resolve, 200));

      const finalValue = emailInput.value;
      logToBackground(`最终验证 - 期望: "${email}", 实际: "${finalValue}"`);

      if (finalValue === email) {
        logToBackground(`✅ 邮箱填写成功: ${email}`);
        updateStatus('working', '✅ 邮箱地址已填写');

        // 额外验证：检查输入框是否真的显示了内容
        const displayValue = emailInput.getAttribute('value') || emailInput.value;
        logToBackground(`显示值验证: "${displayValue}"`);

        return true;
      } else {
        logToBackground(`❌ 邮箱填写失败，期望: "${email}", 实际: "${finalValue}"`);

        // 调试信息
        logToBackground(`输入框详细信息:`);
        logToBackground(`- tagName: ${emailInput.tagName}`);
        logToBackground(`- type: ${emailInput.type}`);
        logToBackground(`- name: ${emailInput.name}`);
        logToBackground(`- id: ${emailInput.id}`);
        logToBackground(`- className: ${emailInput.className}`);
        logToBackground(`- placeholder: ${emailInput.placeholder}`);
        logToBackground(`- disabled: ${emailInput.disabled}`);
        logToBackground(`- readOnly: ${emailInput.readOnly}`);
        logToBackground(`- style.display: ${emailInput.style.display}`);
        logToBackground(`- offsetParent: ${!!emailInput.offsetParent}`);

        updateStatus('error', '❌ 邮箱地址填写失败');
        return false;
      }
    };

    // 执行填写
    const success = await fillEmail();

    if (!success) {
      // 如果填写失败，尝试其他输入框
      logToBackground('尝试查找其他可能的邮箱输入框...');
      const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        if (input !== emailInput && input.offsetParent !== null) {
          logToBackground(`尝试输入框${i}: ${input.tagName} - ${input.className}`);
          input.value = config.email;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          await new Promise(resolve => setTimeout(resolve, 100));
          if (input.value === config.email) {
            logToBackground(`✅ 在输入框${i}中成功填写邮箱`);
            updateStatus('working', '✅ 邮箱地址已填写');
            emailInput = input; // 更新引用
            break;
          }
        }
      }
    }

    // 邮箱填写完成后的智能处理
    console.log('邮箱填写完成，开始智能处理...');
    updateStatus('working', '🔍 分析页面状态...');
    logToBackground('邮箱填写完成，开始智能处理');

    // 等待页面稳定
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 立即开始检测验证框
    console.log('邮箱填写完成，立即检测验证框...');

    // 模拟JSON中的"Verify you are human"监控
    console.log('开始监控"Verify you are human"元素的渲染和交互');
    logToBackground('开始监控"Verify you are human"元素的渲染和交互');

    await handleHumanVerification();

    // 先查找提交按钮
    console.log('查找提交按钮...');
    const submitButton = await findSubmitButton();
    if (!submitButton) {
      console.log('❌ 未找到提交按钮');
      updateStatus('error', '❌ 未找到提交按钮');
      return;
    }
    console.log('✅ 找到提交按钮');

    // 检查是否需要立即点击或等待人机验证
    const needsImmediateClick = await checkIfNeedsImmediateClick();

    if (needsImmediateClick) {
      console.log('🖱️ 检测到需要立即点击提交按钮');
      updateStatus('working', '🖱️ 点击提交按钮...');
      submitButton.click();
      logToBackground('立即点击了提交按钮');

      // 等待页面跳转
      setTimeout(() => {
        const currentUrl = window.location.href;
        if (currentUrl.includes('passwordless-email-challenge')) {
          updateStatus('working', '📧 跳转到验证码页面...');
        }
      }, 2000);
    } else {
      console.log('🤖 检测到需要等待人机验证');
      updateStatus('working', '🤖 等待人机验证...');
      // 启动人机验证监控
      await monitorSuccessAndSubmit(submitButton);
    }
  } else {
    updateStatus('error', '❌ 未找到邮箱输入框');
    logToBackground('未找到邮箱输入框，列出页面中的所有输入框:');

    // 调试信息：列出所有输入框
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach((input, index) => {
      logToBackground(`输入框${index}: type=${input.type}, name=${input.name}, id=${input.id}, placeholder=${input.placeholder}, class=${input.className}`);
    });

    // 也检查当前页面URL
    logToBackground(`当前页面URL: ${window.location.href}`);
  }
}

// 处理验证码页面
async function handleVerificationPage() {
  console.log('🔑 handleVerificationPage 函数开始执行');
  logToBackground('🔑 开始处理验证码页面');
  updateStatus('working', '📧 等待验证码发送...');

  // 等待验证码发送完成，避免获取到旧的验证码
  // 可以根据邮箱服务器的响应速度调整等待时间
  const waitTime = 20; // 等待20秒，确保新验证码已发送
  logToBackground(`⏰ 等待 ${waitTime} 秒确保验证码已发送...`);
  logToBackground('💡 这个等待是为了避免获取到旧的验证码');
  updateStatus('working', `⏰ 等待验证码发送 (${waitTime}秒)...`);

  // 倒计时显示
  for (let i = waitTime; i > 0; i--) {
    updateStatus('working', `⏰ 等待验证码发送 (${i}秒)...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  updateStatus('working', '📧 开始获取邮箱验证码...');
  logToBackground('⏰ 等待完成，开始获取验证码');

  // 获取验证码
  try {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'getVerificationCode' }, (response) => {
    if (response && response.success) {
      updateStatus('working', `✅ 获取到验证码: ${response.code}`);

      // 填写验证码 - 根据JSON分析更新选择器
      console.log('查找验证码输入框...');
      const codeSelectors = [
        '#code',                    // 从JSON: id="code"
        'input[name="code"]',       // 从JSON: name="code"
        'input[type="text"]',       // 通用选择器
        '.ca4402a24',              // 从JSON: className
        'input[id*="code"]',
        'input[name*="code"]',
        'input[placeholder*="验证码"]',
        'input[placeholder*="code"]'
      ];

      let codeInput = null;
      for (const selector of codeSelectors) {
        codeInput = document.querySelector(selector);
        if (codeInput) {
          console.log(`找到验证码输入框，使用选择器: ${selector}`);
          break;
        }
      }

      if (codeInput) {
        console.log(`填写验证码: ${response.code}`);
        codeInput.value = response.code;
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        codeInput.dispatchEvent(new Event('change', { bubbles: true }));

        console.log(`验证码填写完成，当前值: ${codeInput.value}`);
        updateStatus('working', '✅ 验证码已填写');
        logToBackground(`验证码已填写: ${response.code}`);

        // 查找并点击Continue按钮
        setTimeout(() => {
          console.log('查找验证码页面的提交按钮...');

          // 根据JSON分析，验证码页面的按钮文本是"Continue"
          const buttonSelectors = [
            'button[type="submit"]',
            'button:contains("Continue")',
            'button[name="action"]',
            '.c43e5964f', // 从JSON中的className
            'form button[type="submit"]'
          ];

          let loginButton = null;
          for (const selector of buttonSelectors) {
            try {
              if (selector.includes(':contains')) {
                // 手动查找包含Continue文本的按钮
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                  if (btn.textContent && btn.textContent.trim() === 'Continue') {
                    loginButton = btn;
                    console.log('找到Continue按钮');
                    break;
                  }
                }
              } else {
                loginButton = document.querySelector(selector);
              }
              if (loginButton) {
                console.log(`使用选择器找到按钮: ${selector}`);
                break;
              }
            } catch (e) {
              console.log(`选择器 ${selector} 失败: ${e.message}`);
            }
          }

          if (loginButton) {
            console.log('找到验证码提交按钮，准备点击');
            updateStatus('working', '🖱️ 点击Continue按钮...');
            loginButton.click();
            logToBackground('已点击验证码页面的Continue按钮');

            // 等待页面跳转
            setTimeout(() => {
              const currentUrl = window.location.href;
              console.log(`验证码提交后的URL: ${currentUrl}`);

              if (currentUrl.includes('app.augmentcode.com/account/subscription')) {
                console.log('🎉 验证码提交成功，直接跳转到订阅页面');
                logToBackground('🎉 登录完成！跳转到订阅页面');
                handleLoginCompletePage();
              } else if (currentUrl.includes('app.augmentcode.com')) {
                console.log('🎉 验证码提交成功，跳转到app页面');
                logToBackground('🎉 登录流程完成，跳转到app页面');

                // 等待一下再检查是否跳转到订阅页面
                setTimeout(() => {
                  const finalUrl = window.location.href;
                  if (finalUrl.includes('app.augmentcode.com/account/subscription')) {
                    handleLoginCompletePage();
                  } else {
                    updateStatus('ready', '🎉 登录成功！');
                  }
                }, 3000);
              } else if (currentUrl.includes('terms-accept') || currentUrl.includes('terms') || currentUrl.includes('agreement')) {
                console.log('📋 检测到条款页面，开始处理...');
                updateStatus('working', '📋 跳转到条款页面...');
                // 自动处理条款页面
                setTimeout(() => {
                  handleTermsAcceptPage();
                }, 1000);
              } else if (currentUrl.includes('auth.augmentcode.com')) {
                console.log('🔄 可能需要额外的认证步骤');
                updateStatus('working', '🔄 处理额外认证...');
                // 等待更长时间，可能页面还在加载
                setTimeout(() => {
                  const finalUrl = window.location.href;
                  console.log(`最终URL检查: ${finalUrl}`);
                  if (finalUrl.includes('app.augmentcode.com')) {
                    updateStatus('ready', '🎉 登录成功！');
                  } else {
                    // 可能是条款页面或其他认证页面
                    handleTermsAcceptPage();
                  }
                }, 3000);
              } else {
                console.log(`⏳ 等待页面跳转... 当前URL: ${currentUrl}`);
                updateStatus('info', '⏳ 等待页面跳转...');
              }
            }, 2000);
          } else {
            console.log('未找到验证码提交按钮，列出所有按钮:');
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach((btn, index) => {
              console.log(`按钮${index}: text="${btn.textContent?.trim()}", type="${btn.type}", class="${btn.className}"`);
            });
            updateStatus('error', '❌ 未找到Continue按钮');
          }
        }, 1000); // 增加等待时间到1秒
      } else {
        updateStatus('error', '❌ 未找到验证码输入框');
      }
    } else {
      updateStatus('error', '❌ 获取验证码失败: ' + (response?.error || '未知错误'));
    }
      });
    } else {
      updateStatus('error', '❌ 扩展上下文失效，无法获取验证码');
    }
  } catch (error) {
    updateStatus('error', '❌ 获取验证码异常: ' + error.message);
  }
}

// 专门处理Auth0邮箱登录页面
async function handleAuth0EmailPage(config) {
  updateStatus('working', '🔐 处理Auth0邮箱登录页面...');
  logToBackground(`Auth0页面处理开始，邮箱: ${config.email}`);

  // 等待页面完全加载
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Auth0特定的选择器
  const auth0Selectors = [
    'input[type="email"]',
    'input[name="username"]',
    'input[name="email"]',
    'input[id="username"]',
    'input[id="email"]',
    'input[placeholder*="email"]',
    'input[placeholder*="Email"]',
    'input[data-testid="email"]',
    'input[data-testid="username"]',
    '.auth0-lock-input',
    '.auth0-lock-input-email',
    'input[class*="email"]',
    'input[class*="username"]'
  ];

  let emailInput = null;
  let usedSelector = '';

  // 尝试找到邮箱输入框
  for (const selector of auth0Selectors) {
    const elements = document.querySelectorAll(selector);
    logToBackground(`尝试选择器 "${selector}": 找到 ${elements.length} 个元素`);

    if (elements.length > 0) {
      for (const element of elements) {
        const isVisible = element.offsetParent !== null;
        const isEnabled = !element.disabled && !element.readOnly;
        logToBackground(`元素检查: visible=${isVisible}, enabled=${isEnabled}, value="${element.value}"`);

        if (isVisible && isEnabled) {
          emailInput = element;
          usedSelector = selector;
          break;
        }
      }
      if (emailInput) break;
    }
  }

  if (emailInput) {
    logToBackground(`✅ 找到Auth0邮箱输入框: ${usedSelector}`);
    updateStatus('working', '📧 找到邮箱输入框，开始填写...');

    // 强制填写邮箱
    const success = await forceSetInputValue(emailInput, config.email);

    if (success) {
      updateStatus('working', '✅ 邮箱填写成功，查找继续按钮...');

      // 查找继续按钮
      await new Promise(resolve => setTimeout(resolve, 500));

      const continueSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[data-testid="continue"]',
        'button[data-testid="submit"]',
        '.auth0-lock-submit',
        'button:contains("Continue")',
        'button:contains("继续")',
        'button:contains("Next")',
        'button:contains("Submit")',
        'button[class*="submit"]',
        'button[class*="continue"]'
      ];

      let continueButton = null;
      for (const selector of continueSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          for (const element of elements) {
            if (element.offsetParent !== null && !element.disabled) {
              continueButton = element;
              logToBackground(`找到继续按钮: ${selector}`);
              break;
            }
          }
          if (continueButton) break;
        }
      }

      if (continueButton) {
        // 检查是否有人机验证
        const captchaElements = document.querySelectorAll('[data-testid*="captcha"], .captcha, .cf-turnstile, [id*="captcha"], [class*="captcha"], [class*="turnstile"]');

        if (captchaElements.length > 0) {
          updateStatus('working', '🤖 检测到人机验证，等待用户完成...');
          logToBackground(`检测到 ${captchaElements.length} 个人机验证元素`);

          // 等待人机验证完成
          await waitForCaptchaCompletion(continueButton);
        } else {
          updateStatus('working', '🖱️ 点击继续按钮...');
          continueButton.click();
          logToBackground('已点击继续按钮');
        }
      } else {
        updateStatus('info', '❓ 未找到继续按钮，可能需要手动点击');
        logToBackground('未找到继续按钮');
      }
    } else {
      updateStatus('error', '❌ 邮箱填写失败');
    }
  } else {
    updateStatus('error', '❌ 未找到Auth0邮箱输入框');
    logToBackground('Auth0页面分析失败，列出所有输入框:');

    const allInputs = document.querySelectorAll('input');
    allInputs.forEach((input, index) => {
      logToBackground(`输入框${index}: type=${input.type}, name=${input.name || 'N/A'}, id=${input.id || 'N/A'}, class="${input.className}", placeholder="${input.placeholder || 'N/A'}"`);
    });
  }
}

// 强制设置输入框值的通用函数
async function forceSetInputValue(input, value) {
  logToBackground(`开始强制设置输入框值: "${value}"`);

  try {
    // 方法1: 直接设置
    input.focus();
    input.value = '';
    await new Promise(resolve => setTimeout(resolve, 100));
    input.value = value;

    // 方法2: 使用原生setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(input, value);

    // 方法3: 模拟用户输入
    input.focus();
    input.select();

    // 触发所有可能的事件
    const events = ['focus', 'input', 'change', 'blur', 'keyup', 'keydown'];
    events.forEach(eventType => {
      input.dispatchEvent(new Event(eventType, { bubbles: true }));
    });

    // 特殊的React事件
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 300));

    const finalValue = input.value;
    logToBackground(`设置完成，最终值: "${finalValue}"`);

    return finalValue === value;
  } catch (error) {
    logToBackground(`设置输入框值失败: ${error.message}`);
    return false;
  }
}

// 等待人机验证完成
async function waitForCaptchaCompletion(submitButton) {
  updateStatus('working', '🤖 等待人机验证完成...');
  logToBackground('开始监控人机验证状态');

  return new Promise((resolve) => {
    let checkCount = 0;
    const maxChecks = 600; // 最多等待5分钟 (600 * 500ms)

    const checkCaptcha = () => {
      checkCount++;

      // 检查各种可能的成功标志
      const successIndicators = [
        // 最重要：检查success-text元素
        () => {
          const successElement = document.querySelector('#success-text');
          if (successElement && successElement.textContent.includes('Success!')) {
            logToBackground('✅ 找到success-text元素，内容: ' + successElement.textContent);
            return true;
          }
          return false;
        },

        // 检查页面是否显示"Success!"文本
        () => document.body.textContent.includes('Success!'),

        // Cloudflare Turnstile
        () => document.querySelector('.cf-turnstile[data-state="success"]'),
        () => document.querySelector('[data-testid="captcha"][data-state="success"]'),

        // 通用成功标志
        () => document.querySelector('.captcha-success'),

        // 检查按钮是否变为可用
        () => !submitButton.disabled && submitButton.offsetParent !== null,

        // 检查Turnstile widget状态
        () => {
          const widgets = document.querySelectorAll('.cf-turnstile');
          for (const widget of widgets) {
            if (widget.querySelector('input[name="cf-turnstile-response"]')?.value) {
              return true;
            }
          }
          return false;
        }
      ];

      // 检查是否有任何成功标志
      for (let i = 0; i < successIndicators.length; i++) {
        try {
          if (successIndicators[i]()) {
            logToBackground(`✅ 人机验证完成 (检测方法${i + 1})`);
            updateStatus('working', '✅ 人机验证完成，准备提交...');

            // 等待一下确保状态稳定
            setTimeout(() => {
              updateStatus('working', '🖱️ 点击提交按钮...');
              submitButton.click();
              logToBackground('已点击提交按钮');
              resolve();
            }, 1000);
            return;
          }
        } catch (error) {
          // 忽略检测错误，继续下一个方法
        }
      }

      // 如果超时，提示用户
      if (checkCount >= maxChecks) {
        logToBackground('❌ 人机验证等待超时');
        updateStatus('info', '⏰ 人机验证等待超时，请手动完成');
        resolve();
        return;
      }

      // 每10秒更新一次状态和检查详情
      if (checkCount % 20 === 0) { // 20 * 500ms = 10秒
        const remainingTime = Math.ceil((maxChecks - checkCount) / 2); // 2 checks per second
        updateStatus('working', `🤖 等待人机验证... (${remainingTime}s)`);
        logToBackground(`等待人机验证中... (${checkCount}/${maxChecks})`);

        // 详细检查当前页面状态
        const successElement = document.querySelector('#success-text');
        if (successElement) {
          logToBackground(`找到success-text元素，内容: "${successElement.textContent}", 可见: ${successElement.offsetParent !== null}`);
        } else {
          logToBackground('未找到success-text元素');
        }

        // 检查按钮状态
        logToBackground(`提交按钮状态: disabled=${submitButton.disabled}, visible=${submitButton.offsetParent !== null}`);
      }

      // 继续检查（每500ms检查一次，更及时）
      setTimeout(checkCaptcha, 500);
    };

    // 开始检查
    checkCaptcha();
  });
}

// 查找提交按钮的通用函数
async function findSubmitButton() {
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    '.next-btn',
    '.continue-btn',
    '.submit-btn',
    'button:contains("下一步")',
    'button:contains("Continue")',
    'button:contains("Next")',
    'button:contains("提交")',
    'button:contains("Submit")',
    'button[class*="submit"]',
    'button[class*="next"]',
    'button[class*="continue"]',
    '[data-testid*="submit"]',
    '[data-testid*="next"]',
    '[data-testid*="continue"]'
  ];

  for (const selector of submitSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      for (const element of elements) {
        if (element.offsetParent !== null && !element.disabled) {
          logToBackground(`找到提交按钮，使用选择器: ${selector}`);
          return element;
        }
      }
    }
  }

  logToBackground('未找到可用的提交按钮');
  return null;
}

// 专门处理人机验证的函数
async function handleHumanVerification() {
  console.log('🤖 开始处理人机验证...');
  logToBackground('🤖 开始处理人机验证');
  updateStatus('working', '🤖 处理人机验证...');

  // 根据JSON分析，首先等待验证系统加载
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 策略1: 监控验证容器并等待自动完成
  const success1 = await monitorVerificationContainers();
  if (success1) return true;

  // 策略2: 查找并点击验证容器（如果需要手动交互）
  const success2 = await clickVerificationContainer();
  if (success2) return true;

  // 策略3: 扫描特定区域查找验证框
  const success3 = await scanForVerificationBox();
  if (success3) return true;

  // 策略4: 查找iframe并点击
  const success4 = await clickVerificationIframe();
  if (success4) return true;

  // 策略5: 模拟用户行为点击
  const success5 = await simulateUserVerification();
  if (success5) return true;

  console.log('所有人机验证策略都已尝试');
  return false;
}

// 新策略1: 监控验证容器并等待自动完成
async function monitorVerificationContainers() {
  console.log('👁️ 策略1: 监控验证容器自动完成...');

  // 查找验证容器
  const containerSelectors = [
    '.ulp-captcha-container',
    '.ulp-auth0-v2-captcha',
    '#ulp-auth0-v2-captcha',
    '.g-recaptcha',
    '#recaptcha-token',
    '.rc-anchor'
  ];

  let foundContainer = false;
  for (const selector of containerSelectors) {
    const container = document.querySelector(selector);
    if (container) {
      console.log(`找到验证容器: ${selector}`);
      foundContainer = true;
      break;
    }
  }

  if (!foundContainer) {
    console.log('未找到验证容器');
    return false;
  }

  // 监控验证完成状态，最多等待30秒
  console.log('开始监控验证自动完成...');
  for (let i = 0; i < 60; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));

    // 检查验证是否完成
    if (await isVerificationComplete()) {
      console.log(`✅ 验证在第${i * 0.5}秒自动完成`);
      logToBackground('✅ 人机验证自动完成');
      return true;
    }

    // 每5秒输出一次状态
    if (i % 10 === 0) {
      console.log(`等待验证完成... ${i * 0.5}秒`);
    }
  }

  console.log('验证监控超时');
  return false;
}

// 策略1: 点击验证容器
async function clickVerificationContainer() {
  console.log('🎯 策略1: 查找验证容器...');

  const containerSelectors = [
    // Cloudflare Turnstile
    '.cf-turnstile',
    '[data-sitekey]',
    '.cloudflare-turnstile',

    // Auth0验证
    '.ulp-captcha-container',
    '.ulp-auth0-v2-captcha',
    '#ulp-auth0-v2-captcha',

    // reCAPTCHA
    '.g-recaptcha',
    '.recaptcha-checkbox',
    '.rc-anchor',

    // 通用验证
    '.captcha-container',
    '.verification-container',
    '[class*="captcha"]',
    '[id*="captcha"]'
  ];

  for (const selector of containerSelectors) {
    try {
      const container = document.querySelector(selector);
      if (container) {
        const rect = container.getBoundingClientRect();
        console.log(`找到验证容器: ${selector}, 位置: ${rect.left}, ${rect.top}, 大小: ${rect.width}x${rect.height}`);

        if (rect.width > 10 && rect.height > 10) {
          // 滚动到容器位置
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(resolve => setTimeout(resolve, 1000));

          // 点击容器
          container.click();

          // 触发多种事件
          const events = ['mousedown', 'mouseup', 'click'];
          for (const eventType of events) {
            const event = new MouseEvent(eventType, {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2
            });
            container.dispatchEvent(event);
          }

          console.log(`已点击验证容器: ${selector}`);
          logToBackground(`已点击验证容器: ${selector}`);

          // 等待验证处理
          await new Promise(resolve => setTimeout(resolve, 3000));

          // 检查是否验证完成
          if (await isVerificationComplete()) {
            console.log('✅ 验证容器点击成功');
            return true;
          }
        }
      }
    } catch (e) {
      console.log(`容器选择器 ${selector} 失败:`, e.message);
    }
  }

  return false;
}

// 策略2: 扫描特定区域查找验证框
async function scanForVerificationBox() {
  console.log('🔍 策略2: 扫描页面区域查找验证框...');

  // 定义扫描区域（基于常见的验证框位置）
  const scanAreas = [
    { startX: 10, endX: 100, startY: 10, endY: 100, step: 10, name: "左上角区域" },
    { startX: 200, endX: 400, startY: 200, endY: 400, step: 20, name: "中心区域" },
    { startX: 10, endX: 200, startY: 100, endY: 300, step: 15, name: "左侧区域" }
  ];

  for (const area of scanAreas) {
    console.log(`扫描${area.name}...`);

    for (let x = area.startX; x <= area.endX; x += area.step) {
      for (let y = area.startY; y <= area.endY; y += area.step) {
        const element = document.elementFromPoint(x, y);

        if (element && element !== document.body && element !== document.documentElement) {
          const className = (element.className || '').toString().toLowerCase();
          const id = (element.id || '').toLowerCase();
          const tagName = element.tagName.toLowerCase();

          // 检查是否是验证相关元素
          if (
            className.includes('captcha') ||
            className.includes('turnstile') ||
            className.includes('recaptcha') ||
            className.includes('verification') ||
            id.includes('captcha') ||
            id.includes('turnstile') ||
            tagName === 'iframe'
          ) {
            console.log(`在(${x}, ${y})发现验证元素: ${tagName}, class: ${className}, id: ${id}`);

            // 点击该元素
            element.click();

            // 创建精确的点击事件
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y
            });
            element.dispatchEvent(clickEvent);

            console.log(`已点击扫描发现的元素 (${x}, ${y})`);
            logToBackground(`已点击扫描发现的元素 (${x}, ${y})`);

            // 等待验证处理
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 检查是否验证完成
            if (await isVerificationComplete()) {
              console.log('✅ 扫描点击成功');
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

// 策略3: 查找iframe并点击
async function clickVerificationIframe() {
  console.log('🖼️ 策略3: 查找验证iframe...');

  const iframes = document.querySelectorAll('iframe');
  console.log(`页面上共有 ${iframes.length} 个iframe`);

  for (const iframe of iframes) {
    const src = iframe.src || '';
    const title = iframe.title || '';

    // 检查是否是验证相关的iframe
    if (
      src.includes('cloudflare') ||
      src.includes('turnstile') ||
      src.includes('recaptcha') ||
      src.includes('captcha') ||
      title.includes('captcha') ||
      title.includes('verification')
    ) {
      console.log(`找到验证iframe: src="${src.substring(0, 100)}...", title="${title}"`);

      const rect = iframe.getBoundingClientRect();
      console.log(`Iframe位置: x=${rect.left}, y=${rect.top}, 大小: ${rect.width}x${rect.height}`);

      if (rect.width > 10 && rect.height > 10) {
        // 滚动到iframe位置
        iframe.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 尝试多个点击位置
        const clickPositions = [
          { x: rect.left + 30, y: rect.top + 30, desc: "左上角" },
          { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, desc: "中心" },
          { x: rect.left + 20, y: rect.top + 20, desc: "左上小偏移" },
          { x: rect.left + 40, y: rect.top + 40, desc: "左上大偏移" }
        ];

        for (const pos of clickPositions) {
          console.log(`尝试点击iframe${pos.desc}: (${pos.x}, ${pos.y})`);

          // 在指定位置查找元素并点击
          const elementAtPoint = document.elementFromPoint(pos.x, pos.y);
          if (elementAtPoint) {
            elementAtPoint.click();

            // 创建点击事件
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: pos.x,
              clientY: pos.y
            });
            elementAtPoint.dispatchEvent(clickEvent);

            // 等待验证处理
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 检查是否验证完成
            if (await isVerificationComplete()) {
              console.log('✅ iframe点击成功');
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

// 策略4: 模拟用户行为点击
async function simulateUserVerification() {
  console.log('👤 策略4: 模拟用户验证行为...');

  // 基于JSON分析的成功坐标点
  const knownCoordinates = [
    { x: 28, y: 37, desc: "JSON记录的成功位置" },
    { x: 30, y: 30, desc: "左上角变体1" },
    { x: 25, y: 40, desc: "左上角变体2" },
    { x: 35, y: 35, desc: "左上角变体3" },
    { x: 50, y: 50, desc: "扩展区域1" },
    { x: 20, y: 20, desc: "最小偏移" }
  ];

  for (const coord of knownCoordinates) {
    console.log(`🎯 尝试已知成功坐标: (${coord.x}, ${coord.y}) - ${coord.desc}`);

    // 查找该坐标位置的元素
    const elementAtPoint = document.elementFromPoint(coord.x, coord.y);
    if (elementAtPoint) {
      console.log(`坐标位置元素: ${elementAtPoint.tagName}, class: ${elementAtPoint.className}, id: ${elementAtPoint.id}`);

      // 模拟真实的用户点击序列
      const events = [
        { type: 'mouseover', delay: 100 },
        { type: 'mousedown', delay: 50 },
        { type: 'mouseup', delay: 50 },
        { type: 'click', delay: 100 }
      ];

      for (const event of events) {
        const mouseEvent = new MouseEvent(event.type, {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: coord.x,
          clientY: coord.y,
          button: 0
        });

        elementAtPoint.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, event.delay));
      }

      console.log(`已执行坐标点击序列 (${coord.x}, ${coord.y})`);
      logToBackground(`已执行坐标点击序列 (${coord.x}, ${coord.y})`);

      // 等待验证处理
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 检查是否验证完成
      if (await isVerificationComplete()) {
        console.log('✅ 模拟用户点击成功');
        return true;
      }
    } else {
      console.log(`坐标 (${coord.x}, ${coord.y}) 位置没有元素`);
    }
  }

  return false;
}

// 检查验证是否完成 - 根据JSON分析增强
async function isVerificationComplete() {
  // 检查captcha字段 - 主要指标
  const captchaInput = document.querySelector('input[name="captcha"]');
  if (captchaInput && captchaInput.value && captchaInput.value.length > 10) {
    console.log(`✅ captcha字段已填充: ${captchaInput.value.substring(0, 20)}...`);
    return true;
  }

  // 检查reCAPTCHA token - 从JSON发现的重要指标
  const recaptchaToken = document.querySelector('#recaptcha-token');
  if (recaptchaToken && recaptchaToken.value && recaptchaToken.value.length > 10) {
    console.log(`✅ reCAPTCHA token已生成: ${recaptchaToken.value.substring(0, 20)}...`);
    return true;
  }

  // 检查g-recaptcha-response
  const gRecaptchaResponse = document.querySelector('#g-recaptcha-response');
  if (gRecaptchaResponse && gRecaptchaResponse.value && gRecaptchaResponse.value.length > 10) {
    console.log(`✅ g-recaptcha-response已填充: ${gRecaptchaResponse.value.substring(0, 20)}...`);
    return true;
  }

  // 检查Auth0验证状态
  const auth0Captcha = document.querySelector('#ulp-auth0-v2-captcha');
  if (auth0Captcha) {
    const style = window.getComputedStyle(auth0Captcha);
    if (style.display === 'none' || style.visibility === 'hidden') {
      console.log('✅ Auth0验证容器已隐藏，可能验证完成');
      // 再次检查captcha字段
      if (captchaInput && captchaInput.value) {
        return true;
      }
    }
  }

  // 检查Success文本
  const pageText = document.body.textContent || '';
  if (pageText.includes('Success!') || pageText.includes('验证成功') || pageText.includes('Verified')) {
    console.log('✅ 页面显示验证成功');
    return true;
  }

  // 检查是否有"Recaptcha 要求验证"文本消失
  const recaptchaStatus = document.querySelector('#recaptcha-accessible-status');
  if (recaptchaStatus) {
    const statusText = recaptchaStatus.textContent || '';
    if (!statusText.includes('要求验证') && !statusText.includes('required')) {
      console.log('✅ reCAPTCHA状态文本已变化');
      return true;
    }
  }

  return false;
}

// 处理Cloudflare Turnstile验证
async function handleCloudflareChallenge() {
  console.log('🔍 检查Cloudflare Turnstile验证...');
  logToBackground('🔍 开始检查Cloudflare Turnstile验证');

  // 首先分析页面结构
  console.log('=== 页面结构分析 ===');
  console.log(`页面URL: ${window.location.href}`);
  console.log(`页面标题: ${document.title}`);

  // 列出所有iframe
  const allIframes = document.querySelectorAll('iframe');
  console.log(`页面上共有 ${allIframes.length} 个iframe:`);
  allIframes.forEach((iframe, index) => {
    console.log(`Iframe${index}: src="${iframe.src}", title="${iframe.title}", class="${iframe.className}"`);
  });

  // 等待验证框加载
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 首先尝试动态检测验证框位置
  console.log('🎯 动态检测验证框位置...');
  await detectAndClickVerificationBox();

  // 如果动态检测失败，再尝试固定坐标
  console.log('🎯 尝试点击JSON中记录的验证框坐标位置...');
  await clickVerificationCoordinates();

  // 查找各种验证相关的元素 - 根据JSON更新
  const verificationSelectors = [
    // Cloudflare验证
    'iframe[src*="challenges.cloudflare.com"]',
    'iframe[src*="turnstile"]',
    'iframe[title*="cloudflare"]',
    'iframe[title*="turnstile"]',
    '.cf-turnstile',
    '[data-sitekey]',
    // Auth0验证 - 从JSON发现
    '#ulp-auth0-v2-captcha',
    '.ulp-auth0-v2-captcha',
    '.ulp-captcha',
    '.ulp-captcha-container',
    // reCAPTCHA验证
    '.g-recaptcha',
    '#g-recaptcha-response',
    'iframe[src*="recaptcha"]',
    'iframe[title*="recaptcha"]'
  ];

  let challengeElement = null;
  for (const selector of verificationSelectors) {
    challengeElement = document.querySelector(selector);
    if (challengeElement) {
      console.log(`找到验证元素: ${selector}`);
      break;
    }
  }

  if (challengeElement) {
    console.log('🤖 检测到Cloudflare验证，尝试自动处理...');
    updateStatus('working', '🤖 处理人机验证...');

    // 如果是iframe，尝试点击iframe区域
    if (challengeElement.tagName === 'IFRAME') {
      console.log('点击Cloudflare验证iframe');

      // 获取iframe的位置和大小
      const rect = challengeElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // 创建点击事件
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: centerX,
        clientY: centerY
      });

      // 点击iframe
      challengeElement.dispatchEvent(clickEvent);

      // 也尝试点击iframe的父元素
      if (challengeElement.parentElement) {
        challengeElement.parentElement.click();
      }

      logToBackground('已点击Cloudflare验证iframe');
    } else {
      // 如果是其他元素，直接点击
      console.log('点击Cloudflare验证元素');
      challengeElement.click();
      logToBackground('已点击Cloudflare验证元素');
    }

    // 等待验证处理
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 检查是否有需要点击的验证框
    await checkForVerificationCheckbox();

  } else {
    console.log('未检测到Cloudflare验证元素');

    // 尝试查找任何可能的验证框
    await checkForVerificationCheckbox();
  }
}

// 检查并点击验证框
async function checkForVerificationCheckbox() {
  console.log('🔍 查找验证框...');
  logToBackground('🔍 开始查找验证框');

  // 首先分析页面上的所有元素
  console.log('=== 验证框检测分析 ===');

  // 列出所有可能的验证相关元素
  const allElements = document.querySelectorAll('*');
  const verificationElements = [];

  allElements.forEach((el, index) => {
    if (index < 1000) { // 只检查前1000个元素
      const tagName = el.tagName.toLowerCase();
      const className = (el.className || '').toString().toLowerCase();
      const id = (el.id || '').toLowerCase();
      const text = (el.textContent || '').toLowerCase();

      // 检查是否包含验证相关的关键词
      if (
        tagName === 'input' ||
        className.includes('captcha') ||
        className.includes('turnstile') ||
        className.includes('cloudflare') ||
        className.includes('checkbox') ||
        className.includes('verification') ||
        id.includes('captcha') ||
        id.includes('turnstile') ||
        id.includes('cloudflare') ||
        text.includes('verify') ||
        text.includes('captcha') ||
        text.includes('human') ||
        text.includes('robot')
      ) {
        verificationElements.push({
          tag: tagName,
          id: el.id,
          class: el.className,
          text: text.substring(0, 50),
          type: el.type || '',
          checked: el.checked || false,
          visible: el.offsetParent !== null
        });
      }
    }
  });

  console.log(`找到 ${verificationElements.length} 个可能的验证相关元素:`);
  verificationElements.forEach((el, index) => {
    console.log(`Element${index}: <${el.tag}> id="${el.id}" class="${el.class}" type="${el.type}" checked=${el.checked} visible=${el.visible} text="${el.text}"`);
  });

  // 查找可能的验证框选择器 - 根据JSON更新
  const checkboxSelectors = [
    'input[type="checkbox"]',
    '.cf-turnstile input',
    '.captcha-checkbox',
    '.verification-checkbox',
    '[role="checkbox"]',
    '.rc-anchor-checkbox',
    '.recaptcha-checkbox',
    // Auth0验证相关 - 从JSON发现
    '.ulp-captcha input',
    '.ulp-auth0-v2-captcha input',
    '#ulp-auth0-v2-captcha input',
    // 添加更多可能的选择器
    'iframe[src*="cloudflare"] + input',
    'div[class*="turnstile"] input',
    'div[class*="captcha"] input',
    '[data-testid*="captcha"]',
    '[data-testid*="turnstile"]'
  ];

  // 方法1: 使用选择器查找
  for (const selector of checkboxSelectors) {
    const checkboxes = document.querySelectorAll(selector);
    console.log(`选择器 "${selector}" 找到 ${checkboxes.length} 个元素`);

    for (const checkbox of checkboxes) {
      // 检查是否可见且未选中
      const style = window.getComputedStyle(checkbox);
      const isVisible = style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       checkbox.offsetParent !== null;

      console.log(`检查元素: tag=${checkbox.tagName}, type=${checkbox.type}, checked=${checkbox.checked}, visible=${isVisible}`);

      // 只处理真正的可见checkbox，排除hidden类型
      if (isVisible && checkbox.type === 'checkbox' && checkbox.type !== 'hidden' && !checkbox.checked) {
        console.log(`找到未选中的验证框: ${selector}`);
        logToBackground(`找到未选中的验证框: ${selector}`);

        // 滚动到元素位置
        checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(resolve => setTimeout(resolve, 500));

        // 点击验证框
        checkbox.click();

        // 触发事件
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        checkbox.dispatchEvent(new Event('click', { bubbles: true }));

        console.log('已点击验证框');
        logToBackground('已自动点击人机验证框');

        // 验证是否真的被选中了
        await new Promise(resolve => setTimeout(resolve, 500));
        if (checkbox.checked) {
          console.log('✅ 验证框已成功选中');
          logToBackground('✅ 验证框已成功选中');
          return true;
        } else {
          console.log('❌ 验证框点击后仍未选中');
          logToBackground('❌ 验证框点击后仍未选中');
        }
      }
    }
  }

  // 方法2: 尝试点击任何可见的iframe区域（可能包含验证）
  console.log('尝试点击iframe区域...');
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    const src = iframe.src || '';
    if (src.includes('cloudflare') || src.includes('turnstile') || src.includes('captcha')) {
      console.log(`尝试点击验证iframe: ${src.substring(0, 100)}...`);

      // 滚动到iframe位置
      iframe.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 获取iframe的位置和大小
      const rect = iframe.getBoundingClientRect();
      console.log(`Iframe位置: x=${rect.left}, y=${rect.top}, width=${rect.width}, height=${rect.height}`);

      // 如果iframe太小，可能不是验证框
      if (rect.width < 50 || rect.height < 50) {
        console.log('Iframe太小，跳过');
        continue;
      }

      // 尝试多个点击位置
      const clickPositions = [
        { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, // 中心
        { x: rect.left + 30, y: rect.top + 30 }, // 左上角附近
        { x: rect.left + rect.width - 30, y: rect.top + 30 }, // 右上角附近
        { x: rect.left + 30, y: rect.top + rect.height / 2 }, // 左中
      ];

      for (const pos of clickPositions) {
        console.log(`尝试点击位置: x=${pos.x}, y=${pos.y}`);

        // 在指定位置查找元素并点击
        const elementAtPoint = document.elementFromPoint(pos.x, pos.y);
        if (elementAtPoint) {
          console.log(`找到元素: ${elementAtPoint.tagName}, class: ${elementAtPoint.className}`);
          elementAtPoint.click();

          // 也尝试触发鼠标事件
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: pos.x,
            clientY: pos.y
          });
          elementAtPoint.dispatchEvent(clickEvent);
        }

        // 等待一下看是否有反应
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 检查captcha是否有值了
        const captchaInput = document.querySelector('input[name="captcha"]');
        if (captchaInput && captchaInput.value && captchaInput.value.length > 10) {
          console.log('✅ 点击iframe后验证完成');
          logToBackground('✅ 点击iframe后验证完成');
          return true;
        }
      }

      console.log('已尝试点击验证iframe的多个位置');
      logToBackground('已尝试点击验证iframe的多个位置');
    }
  }

  // 方法3: 查找真正的验证框（更严格的条件）
  console.log('查找真正的验证框...');

  // 查找所有可能包含验证框的容器
  const containers = document.querySelectorAll('div, form, section');
  for (const container of containers) {
    const className = (container.className || '').toString().toLowerCase();
    const id = (container.id || '').toLowerCase();

    // 只查找明确包含验证相关类名的容器
    if (className.includes('captcha') || className.includes('turnstile') ||
        className.includes('cloudflare') || id.includes('captcha') ||
        id.includes('turnstile')) {

      console.log(`检查验证容器: class="${className}", id="${id}"`);

      // 在容器内查找所有可点击元素
      const clickableElements = container.querySelectorAll('*');
      for (const element of clickableElements) {
        const rect = element.getBoundingClientRect();

        // 查找合适大小的可点击元素
        if (rect.width > 20 && rect.height > 20 && rect.width < 100 && rect.height < 100) {
          console.log(`尝试点击验证容器内的元素: tag=${element.tagName}, size=${rect.width}x${rect.height}`);

          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(resolve => setTimeout(resolve, 500));

          element.click();

          // 等待验证处理
          await new Promise(resolve => setTimeout(resolve, 2000));

          // 检查是否验证完成
          const captchaInput = document.querySelector('input[name="captcha"]');
          if (captchaInput && captchaInput.value && captchaInput.value.length > 10) {
            console.log('✅ 点击验证容器元素后验证完成');
            logToBackground('✅ 点击验证容器元素后验证完成');
            return true;
          }
        }
      }
    }
  }

  console.log('未找到需要点击的验证框');
  logToBackground('未找到需要点击的验证框');
  return false;
}

// 根据JSON记录点击特定坐标位置
async function clickVerificationCoordinates() {
  console.log('🎯 尝试点击JSON记录的验证框坐标...');

  // 根据JSON分析的关键坐标点
  const verificationCoordinates = [
    { x: 28, y: 37, description: "JSON记录的主要验证点击位置" },
    { x: 30, y: 30, description: "左上角验证框变体1" },
    { x: 25, y: 40, description: "左上角验证框变体2" },
    { x: 35, y: 35, description: "左上角验证框变体3" },
    { x: 50, y: 50, description: "稍大范围的验证区域" }
  ];

  for (const coord of verificationCoordinates) {
    console.log(`🖱️ 尝试点击坐标: x=${coord.x}, y=${coord.y} (${coord.description})`);

    // 查找该坐标位置的元素
    const elementAtPoint = document.elementFromPoint(coord.x, coord.y);
    if (elementAtPoint) {
      console.log(`找到坐标位置的元素: ${elementAtPoint.tagName}, class: ${elementAtPoint.className}, id: ${elementAtPoint.id}`);

      // 创建精确的点击事件
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: coord.x,
        clientY: coord.y,
        button: 0
      });

      // 点击元素
      elementAtPoint.click();
      elementAtPoint.dispatchEvent(clickEvent);

      // 也尝试鼠标按下和释放事件
      const mouseDownEvent = new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: coord.x,
        clientY: coord.y,
        button: 0
      });

      const mouseUpEvent = new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: coord.x,
        clientY: coord.y,
        button: 0
      });

      elementAtPoint.dispatchEvent(mouseDownEvent);
      await new Promise(resolve => setTimeout(resolve, 100));
      elementAtPoint.dispatchEvent(mouseUpEvent);

      console.log(`已点击坐标 (${coord.x}, ${coord.y})`);
      logToBackground(`已点击验证坐标 (${coord.x}, ${coord.y})`);

      // 等待验证处理
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 检查是否验证完成
      const captchaInput = document.querySelector('input[name="captcha"]');
      if (captchaInput && captchaInput.value && captchaInput.value.length > 10) {
        console.log('✅ 坐标点击后验证完成');
        logToBackground('✅ 坐标点击后验证完成');
        return true;
      }

      // 检查页面是否有变化
      const pageText = document.body.textContent || '';
      if (pageText.includes('Success!') || pageText.includes('验证成功')) {
        console.log('✅ 坐标点击后页面显示成功');
        logToBackground('✅ 坐标点击后页面显示成功');
        return true;
      }
    } else {
      console.log(`坐标 (${coord.x}, ${coord.y}) 位置没有找到元素`);
    }
  }

  console.log('所有坐标点击尝试完成');
  return false;
}

// 动态检测并点击验证框
async function detectAndClickVerificationBox() {
  console.log('🔍 开始动态检测验证框位置...');

  // 方法1: 查找所有可能的验证容器并分析其位置
  const verificationContainers = [
    '.ulp-captcha-container',
    '.ulp-auth0-v2-captcha',
    '#ulp-auth0-v2-captcha',
    '.cf-turnstile',
    '.g-recaptcha',
    '.captcha-container',
    '[data-sitekey]'
  ];

  for (const selector of verificationContainers) {
    const container = document.querySelector(selector);
    if (container) {
      const rect = container.getBoundingClientRect();
      console.log(`找到验证容器: ${selector}, 位置: x=${rect.left}, y=${rect.top}, 大小: ${rect.width}x${rect.height}`);

      if (rect.width > 0 && rect.height > 0) {
        // 尝试点击容器的多个位置
        const clickPositions = [
          { x: rect.left + 20, y: rect.top + 20, desc: "左上角" },
          { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, desc: "中心" },
          { x: rect.left + 30, y: rect.top + 30, desc: "左上偏移" },
          { x: rect.left + 15, y: rect.top + 15, desc: "左上小偏移" }
        ];

        for (const pos of clickPositions) {
          console.log(`🖱️ 尝试点击验证容器${pos.desc}: (${pos.x}, ${pos.y})`);

          const elementAtPoint = document.elementFromPoint(pos.x, pos.y);
          if (elementAtPoint) {
            console.log(`点击位置的元素: ${elementAtPoint.tagName}, class: ${elementAtPoint.className}`);

            // 创建点击事件
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: pos.x,
              clientY: pos.y
            });

            elementAtPoint.click();
            elementAtPoint.dispatchEvent(clickEvent);

            // 等待验证处理
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 检查是否验证完成
            if (await checkVerificationComplete()) {
              console.log('✅ 动态检测点击成功');
              logToBackground('✅ 动态检测点击成功');
              return true;
            }
          }
        }
      }
    }
  }

  // 方法2: 扫描页面左上角区域寻找可点击元素
  console.log('🔍 扫描页面左上角区域...');
  for (let x = 10; x <= 100; x += 10) {
    for (let y = 10; y <= 100; y += 10) {
      const element = document.elementFromPoint(x, y);
      if (element && element.tagName !== 'BODY' && element.tagName !== 'HTML') {
        const className = (element.className || '').toString().toLowerCase();
        const id = (element.id || '').toLowerCase();

        // 检查是否是验证相关元素
        if (className.includes('captcha') || className.includes('turnstile') ||
            className.includes('recaptcha') || id.includes('captcha') ||
            element.tagName === 'IFRAME') {

          console.log(`🎯 在(${x}, ${y})找到可能的验证元素: ${element.tagName}, class: ${className}, id: ${id}`);

          // 点击该元素
          element.click();

          // 创建精确的点击事件
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
          });
          element.dispatchEvent(clickEvent);

          console.log(`已点击扫描发现的元素 (${x}, ${y})`);
          logToBackground(`已点击扫描发现的元素 (${x}, ${y})`);

          // 等待验证处理
          await new Promise(resolve => setTimeout(resolve, 2000));

          // 检查是否验证完成
          if (await checkVerificationComplete()) {
            console.log('✅ 扫描点击成功');
            logToBackground('✅ 扫描点击成功');
            return true;
          }
        }
      }
    }
  }

  console.log('动态检测未找到验证框');
  return false;
}

// 检查验证是否完成
async function checkVerificationComplete() {
  // 检查captcha字段
  const captchaInput = document.querySelector('input[name="captcha"]');
  if (captchaInput && captchaInput.value && captchaInput.value.length > 10) {
    return true;
  }

  // 检查Success文本
  const pageText = document.body.textContent || '';
  if (pageText.includes('Success!') || pageText.includes('验证成功')) {
    return true;
  }

  // 检查reCAPTCHA token
  const recaptchaToken = document.querySelector('#recaptcha-token');
  if (recaptchaToken && recaptchaToken.value && recaptchaToken.value.length > 10) {
    return true;
  }

  return false;
}

// 启动持续监控验证框
function startContinuousVerificationMonitoring() {
  console.log('🔄 启动持续验证框监控...');
  logToBackground('🔄 启动持续验证框监控');

  let monitorCount = 0;
  const maxMonitors = 60; // 最多监控60次（30秒）

  const monitorInterval = setInterval(async () => {
    monitorCount++;
    console.log(`🔍 验证框监控第 ${monitorCount} 次`);

    // 检查是否找到并点击了验证框
    const found = await handleHumanVerification();

    // 检查是否已经完成验证（captcha字段有值）
    const captchaInput = document.querySelector('input[name="captcha"]');
    const isVerified = captchaInput && captchaInput.value && captchaInput.value.length > 10;

    if (isVerified) {
      console.log('✅ 验证已完成，停止监控');
      clearInterval(monitorInterval);
      return;
    }

    if (found && !isVerified) {
      console.log('🔄 找到验证框但验证未完成，继续监控');
    }

    // 达到最大监控次数
    if (monitorCount >= maxMonitors) {
      console.log('⏰ 验证框监控超时，停止监控');
      logToBackground('⏰ 验证框监控超时');
      clearInterval(monitorInterval);
      return;
    }
  }, 500); // 每500ms检查一次
}

// 检查是否需要立即点击提交按钮
async function checkIfNeedsImmediateClick() {
  console.log('🔍 检查是否需要立即点击...');

  // 方法1: 检查是否已经有captcha值
  const captchaInput = document.querySelector('input[name="captcha"]');
  if (captchaInput && captchaInput.value && captchaInput.value.length > 10) {
    console.log('✅ 检测到captcha已有值，需要立即点击');
    return true;
  }

  // 方法2: 检查是否没有人机验证元素
  const captchaElements = document.querySelectorAll([
    '[data-testid*="captcha"]',
    '.captcha',
    '.cf-turnstile',
    '[id*="captcha"]',
    '[class*="captcha"]',
    '[class*="turnstile"]',
    '.g-recaptcha',
    '[data-sitekey]',
    'iframe[src*="captcha"]',
    'iframe[src*="recaptcha"]',
    'iframe[src*="turnstile"]',
    'iframe[src*="challenges.cloudflare.com"]'
  ].join(','));

  const visibleCaptcha = Array.from(captchaElements).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
  });

  if (visibleCaptcha.length === 0) {
    console.log('✅ 未检测到可见的人机验证元素，需要立即点击');
    return true;
  }

  // 方法3: 检查页面文本是否包含Success!
  const pageText = document.body.textContent || '';
  if (pageText.includes('Success!')) {
    console.log('✅ 页面已显示Success!，需要立即点击');
    return true;
  }

  // 方法4: 等待短时间看是否自动出现验证
  console.log('⏳ 等待2秒检查验证状态...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 重新检查captcha值
  if (captchaInput && captchaInput.value && captchaInput.value.length > 10) {
    console.log('✅ 等待后检测到captcha值，需要立即点击');
    return true;
  }

  // 重新检查Success!文本
  const updatedPageText = document.body.textContent || '';
  if (updatedPageText.includes('Success!')) {
    console.log('✅ 等待后检测到Success!，需要立即点击');
    return true;
  }

  console.log('🤖 需要等待人机验证');
  return false;
}

// 实时监控成功SVG图标并自动提交
async function monitorSuccessAndSubmit(submitButton) {
  updateStatus('working', '🤖 监控人机验证状态...');
  logToBackground('开始监控成功SVG图标');

  // 首先尝试自动处理人机验证
  await handleHumanVerification();

  // 启动持续监控验证框的机制
  startContinuousVerificationMonitoring();

  // 直接监控SVG成功图标
  return monitorSuccessSVG(submitButton);
}

// 监控captcha字段变化并自动提交
async function monitorSuccessSVG(submitButton) {
  console.log('🎯 开始监控captcha字段变化');
  updateStatus('working', '🎯 监控人机验证状态...');
  logToBackground('开始监控captcha字段变化');

  // 首先检查页面上是否有captcha字段
  const captchaInput = document.querySelector('input[name="captcha"]');
  console.log('captcha字段检查:', captchaInput ? '找到' : '未找到');
  if (captchaInput) {
    console.log(`初始captcha值: "${captchaInput.value}"`);
  }

  return new Promise((resolve) => {
    let checkCount = 0;
    const maxChecks = 1200; // 最多监控10分钟 (1200 * 500ms)

    const checkCaptchaCompletion = () => {
      checkCount++;
      console.log(`🎯 检查第 ${checkCount} 次`);

      // 方法1: 监控captcha隐藏字段的值变化
      const captchaInput = document.querySelector('input[name="captcha"]');
      if (captchaInput && captchaInput.value && captchaInput.value.length > 10) {
        console.log(`🎯 检测到captcha字段有值: ${captchaInput.value.substring(0, 20)}...`);
        logToBackground(`🎯 检测到captcha字段有值，长度: ${captchaInput.value.length}`);

        // 立即提交
        console.log('✅ captcha字段已填充，立即提交！');
        logToBackground('✅ captcha字段已填充，立即提交！');
        updateStatus('working', '✅ 人机验证完成，准备提交...');

        setTimeout(() => {
          updateStatus('working', '🖱️ 点击提交按钮...');
          submitButton.click();
          logToBackground('已点击提交按钮');
          resolve();
        }, 500);
        return;
      }

      // 方法2: 检测Success!文本
      const pageText = document.body.textContent || document.body.innerText || '';
      if (pageText.includes('Success!')) {
        const allElements = document.querySelectorAll('*');
        for (let el of allElements) {
          const text = (el.textContent || '').trim();
          if (text === 'Success!' && el.offsetParent !== null) {
            console.log('🚀 页面文本检测到Success!，立即提交！');
            logToBackground('🚀 页面文本检测到Success!，立即提交！');
            updateStatus('working', '✅ 人机验证完成，准备提交...');

            setTimeout(() => {
              updateStatus('working', '🖱️ 点击提交按钮...');
              submitButton.click();
              logToBackground('已点击提交按钮');
              resolve();
            }, 500);
            return;
          }
        }
      }

      // 方法3: 检测表单状态变化
      const form = document.querySelector('form');
      if (form && checkCount % 10 === 0) {
        const formData = new FormData(form);
        const captchaValue = formData.get('captcha');
        if (captchaValue && captchaValue.length > 10) {
          console.log(`🎯 表单中检测到captcha值: ${captchaValue.substring(0, 20)}...`);
          logToBackground('🎯 表单中检测到captcha值，准备提交');

          setTimeout(() => {
            updateStatus('working', '🖱️ 点击提交按钮...');
            submitButton.click();
            logToBackground('已点击提交按钮');
            resolve();
          }, 500);
          return;
        }
      }

      try {
        // 强制检查：每次都列出页面上的关键元素
        if (checkCount % 5 === 0) {
          console.log(`=== 第${checkCount}次检查 ===`);

          // 检查所有包含"Success"的元素
          const successElements = document.querySelectorAll('*');
          let foundSuccessText = false;
          let foundSuccessSVG = false;

          successElements.forEach((el, index) => {
            if (index < 200) { // 只检查前200个元素避免性能问题
              const text = (el.textContent || '').trim();
              const id = el.id || '';
              const tagName = el.tagName || '';

              // 检查Success!文本
              if (text === 'Success!' && el.offsetParent !== null) {
                console.log(`🎯 找到Success!文本: <${tagName}> id="${id}"`);
                foundSuccessText = true;

                // 立即触发提交
                console.log('✅ 检测到Success!文本，立即提交！');
                logToBackground('✅ 检测到Success!文本，立即提交！');
                updateStatus('working', '✅ 人机验证完成，准备提交...');

                setTimeout(() => {
                  updateStatus('working', '🖱️ 点击提交按钮...');
                  submitButton.click();
                  logToBackground('已点击提交按钮');
                  resolve();
                }, 500); // 减少等待时间
                return;
              }

              // 检查success相关的SVG
              if (tagName === 'SVG' && (id.includes('success') || el.querySelector('circle'))) {
                const style = window.getComputedStyle(el);
                const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
                if (isVisible) {
                  console.log(`🎯 找到可见的success SVG: id="${id}"`);
                  foundSuccessSVG = true;
                }
              }
            }
          });

          console.log(`检查结果: Success文本=${foundSuccessText}, Success SVG=${foundSuccessSVG}`);

          // 如果找到了Success文本，直接返回
          if (foundSuccessText) {
            return;
          }
        }

        // 原有的检测逻辑作为备用
        let successSVG = document.querySelector('#success-i');
        let foundInIframe = false;

        // 如果没找到，尝试XPath查找
        if (!successSVG) {
          try {
            // 使用XPath查找 /html/body//div[1]/div/div[3] 下的SVG
            const xpathResult = document.evaluate(
              '//div[1]/div/div[3]//svg[@id="success-i"]',
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            );
            successSVG = xpathResult.singleNodeValue;
            if (successSVG) {
              console.log('通过XPath找到success-i SVG');
            }
          } catch (error) {
            console.log('XPath查找失败:', error.message);
          }
        }

        // 如果还是没找到，检查所有SVG元素
        if (!successSVG) {
          const allSVGs = document.querySelectorAll('svg');
          for (let svg of allSVGs) {
            if (svg.id === 'success-i' || (svg.viewBox && svg.viewBox.baseVal && svg.querySelector('circle.success-circle'))) {
              successSVG = svg;
              console.log('通过遍历找到success SVG');
              break;
            }
          }
        }

        // 如果主页面没找到，检查所有iframe
        if (!successSVG) {
          const iframes = document.querySelectorAll('iframe');
          console.log(`检查 ${iframes.length} 个iframe...`);

          for (let iframe of iframes) {
            try {
              // 检查iframe是否可访问
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc) {
                const iframeSVG = iframeDoc.querySelector('#success-i');
                if (iframeSVG) {
                  successSVG = iframeSVG;
                  foundInIframe = true;
                  console.log(`在iframe中找到success-i SVG`);
                  break;
                }

                // 如果没找到success-i，检查其他成功相关的SVG
                const successContainer = iframeDoc.querySelector('#success');
                if (successContainer) {
                  const containerStyle = iframe.contentWindow.getComputedStyle(successContainer);
                  if (containerStyle.display === 'grid' && containerStyle.visibility === 'visible') {
                    console.log(`在iframe中找到可见的success容器`);
                    const svgInContainer = successContainer.querySelector('svg');
                    if (svgInContainer) {
                      const svgStyle = iframe.contentWindow.getComputedStyle(svgInContainer);
                      if (svgStyle.display === 'block' && svgStyle.visibility === 'visible') {
                        successSVG = svgInContainer;
                        foundInIframe = true;
                        console.log(`在iframe的success容器中找到可见SVG`);
                        break;
                      }
                    }
                  }
                }
              }
            } catch (error) {
              // iframe可能跨域，无法访问
              console.log(`无法访问iframe内容 (可能跨域): ${error.message}`);
            }
          }
        }

        console.log(`SVG元素查找结果:`, successSVG ? (foundInIframe ? '在iframe中找到' : '在主页面找到') : '未找到');

        // 额外检查：直接查找包含Success!的可见元素
        if (!successSVG && checkCount % 5 === 0) {
          const allElements = document.querySelectorAll('*');
          for (let element of allElements) {
            const text = element.textContent || '';
            if (text.trim() === 'Success!' && element.offsetParent !== null) {
              console.log(`找到Success!文本元素: <${element.tagName}> id="${element.id}" class="${element.className}"`);

              // 检查是否有相邻的SVG
              const parent = element.parentElement;
              if (parent) {
                const siblingsSVG = parent.querySelector('svg');
                if (siblingsSVG) {
                  const svgStyle = window.getComputedStyle(siblingsSVG);
                  if (svgStyle.display === 'block' && svgStyle.visibility === 'visible') {
                    console.log('✅ 找到Success!文本旁的可见SVG，触发提交！');
                    logToBackground('✅ 找到Success!文本旁的可见SVG，触发提交！');
                    updateStatus('working', '✅ 人机验证完成，准备提交...');

                    setTimeout(() => {
                      updateStatus('working', '🖱️ 点击提交按钮...');
                      submitButton.click();
                      logToBackground('已点击提交按钮');
                      resolve();
                    }, 1000);
                    return;
                  }
                }
              }
              break;
            }
          }
        }

        if (successSVG) {
          // 根据SVG所在位置使用正确的window对象
          const targetWindow = foundInIframe ?
            (successSVG.ownerDocument.defaultView || window) : window;

          const svgStyle = targetWindow.getComputedStyle(successSVG);
          const isVisible = svgStyle.display === 'block' && svgStyle.visibility === 'visible';

          // 每次都记录SVG状态，确保能看到变化
          if (checkCount <= 5 || checkCount % 10 === 0) {
            const location = foundInIframe ? 'iframe中' : '主页面';
            logToBackground(`[${checkCount}] ${location}的success SVG状态: display=${svgStyle.display}, visibility=${svgStyle.visibility}`);
          }

          if (isVisible) {
            const location = foundInIframe ? 'iframe中' : '主页面';
            console.log(`✅ 检测到${location}的成功SVG图标可见！`);
            logToBackground(`✅ 检测到${location}的成功SVG图标可见！`);
            logToBackground(`SVG元素: <svg id="${successSVG.id}" style="display: ${svgStyle.display}; visibility: ${svgStyle.visibility};">`);
            updateStatus('working', '✅ 人机验证完成，准备提交...');

            // 等待1秒确保状态稳定
            setTimeout(() => {
              updateStatus('working', '🖱️ 点击提交按钮...');
              logToBackground('正在点击提交按钮...');
              submitButton.click();
              logToBackground('已点击提交按钮');
              resolve();
            }, 1000);
            return;
          }
        } else {
          // 如果没有找到success SVG，检查success-text元素
          const successText = document.querySelector('#success-text');
          if (successText) {
            const textContent = successText.textContent || successText.innerText || '';
            const textStyle = window.getComputedStyle(successText);
            const isTextVisible = textStyle.display !== 'none' && textStyle.visibility !== 'hidden';

            if (checkCount % 10 === 0) {
              console.log(`success-text元素: 内容="${textContent}", visible=${isTextVisible}`);
            }

            if (textContent.includes('Success!') && isTextVisible) {
              console.log('✅ 通过success-text检测到验证成功！');
              logToBackground('✅ 通过success-text检测到验证成功！');
              updateStatus('working', '✅ 人机验证完成，准备提交...');

              setTimeout(() => {
                updateStatus('working', '🖱️ 点击提交按钮...');
                logToBackground('正在点击提交按钮...');
                submitButton.click();
                logToBackground('已点击提交按钮');
                resolve();
              }, 1000);
              return;
            }
          }

          // 如果没有找到success-i，检查其他可能的成功指示器

          // 方法1: 检查所有包含success的SVG
          const allSVGs = document.querySelectorAll('svg');
          for (let svg of allSVGs) {
            const svgStyle = window.getComputedStyle(svg);
            const isVisible = svgStyle.display === 'block' && svgStyle.visibility === 'visible';

            if (isVisible && (svg.id.includes('success') || svg.getAttribute('class')?.includes('success'))) {
              console.log(`✅ 找到可见的成功相关SVG: id="${svg.id}", class="${svg.getAttribute('class')}"`);
              logToBackground(`✅ 找到其他成功SVG: ${svg.id}`);
              updateStatus('working', '✅ 人机验证完成，准备提交...');

              setTimeout(() => {
                updateStatus('working', '🖱️ 点击提交按钮...');
                submitButton.click();
                logToBackground('已点击提交按钮');
                resolve();
              }, 1000);
              return;
            }
          }

          // 方法2: 检查success容器是否可见
          const successContainer = document.querySelector('#success');
          if (successContainer) {
            const containerStyle = window.getComputedStyle(successContainer);
            const isContainerVisible = containerStyle.display === 'grid' && containerStyle.visibility === 'visible';

            if (isContainerVisible && checkCount % 10 === 0) {
              console.log(`Success容器可见: display=${containerStyle.display}, visibility=${containerStyle.visibility}`);

              // 检查容器内的SVG
              const svgInContainer = successContainer.querySelector('svg');
              if (svgInContainer) {
                const svgStyle = window.getComputedStyle(svgInContainer);
                console.log(`容器内SVG: id="${svgInContainer.id}", display=${svgStyle.display}, visibility=${svgStyle.visibility}`);

                if (svgStyle.display === 'block' && svgStyle.visibility === 'visible') {
                  console.log('✅ 检测到success容器内的可见SVG！');
                  logToBackground('✅ 检测到success容器内的可见SVG！');
                  updateStatus('working', '✅ 人机验证完成，准备提交...');

                  setTimeout(() => {
                    updateStatus('working', '🖱️ 点击提交按钮...');
                    submitButton.click();
                    logToBackground('已点击提交按钮');
                    resolve();
                  }, 1000);
                  return;
                }
              }
            }
          }

          // 调试信息：列出iframe
          if (checkCount % 20 === 0) {
            const iframes = document.querySelectorAll('iframe');
            console.log(`调试信息: 页面上有 ${iframes.length} 个iframe`);
            iframes.forEach((iframe, index) => {
              const src = iframe.src || '无src';
              const id = iframe.id || '无ID';
              console.log(`iframe${index}: src="${src}", id="${id}"`);
            });
            logToBackground('未找到任何成功指示器');
          }
        }

      } catch (error) {
        console.error(`检查SVG元素时出错: ${error.message}`, error);
        logToBackground(`检查SVG元素时出错: ${error.message}`);
      }

      // 检查是否超时
      if (checkCount >= maxChecks) {
        logToBackground('❌ SVG监控超时，人机验证可能需要手动完成');
        updateStatus('info', '⏰ 监控超时，请手动完成验证');
        resolve();
        return;
      }

      // 每10秒更新一次状态
      if (checkCount % 20 === 0) { // 20 * 500ms = 10秒
        const remainingTime = Math.floor((maxChecks - checkCount) * 0.5);
        updateStatus('working', `🎯 等待成功图标... (${remainingTime}s)`);
        logToBackground(`SVG监控中... (${checkCount}/${maxChecks}) 剩余${remainingTime}秒`);
      }

      // 继续监控（每500ms检查一次）
      setTimeout(checkCaptchaCompletion, 500);
    };

    // 开始监控
    console.log('🎯 开始执行captcha监控循环...');
    checkCaptchaCompletion();
  });
}

// 设置网络请求监控
function setupNetworkMonitoring(submitButton) {
  console.log('🌐 设置网络请求监控...');
  logToBackground('🌐 设置网络请求监控...');
  updateStatus('working', '🌐 设置网络监控...');

  // 标记已设置
  window.networkMonitoringSetup = true;

  // 监控fetch请求
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    console.log(`🌐 Fetch请求: ${response.url} - 状态: ${response.status}`);
    checkCloudflareResponse(response, submitButton);
    return response;
  };

  // 监控XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('readystatechange', function() {
      if (this.readyState === 4) {
        console.log(`🌐 XHR请求: ${this._method} ${this._url} - 状态: ${this.status}`);
        checkCloudflareXHRResponse(this, submitButton);
      }
    });
    return originalXHRSend.apply(this, args);
  };

  logToBackground('网络请求监控已设置');

  // 如果没有提交按钮，尝试查找
  if (!submitButton) {
    console.log('🔍 查找提交按钮...');
    setTimeout(async () => {
      const foundButton = await findSubmitButton();
      if (foundButton) {
        console.log('✅ 找到提交按钮，更新监控');
        // 更新全局引用
        window.globalSubmitButton = foundButton;
      }
    }, 2000);
  }
}

// 检查Cloudflare fetch响应
function checkCloudflareResponse(response, submitButton) {
  try {
    const url = response.url;
    console.log(`🌐 检查fetch响应: ${url} - 状态: ${response.status}`);

    if (isCloudflareUrl(url)) {
      console.log(`🎯 检测到Cloudflare请求: ${url}`);
      logToBackground(`🎯 检测到Cloudflare请求: ${url}`);
      logToBackground(`响应状态: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        console.log('✅ Cloudflare验证成功 (fetch)，准备提交');
        logToBackground('✅ Cloudflare验证成功 (fetch)，准备提交');
        const buttonToUse = submitButton || window.globalSubmitButton;
        if (buttonToUse) {
          triggerSubmit(buttonToUse, 'Cloudflare fetch请求返回200');
        } else {
          logToBackground('❌ 未找到提交按钮，无法自动提交');
        }
      }
    }
  } catch (error) {
    console.error(`检查fetch响应时出错: ${error.message}`);
    logToBackground(`检查fetch响应时出错: ${error.message}`);
  }
}

// 检查Cloudflare XHR响应
function checkCloudflareXHRResponse(xhr, submitButton) {
  try {
    const url = xhr._url;
    const method = xhr._method;
    console.log(`🌐 检查XHR响应: ${method} ${url} - 状态: ${xhr.status}`);

    if (isCloudflareUrl(url)) {
      console.log(`🎯 检测到Cloudflare XHR请求: ${method} ${url}`);
      logToBackground(`🎯 检测到Cloudflare XHR请求: ${method} ${url}`);
      logToBackground(`响应状态: ${xhr.status} ${xhr.statusText}`);

      if (xhr.status === 200) {
        console.log('✅ Cloudflare验证成功 (XHR)，准备提交');
        logToBackground('✅ Cloudflare验证成功 (XHR)，准备提交');
        const buttonToUse = submitButton || window.globalSubmitButton;
        if (buttonToUse) {
          triggerSubmit(buttonToUse, 'Cloudflare XHR请求返回200');
        } else {
          logToBackground('❌ 未找到提交按钮，无法自动提交');
        }
      }
    }
  } catch (error) {
    console.error(`检查XHR响应时出错: ${error.message}`);
    logToBackground(`检查XHR响应时出错: ${error.message}`);
  }
}

// 检查是否是Cloudflare URL
function isCloudflareUrl(url) {
  if (!url) return false;
  return url.includes('challenges.cloudflare.com');
}

// 触发提交（防止重复提交）
let submitTriggered = false;
function triggerSubmit(submitButton, reason) {
  if (submitTriggered) {
    logToBackground('提交已触发，忽略重复请求');
    return;
  }

  submitTriggered = true;
  logToBackground(`触发提交，原因: ${reason}`);
  updateStatus('working', '✅ 人机验证完成，准备提交...');

  // 等待1秒确保状态稳定
  setTimeout(() => {
    updateStatus('working', '🖱️ 点击提交按钮...');
    logToBackground('正在点击提交按钮...');
    submitButton.click();
    logToBackground('已点击提交按钮');
  }, 1000);
}
