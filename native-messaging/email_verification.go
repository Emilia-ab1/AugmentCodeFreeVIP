package main

import (
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
)

// EmailConfig 邮箱配置
type EmailConfig struct {
	Email          string // 实际接收邮件的邮箱 (158011@newmeng.cn)
	GeneratedEmail string // 生成的注册邮箱 (dddd.tools域名)
	Password       string
	IMAPServer     string
	IMAPPort       int
	LoginURL       string
}

// VerificationCode 验证码信息
type VerificationCode struct {
	Code      string
	Subject   string
	Sender    string
	Timestamp time.Time
	Body      string
}

// VerificationEmailInfo 验证码邮件信息（用于排序）
type VerificationEmailInfo struct {
	Uid        uint32
	Subject    string
	Sender     string
	Timestamp  time.Time
	FolderName string
}

// EmailVerifier 邮箱验证码获取器
type EmailVerifier struct {
	config EmailConfig
	client *client.Client
}

// generateRandomEmail 生成随机邮箱地址
func generateRandomEmail() string {
	// 生成6位随机数字
	randomNum := 100000 + (time.Now().UnixNano() % 900000)
	return fmt.Sprintf("%d@dddd.tools", randomNum)
}

// NewEmailVerifier 创建新的邮箱验证器
func NewEmailVerifier() *EmailVerifier {
	config := EmailConfig{
		Email:          "",                    // 实际接收邮件的邮箱
		GeneratedEmail: generateRandomEmail(), // 生成的注册邮箱
		Password:       "",
		IMAPServer:     "",
		IMAPPort:       993,
		LoginURL:       "",
	}

	return &EmailVerifier{
		config: config,
	}
}

// TryAlternativeServers 获取备用服务器配置
func (ev *EmailVerifier) TryAlternativeServers() []EmailConfig {
	return []EmailConfig{
		{
			Email:      ev.config.Email,
			Password:   ev.config.Password,
			IMAPServer: "imap.qiye.aliyun.com",
			IMAPPort:   993,
			LoginURL:   ev.config.LoginURL,
		},
		{
			Email:      ev.config.Email,
			Password:   ev.config.Password,
			IMAPServer: "imap.mxhichina.com",
			IMAPPort:   993,
			LoginURL:   ev.config.LoginURL,
		},
		{
			Email:      ev.config.Email,
			Password:   ev.config.Password,
			IMAPServer: "imap.qiye.aliyun.com",
			IMAPPort:   143,
			LoginURL:   ev.config.LoginURL,
		},
		{
			Email:      ev.config.Email,
			Password:   ev.config.Password,
			IMAPServer: "imap.mxhichina.com",
			IMAPPort:   143,
			LoginURL:   ev.config.LoginURL,
		},
	}
}

// Close 关闭连接
func (ev *EmailVerifier) Close() {
	if ev.client != nil {
		ev.client.Logout()
		ev.client = nil
	}
}

// Login 登录邮箱
func (ev *EmailVerifier) Login() error {
	// 尝试多种服务器配置
	configs := ev.TryAlternativeServers()

	var lastErr error
	for _, config := range configs {
		log.Printf("尝试连接配置: %s:%d", config.IMAPServer, config.IMAPPort)

		err := ev.tryLogin(config)
		if err == nil {
			log.Printf("连接成功: %s:%d", config.IMAPServer, config.IMAPPort)
			ev.config = config // 更新配置
			return nil
		}

		log.Printf("连接失败: %v", err)
		lastErr = err

		// 如果当前连接失败，关闭客户端
		if ev.client != nil {
			ev.client.Logout()
			ev.client = nil
		}
	}

	log.Printf("所有服务器配置都失败，最后错误: %v", lastErr)
	return fmt.Errorf("所有服务器配置都失败，最后错误: %v", lastErr)
}

// tryLogin 尝试使用指定配置登录
func (ev *EmailVerifier) tryLogin(config EmailConfig) error {
	serverAddr := fmt.Sprintf("%s:%d", config.IMAPServer, config.IMAPPort)

	var c *client.Client
	var err error

	// 根据端口选择连接方式
	if config.IMAPPort == 993 {
		// IMAP SSL连接 (端口993)
		tlsConfig := &tls.Config{
			ServerName:         config.IMAPServer,
			InsecureSkipVerify: false,
			MinVersion:         tls.VersionTLS12,
		}
		c, err = client.DialTLS(serverAddr, tlsConfig)
	} else if config.IMAPPort == 143 {
		// IMAP常规连接 (端口143)，然后升级到TLS
		c, err = client.Dial(serverAddr)
		if err == nil {
			tlsConfig := &tls.Config{
				ServerName:         config.IMAPServer,
				InsecureSkipVerify: false,
				MinVersion:         tls.VersionTLS12,
			}
			if err = c.StartTLS(tlsConfig); err != nil {
				log.Printf("TLS升级失败，继续使用普通连接: %v", err)
			}
		}
	} else {
		c, err = client.Dial(serverAddr)
	}

	if err != nil {
		return fmt.Errorf("连接服务器失败: %v", err)
	}

	ev.client = c

	// 尝试登录
	if err := c.Login(config.Email, config.Password); err != nil {
		return fmt.Errorf("登录失败: %v", err)
	}

	return nil
}

// GetLatestVerificationCode 获取最新的验证码（全文件夹搜索并按时间排序）
func (ev *EmailVerifier) GetLatestVerificationCode() (*VerificationCode, error) {
	if ev.client == nil {
		return nil, fmt.Errorf("邮箱未登录")
	}

	// 等待一段时间确保新邮件已到达邮箱服务器
	log.Printf("等待5秒确保新验证码邮件已到达服务器...")
	time.Sleep(5 * time.Second)

	// 获取智能文件夹列表
	folders := ev.GetSmartFolderList()
	log.Printf("开始在 %d 个文件夹中搜索验证码邮件", len(folders))

	// 收集所有文件夹中的验证码邮件
	var allVerificationEmails []*VerificationEmailInfo

	// 搜索所有文件夹
	for _, folderName := range folders {
		log.Printf("正在搜索文件夹: %s", folderName)

		emails, err := ev.searchAllVerificationEmailsInFolder(folderName)
		if err != nil {
			log.Printf("搜索文件夹 '%s' 失败: %v", folderName, err)
			continue
		}

		if len(emails) > 0 {
			log.Printf("在文件夹 '%s' 中找到 %d 封验证码邮件", folderName, len(emails))
			allVerificationEmails = append(allVerificationEmails, emails...)
		}
	}

	if len(allVerificationEmails) == 0 {
		return nil, fmt.Errorf("在所有文件夹中都未找到验证码邮件")
	}

	// 按时间排序，获取最新的验证码邮件
	log.Printf("总共找到 %d 封验证码邮件，正在按时间排序", len(allVerificationEmails))

	sort.Slice(allVerificationEmails, func(i, j int) bool {
		return allVerificationEmails[i].Timestamp.After(allVerificationEmails[j].Timestamp)
	})

	// 选择最新的验证码邮件
	latestEmail := allVerificationEmails[0]
	log.Printf("选择最新验证码邮件: [%s] %s (时间: %s)",
		latestEmail.FolderName,
		latestEmail.Subject,
		latestEmail.Timestamp.Format("2006-01-02 15:04:05"))

	// 获取完整邮件内容并提取验证码
	return ev.extractVerificationCodeFromEmail(latestEmail)
}

// searchAllVerificationEmailsInFolder 在指定文件夹中搜索所有验证码邮件
func (ev *EmailVerifier) searchAllVerificationEmailsInFolder(folderName string) ([]*VerificationEmailInfo, error) {
	// 尝试选择文件夹
	mbox, err := ev.client.Select(folderName, false)
	if err != nil {
		return nil, fmt.Errorf("选择文件夹失败: %v", err)
	}

	if mbox.Messages == 0 {
		return nil, nil // 文件夹为空，返回空列表
	}

	log.Printf("文件夹 '%s' 共有 %d 封邮件", folderName, mbox.Messages)

	// 获取最近的20封邮件（增加搜索范围）
	from := uint32(1)
	to := mbox.Messages
	if mbox.Messages > 20 {
		from = mbox.Messages - 19
	}

	seqset := new(imap.SeqSet)
	seqset.AddRange(from, to)

	// 获取邮件头信息
	messages := make(chan *imap.Message, 20)
	done := make(chan error, 1)

	go func() {
		done <- ev.client.Fetch(seqset, []imap.FetchItem{imap.FetchEnvelope, imap.FetchFlags, imap.FetchUid}, messages)
	}()

	var verificationEmails []*VerificationEmailInfo
	for msg := range messages {
		subject := msg.Envelope.Subject
		log.Printf("检查邮件: %s", subject)

		if ev.isVerificationEmail(subject) {
			log.Printf("找到验证码邮件: %s", subject)

			var sender string
			if len(msg.Envelope.From) > 0 {
				sender = msg.Envelope.From[0].Address()
			}

			emailInfo := &VerificationEmailInfo{
				Uid:        msg.Uid,
				Subject:    subject,
				Sender:     sender,
				Timestamp:  msg.Envelope.Date,
				FolderName: folderName,
			}

			verificationEmails = append(verificationEmails, emailInfo)
		}
	}

	if err := <-done; err != nil {
		return nil, fmt.Errorf("获取邮件失败: %v", err)
	}

	return verificationEmails, nil
}

// extractVerificationCodeFromEmail 从验证码邮件信息中提取验证码
func (ev *EmailVerifier) extractVerificationCodeFromEmail(emailInfo *VerificationEmailInfo) (*VerificationCode, error) {
	// 首先选择邮件所在的文件夹
	_, err := ev.client.Select(emailInfo.FolderName, false)
	if err != nil {
		return nil, fmt.Errorf("选择文件夹 '%s' 失败: %v", emailInfo.FolderName, err)
	}

	// 获取完整邮件内容
	fullMsg, err := ev.getFullMessage(emailInfo.Uid)
	if err != nil {
		log.Printf("获取完整邮件失败，尝试从主题提取验证码: %v", err)
		// 尝试从主题提取验证码
		code, err := ev.extractVerificationCode(emailInfo.Subject)
		if err == nil {
			log.Printf("成功从主题提取验证码: %s (来源文件夹: %s)", code, emailInfo.FolderName)
			return &VerificationCode{
				Code:      code,
				Subject:   emailInfo.Subject,
				Sender:    emailInfo.Sender,
				Timestamp: emailInfo.Timestamp,
				Body:      "仅从主题提取",
			}, nil
		}
		return nil, fmt.Errorf("获取邮件正文失败且无法从主题提取验证码: %v", err)
	}

	// 从邮件中提取验证码
	searchText := emailInfo.Subject + " " + fullMsg
	code, err := ev.extractVerificationCode(searchText)
	if err != nil {
		return nil, fmt.Errorf("提取验证码失败: %v", err)
	}

	log.Printf("成功提取验证码: %s (来源文件夹: %s)", code, emailInfo.FolderName)

	return &VerificationCode{
		Code:      code,
		Subject:   emailInfo.Subject,
		Sender:    emailInfo.Sender,
		Timestamp: emailInfo.Timestamp,
		Body:      ev.truncateString(fullMsg, 500),
	}, nil
}

// isVerificationEmail 判断是否是验证码邮件
func (ev *EmailVerifier) isVerificationEmail(subject string) bool {
	keywords := []string{
		"验证码", "verification", "code", "验证", "confirm", "激活",
		"verification code", "auth", "登录", "注册", "绑定", "安全码",
		"动态码", "校验码", "确认码", "身份验证", "二次验证",
	}

	subjectLower := strings.ToLower(subject)
	for _, keyword := range keywords {
		if strings.Contains(subjectLower, strings.ToLower(keyword)) {
			return true
		}
	}
	return false
}

// extractVerificationCode 从邮件主题或内容中提取验证码
func (ev *EmailVerifier) extractVerificationCode(text string) (string, error) {
	log.Printf("开始提取验证码，文本长度: %d", len(text))

	// 优先级排序的验证码格式正则表达式
	patterns := []struct {
		pattern string
		desc    string
	}{
		{`验证码[：:\s]*[是为]?\s*(\d{4,8})`, "中文验证码格式1"},
		{`验证码[：:\s]*(\d{4,8})`, "中文验证码格式2"},
		{`verification\s*code[：:\s]*(\d{4,8})`, "英文验证码格式1"},
		{`code[：:\s]*(\d{4,8})`, "英文验证码格式2"},
		{`动态码[：:\s]*(\d{4,8})`, "动态码格式"},
		{`安全码[：:\s]*(\d{4,8})`, "安全码格式"},
		{`校验码[：:\s]*(\d{4,8})`, "校验码格式"},
		{`\b(\d{6})\b`, "6位数字"},
		{`\b(\d{4})\b`, "4位数字"},
		{`\b(\d{8})\b`, "8位数字"},
		{`\b([A-Z0-9]{6})\b`, "6位字母数字组合"},
		{`\b([A-Z0-9]{4})\b`, "4位字母数字组合"},
	}

	// 按优先级尝试匹配
	for _, p := range patterns {
		re := regexp.MustCompile(`(?i)` + p.pattern) // 不区分大小写
		matches := re.FindAllStringSubmatch(text, -1)

		if len(matches) > 0 {
			log.Printf("使用模式 '%s' 找到 %d 个匹配", p.desc, len(matches))

			// 获取最后一个匹配的验证码（通常是最新的）
			lastMatch := matches[len(matches)-1]
			if len(lastMatch) > 1 {
				code := lastMatch[1] // 获取捕获组
				// 验证验证码格式
				if ev.isValidVerificationCode(code) {
					log.Printf("提取到验证码: %s", code)
					return code, nil
				}
			}
		}
	}

	// 如果上述模式都没匹配到，尝试更宽松的匹配
	log.Printf("常规模式未匹配，尝试宽松匹配")

	// 查找所有数字序列
	re := regexp.MustCompile(`\d{4,8}`)
	allNumbers := re.FindAllString(text, -1)

	if len(allNumbers) > 0 {
		log.Printf("找到数字序列: %v", allNumbers)

		// 过滤掉明显不是验证码的数字（如年份、电话号码等）
		for _, num := range allNumbers {
			if ev.isValidVerificationCode(num) {
				log.Printf("从数字序列中选择验证码: %s", num)
				return num, nil
			}
		}
	}

	return "", fmt.Errorf("未找到有效的验证码")
}

// isValidVerificationCode 验证验证码是否有效
func (ev *EmailVerifier) isValidVerificationCode(code string) bool {
	// 长度检查
	if len(code) < 4 || len(code) > 8 {
		return false
	}

	// 排除明显不是验证码的数字
	excludePatterns := []string{
		`^20\d{2}$`,     // 年份 (2000-2099)
		`^19\d{2}$`,     // 年份 (1900-1999)
		`^1[3-9]\d{9}$`, // 手机号码
		`^0\d+$`,        // 以0开头的数字
	}

	for _, pattern := range excludePatterns {
		matched, _ := regexp.MatchString(pattern, code)
		if matched {
			return false
		}
	}

	return true
}

// getFullMessage 获取完整邮件内容
func (ev *EmailVerifier) getFullMessage(uid uint32) (string, error) {
	if ev.client == nil {
		return "", fmt.Errorf("邮箱未登录")
	}

	// 使用UID获取完整邮件
	seqset := new(imap.SeqSet)
	seqset.AddNum(uid)

	messages := make(chan *imap.Message, 1)
	done := make(chan error, 1)

	go func() {
		done <- ev.client.UidFetch(seqset, []imap.FetchItem{imap.FetchRFC822}, messages)
	}()

	var fullMessage string
	for msg := range messages {
		if msg.Body != nil {
			for _, part := range msg.Body {
				if part != nil {
					content, err := io.ReadAll(part)
					if err == nil {
						fullMessage = string(content)
						break
					}
				}
			}
		}
	}

	if err := <-done; err != nil {
		return "", fmt.Errorf("获取完整邮件失败: %v", err)
	}

	if fullMessage == "" {
		return "", fmt.Errorf("邮件内容为空")
	}

	// 简单的邮件内容解析（提取文本部分）
	return ev.extractTextFromEmail(fullMessage), nil
}

// extractTextFromEmail 从邮件原文中提取文本内容
func (ev *EmailVerifier) extractTextFromEmail(emailContent string) string {
	lines := strings.Split(emailContent, "\n")
	var textContent strings.Builder
	inBody := false

	for _, line := range lines {
		// 跳过邮件头，找到正文开始
		if !inBody && strings.TrimSpace(line) == "" {
			inBody = true
			continue
		}

		if inBody {
			// 跳过一些邮件格式标记
			if strings.HasPrefix(line, "Content-") ||
				strings.HasPrefix(line, "MIME-") ||
				strings.HasPrefix(line, "--") {
				continue
			}

			textContent.WriteString(line)
			textContent.WriteString(" ")
		}
	}

	return textContent.String()
}

// truncateString 截断字符串到指定长度
func (ev *EmailVerifier) truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// GetSmartFolderList 获取智能文件夹列表
func (ev *EmailVerifier) GetSmartFolderList() []string {
	// 先尝试获取实际的文件夹列表
	actualFolders, err := ev.GetMailboxFolders()
	if err != nil {
		log.Printf("无法获取实际文件夹列表，使用默认列表: %v", err)
		// 使用默认列表
		return []string{
			"INBOX",
			"Junk",
			"Spam",
			"垃圾邮件",
			"已删除邮件",
			"Deleted Items",
			"Trash",
		}
	}

	// 基于实际文件夹构建智能搜索列表
	var smartFolders []string

	// 优先级1: 收件箱
	for _, folder := range actualFolders {
		folderLower := strings.ToLower(folder)
		if strings.EqualFold(folder, "INBOX") ||
			strings.Contains(folderLower, "inbox") ||
			strings.Contains(folderLower, "收件箱") {
			smartFolders = append(smartFolders, folder)
		}
	}

	// 优先级2: 垃圾邮件文件夹
	junkKeywords := []string{"junk", "spam", "垃圾", "bulk"}
	for _, folder := range actualFolders {
		folderLower := strings.ToLower(folder)
		for _, keyword := range junkKeywords {
			if strings.Contains(folderLower, keyword) {
				smartFolders = append(smartFolders, folder)
				break
			}
		}
	}

	// 去重
	seen := make(map[string]bool)
	var uniqueFolders []string
	for _, folder := range smartFolders {
		if !seen[folder] {
			seen[folder] = true
			uniqueFolders = append(uniqueFolders, folder)
		}
	}

	if len(uniqueFolders) == 0 {
		uniqueFolders = []string{"INBOX"}
	}

	log.Printf("智能文件夹搜索列表 (%d个): %v", len(uniqueFolders), uniqueFolders)
	return uniqueFolders
}

// GetMailboxFolders 获取邮箱文件夹列表
func (ev *EmailVerifier) GetMailboxFolders() ([]string, error) {
	if ev.client == nil {
		return nil, fmt.Errorf("邮箱未登录")
	}

	var allFolders []string

	// 获取根目录文件夹列表
	rootFolders, err := ev.listFolders("", "*")
	if err != nil {
		return nil, fmt.Errorf("获取根目录文件夹失败: %v", err)
	}
	allFolders = append(allFolders, rootFolders...)

	return allFolders, nil
}

// listFolders 获取指定路径下的文件夹列表
func (ev *EmailVerifier) listFolders(reference, pattern string) ([]string, error) {
	mailboxes := make(chan *imap.MailboxInfo, 50)
	done := make(chan error, 1)

	go func() {
		done <- ev.client.List(reference, pattern, mailboxes)
	}()

	var folders []string
	for m := range mailboxes {
		folders = append(folders, m.Name)
	}

	if err := <-done; err != nil {
		return nil, err
	}

	return folders, nil
}

// GetEmailConfig 获取邮箱配置
func (ev *EmailVerifier) GetEmailConfig() EmailConfig {
	return ev.config
}
