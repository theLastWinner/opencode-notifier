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

async function sendWebhookRequest(url: string, message: WebhookMessage): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json() as { errcode: number; errmsg: string }
    return data.errcode === 0
  } catch {
    return false
  }
}

export async function sendWechatWebhook(
  config: WechatWebhookConfig,
  title: string,
  message: string
): Promise<void> {
  if (!config.enabled || !config.webhookUrl) {
    return
  }

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

  await sendWebhookRequest(config.webhookUrl, webhookMessage)
}
