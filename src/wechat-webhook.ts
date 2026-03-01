interface WechatWebhookConfig {
  enabled: boolean
  webhookUrl: string
  mentionedList?: string[]
  mentionedMobileList?: string[]
}

interface WebhookMessage {
  msgtype: string
  text?: {
    content: string
    mentioned_list?: string[]
    mentioned_mobile_list?: string[]
  }
  markdown?: {
    content: string
  }
}

export interface Logger {
  info: (message: string, extra?: Record<string, unknown>) => Promise<void>
  error: (message: string, extra?: Record<string, unknown>) => Promise<void>
}

async function sendWebhookRequest(
  url: string,
  message: WebhookMessage,
  logger?: Logger
): Promise<boolean> {
  try {
    await logger?.info("Sending webhook request", { url, message })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorText = await response.text()
      await logger?.error("Webhook request failed", { status: response.status, error: errorText })
      return false
    }

    const data = (await response.json()) as { errcode: number; errmsg: string }

    if (data.errcode !== 0) {
      await logger?.error("WeChat API error", { errcode: data.errcode, errmsg: data.errmsg })
      return false
    }

    await logger?.info("Webhook message sent successfully")
    return true
  } catch (error) {
    await logger?.error("Webhook exception", { error: String(error) })
    return false
  }
}

export async function sendWechatWebhook(
  config: WechatWebhookConfig,
  title: string,
  message: string,
  logger?: Logger
): Promise<void> {
  await logger?.info("WeChat webhook called", {
    enabled: config.enabled,
    hasWebhookUrl: !!config.webhookUrl,
    webhookUrlLength: config.webhookUrl?.length ?? 0,
    title,
    messageLength: message?.length ?? 0,
  })

  if (!config.enabled) {
    await logger?.info("WeChat webhook skipped: not enabled")
    return
  }

  if (!config.webhookUrl) {
    await logger?.info("WeChat webhook skipped: webhookUrl not set")
    return
  }

  if (!config.webhookUrl.startsWith("http")) {
    await logger?.error("WeChat webhook skipped: invalid webhookUrl format", {
      webhookUrl: config.webhookUrl.substring(0, 20) + "...",
    })
    return
  }

  await logger?.info("Preparing WeChat webhook notification", { title, message: message.substring(0, 100) })

  const fullMessage = `${title}\n\n${message}`

  const webhookMessage: WebhookMessage = {
    msgtype: "text",
    text: {
      content: fullMessage,
    },
  }

  if (config.mentionedList && config.mentionedList.length > 0) {
    webhookMessage.text!.mentioned_list = config.mentionedList
  }

  if (config.mentionedMobileList && config.mentionedMobileList.length > 0) {
    webhookMessage.text!.mentioned_mobile_list = config.mentionedMobileList
  }

  await sendWebhookRequest(config.webhookUrl, webhookMessage, logger)
}
