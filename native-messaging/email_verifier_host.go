package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"time"
)

// Message 表示Chrome扩展和Native Host之间的消息
type Message struct {
	Action string `json:"action"`
	Data   string `json:"data,omitempty"`
	Email  string `json:"email,omitempty"`
}

// Response 表示Native Host的响应
type Response struct {
	Success bool   `json:"success"`
	Code    string `json:"code,omitempty"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

// EmailVerifier 邮箱验证器实例
var emailVerifier *EmailVerifier

func main() {
	// 设置日志输出到文件，避免干扰stdin/stdout
	logFile, err := os.OpenFile("email_verifier_host.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		// 如果无法创建日志文件，使用stderr
		log.SetOutput(os.Stderr)
	} else {
		defer logFile.Close()
		log.SetOutput(logFile)
	}

	log.Println("Email Verifier Native Host started")

	// 初始化邮箱验证器
	emailVerifier = NewEmailVerifier()

	// 处理消息循环
	messageCount := 0
	for {
		messageCount++
		log.Printf("Waiting for message #%d", messageCount)

		message, err := readMessage()
		if err != nil {
			if err == io.EOF {
				log.Println("Chrome extension disconnected")
				break
			}
			log.Printf("Error reading message: %v", err)
			// 不发送错误响应，继续等待
			continue
		}

		log.Printf("Received message #%d: %+v", messageCount, message)

		// 处理消息
		func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Panic in message handler: %v", r)
					sendErrorResponse(fmt.Sprintf("Handler panic: %v", r))
				}
			}()
			handleMessage(message)
		}()

		// 刷新输出缓冲区
		os.Stdout.Sync()

		log.Printf("Message #%d handled successfully", messageCount)
	}

	// 清理资源
	if emailVerifier != nil {
		emailVerifier.Close()
	}
	log.Println("Email Verifier Native Host stopped")
}

// readMessage 从stdin读取Chrome扩展发送的消息
func readMessage() (*Message, error) {
	// 读取消息长度（4字节）
	var length uint32
	err := binary.Read(os.Stdin, binary.LittleEndian, &length)
	if err != nil {
		return nil, err
	}

	// 读取消息内容
	messageBytes := make([]byte, length)
	_, err = io.ReadFull(os.Stdin, messageBytes)
	if err != nil {
		return nil, err
	}

	// 解析JSON消息
	var message Message
	err = json.Unmarshal(messageBytes, &message)
	if err != nil {
		return nil, err
	}

	return &message, nil
}

// sendResponse 向Chrome扩展发送响应
func sendResponse(response *Response) error {
	// 序列化响应
	responseBytes, err := json.Marshal(response)
	if err != nil {
		return err
	}

	// 发送消息长度
	length := uint32(len(responseBytes))
	err = binary.Write(os.Stdout, binary.LittleEndian, length)
	if err != nil {
		return err
	}

	// 发送消息内容
	_, err = os.Stdout.Write(responseBytes)
	return err
}

// sendSuccessResponse 发送成功响应
func sendSuccessResponse(code string, message string) {
	response := &Response{
		Success: true,
		Code:    code,
		Message: message,
	}

	err := sendResponse(response)
	if err != nil {
		log.Printf("Error sending success response: %v", err)
	}
}

// sendErrorResponse 发送错误响应
func sendErrorResponse(errorMsg string) {
	response := &Response{
		Success: false,
		Error:   errorMsg,
	}

	err := sendResponse(response)
	if err != nil {
		log.Printf("Error sending error response: %v", err)
	}
}

// handleMessage 处理来自Chrome扩展的消息
func handleMessage(message *Message) {
	log.Printf("Processing action: %s", message.Action)

	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic in handleMessage: %v", r)
			sendErrorResponse(fmt.Sprintf("Handler panic: %v", r))
		}
	}()

	switch message.Action {
	case "getVerificationCode":
		log.Println("Calling handleGetVerificationCode")
		handleGetVerificationCode()
		log.Println("handleGetVerificationCode completed")
	case "getEmailConfig":
		log.Println("Calling handleGetEmailConfig")
		handleGetEmailConfig()
		log.Println("handleGetEmailConfig completed")
	case "updateEmailConfig":
		log.Println("Calling handleUpdateEmailConfig")
		handleUpdateEmailConfig(message.Email)
		log.Println("handleUpdateEmailConfig completed")
	case "ping":
		log.Println("Calling handlePing")
		handlePing()
		log.Println("handlePing completed")

	default:
		log.Printf("Unknown action: %s", message.Action)
		sendErrorResponse("Unknown action: " + message.Action)
	}

	log.Printf("Message handling for action '%s' finished", message.Action)
}

// handleGetVerificationCode 处理获取验证码请求
func handleGetVerificationCode() {
	log.Println("Handling getVerificationCode request")

	// 使用defer来捕获panic
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic in getVerificationCode: %v", r)
			sendErrorResponse(fmt.Sprintf("Internal error: %v", r))
		}
	}()

	// 创建新的邮箱验证器实例
	log.Println("Creating new email verifier instance")
	verifier := NewEmailVerifier()
	if verifier == nil {
		log.Println("Failed to create email verifier")
		sendErrorResponse("Failed to create email verifier")
		return
	}
	defer verifier.Close()

	log.Println("Attempting to login to email")
	// 尝试登录邮箱
	if err := verifier.Login(); err != nil {
		log.Printf("Failed to login to email: %v", err)
		sendErrorResponse("Failed to login to email: " + err.Error())
		return
	}

	log.Println("Successfully logged in to email")

	// 获取最新验证码
	log.Println("Getting latest verification code")
	verificationCode, err := verifier.GetLatestVerificationCode()
	if err != nil {
		log.Printf("Failed to get verification code: %v", err)
		sendErrorResponse("Failed to get verification code: " + err.Error())
		return
	}

	if verificationCode == nil {
		log.Println("No verification code found")
		sendErrorResponse("No verification code found")
		return
	}

	log.Printf("Successfully got verification code: %s", verificationCode.Code)
	sendSuccessResponse(verificationCode.Code, fmt.Sprintf("Got verification code from: %s", verificationCode.Subject))
}

// handlePing 处理ping请求
func handlePing() {
	log.Println("Handling ping request")
	sendSuccessResponse("", "pong")
}

// handleUpdateEmailConfig 处理更新邮箱配置请求
func handleUpdateEmailConfig(newEmail string) {
	log.Printf("Handling update email config request with new email: %s", newEmail)

	// 使用defer来捕获panic
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic in updateEmailConfig: %v", r)
			sendErrorResponse(fmt.Sprintf("Update email config panic: %v", r))
		}
	}()

	// 验证邮箱格式
	if newEmail == "" {
		log.Println("Empty email provided")
		sendErrorResponse("Empty email provided")
		return
	}

	// 更新全局邮箱验证器的配置
	if emailVerifier != nil {
		// 获取当前配置
		currentConfig := emailVerifier.GetEmailConfig()

		// 更新生成的邮箱
		currentConfig.GeneratedEmail = newEmail

		// 创建新的验证器实例
		emailVerifier = &EmailVerifier{
			config: currentConfig,
		}

		log.Printf("Email config updated successfully. New email: %s", newEmail)

		// 返回成功响应
		response := map[string]interface{}{
			"success":     true,
			"message":     "Email config updated successfully",
			"email":       newEmail,
			"actualEmail": currentConfig.Email,
			"updatedTime": time.Now().Format("2006-01-02 15:04:05"),
		}

		responseBytes, err := json.Marshal(response)
		if err != nil {
			log.Printf("Error marshaling update email config response: %v", err)
			sendErrorResponse("Failed to marshal response")
			return
		}

		sendRawResponse(responseBytes)
	} else {
		log.Println("Email verifier not initialized")
		sendErrorResponse("Email verifier not initialized")
	}
}

// handleGetEmailConfig 处理获取邮箱配置请求
func handleGetEmailConfig() {
	log.Println("Handling get email config request")

	// 使用defer来捕获panic
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic in getEmailConfig: %v", r)
			sendErrorResponse(fmt.Sprintf("Get email config panic: %v", r))
		}
	}()

	// 创建邮箱验证器实例获取配置
	verifier := NewEmailVerifier()
	if verifier == nil {
		log.Println("Failed to create email verifier")
		sendErrorResponse("Failed to create email verifier")
		return
	}
	defer verifier.Close()

	// 获取邮箱配置
	config := verifier.GetEmailConfig()

	log.Printf("Returning generated email config: %s (actual: %s)", config.GeneratedEmail, config.Email)

	// 返回生成的邮箱配置信息（前端使用生成的邮箱注册，验证码从实际邮箱获取）
	response := map[string]interface{}{
		"success":       true,
		"email":         config.GeneratedEmail, // 返回生成的dddd.tools邮箱给前端
		"actualEmail":   config.Email,          // 实际接收邮件的邮箱（用于调试）
		"server":        config.IMAPServer,
		"port":          config.IMAPPort,
		"generatedTime": time.Now().Format("2006-01-02 15:04:05"),
	}

	responseBytes, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshaling email config response: %v", err)
		sendErrorResponse("Failed to marshal email config response")
		return
	}

	sendRawResponse(responseBytes)
}

// sendRawResponse 发送原始响应
func sendRawResponse(responseBytes []byte) {
	length := uint32(len(responseBytes))
	err := binary.Write(os.Stdout, binary.LittleEndian, length)
	if err != nil {
		log.Printf("Error writing response length: %v", err)
		return
	}

	_, err = os.Stdout.Write(responseBytes)
	if err != nil {
		log.Printf("Error writing response: %v", err)
		return
	}

	os.Stdout.Sync()
}
