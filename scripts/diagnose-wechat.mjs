#!/usr/bin/env node
/**
 * 企业微信 Webhook 诊断脚本
 * 用于验证配置和网络连接
 */

import { loadConfig, getConfigPath } from "../dist/config.js"
import { sendWechatWebhook } from "../dist/wechat-webhook.js"
import { existsSync, readFileSync } from "fs"

const logger = {
  info: async (message, extra) => {
    console.log("[INFO]", message, extra ? JSON.stringify(extra, null, 2) : "")
  },
  error: async (message, extra) => {
    console.error("[ERROR]", message, extra ? JSON.stringify(extra, null, 2) : "")
  },
}

console.log("=".repeat(60))
console.log("企业微信 Webhook 诊断工具")
console.log("=".repeat(60))

// 1. 检查配置文件路径
const configPath = getConfigPath()
console.log("\n1. 配置文件路径:")
console.log("   ", configPath)

// 2. 检查配置文件是否存在
const configExists = existsSync(configPath)
console.log("\n2. 配置文件状态:")
console.log("   存在:", configExists)

if (configExists) {
  console.log("\n3. 配置文件内容:")
  try {
    const content = readFileSync(configPath, "utf-8")
    const config = JSON.parse(content)
    console.log("   原始配置:")
    console.log(JSON.stringify(config, null, 2))
    
    console.log("\n4. Webhook 配置检查:")
    if (config.wechatWebhook) {
      console.log("   wechatWebhook 字段存在:")
      console.log("   - enabled:", config.wechatWebhook.enabled)
      console.log("   - webhookUrl:", config.wechatWebhook.webhookUrl ? "已设置 (长度: " + config.wechatWebhook.webhookUrl.length + ")" : "未设置")
      if (config.wechatWebhook.webhookUrl) {
        console.log("   - URL 前缀:", config.wechatWebhook.webhookUrl.substring(0, 30) + "...")
      }
      console.log("   - mentionedList:", config.wechatWebhook.mentionedList || "未设置")
      console.log("   - mentionedMobileList:", config.wechatWebhook.mentionedMobileList || "未设置")
    } else {
      console.log("   ❌ wechatWebhook 字段不存在!")
    }
  } catch (error) {
    console.error("   读取配置文件失败:", error.message)
  }
}

// 3. 加载并检查解析后的配置
console.log("\n5. 解析后的配置:")
const config = loadConfig()
console.log("   wechatWebhook.enabled:", config.wechatWebhook?.enabled)
console.log("   wechatWebhook.webhookUrl:", config.wechatWebhook?.webhookUrl ? "已设置" : "未设置")

// 4. 测试发送（如果配置正确）
console.log("\n6. 发送测试:")
if (config.wechatWebhook?.enabled && config.wechatWebhook?.webhookUrl) {
  console.log("   配置正确，尝试发送测试消息...")
  try {
    await sendWechatWebhook(
      config.wechatWebhook,
      "OpenCode 测试",
      "这是一条来自诊断脚本的测试消息",
      logger
    )
    console.log("   ✅ 测试消息发送完成")
  } catch (error) {
    console.error("   ❌ 发送失败:", error.message)
  }
} else {
  console.log("   ⚠️  配置不完整，跳过发送测试")
  console.log("      请确保 wechatWebhook.enabled 为 true 且 wechatWebhook.webhookUrl 已设置")
}

console.log("\n" + "=".repeat(60))
console.log("诊断完成")
console.log("=".repeat(60))
