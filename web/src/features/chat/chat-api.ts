import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { BotQuery, BotRawResponse } from "./types"
import type { BaseQueryFn } from "@reduxjs/toolkit/query"
import OpenAI from "openai"
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/index"
import {
  selectTemperature,
  selectModel,
  selectSystemRole,
  selectTrainingDialog,
  selectIncludeHistory,
} from "../settings/settings-slice"
import { type RootState } from "../../app/store"
import { selectDialog } from "./chat-slice"

const remoteBotProvider = () => {
  return fetchBaseQuery({
    baseUrl: "api",
    method: "POST",
  })
}

const localBotProvider = () => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
    dangerouslyAllowBrowser: true,
  })

  const botBaseQuery =
    (): BaseQueryFn<
      {
        url: string
        body: ChatCompletionCreateParamsNonStreaming
      },
      unknown,
      unknown
    > =>
    async ({ url, body }) => {
      const [method, api] = url.split("/") as ["completions", "create"]

      try {
        const chatCompletion = await openai.chat[method][api](body)

        return { data: chatCompletion }
      } catch (error: unknown) {
        return {
          error: {
            status: 500,
            data: (error as { message: string }).message,
          },
        }
      }
    }

  return botBaseQuery()
}

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: localBotProvider(),
  endpoints: (builder) => ({
    getCompletion: builder.query<BotRawResponse, BotQuery>({
      queryFn(data, api, options, baseQuery) {
        const state = api.getState() as RootState

        const chatMessages: ChatCompletionMessageParam[] = []

        const systemRole = selectSystemRole(state)
        const model = selectModel(state)
        const temperature = selectTemperature(state)
        const trainingDialog = selectTrainingDialog(state)
        const includeHistory = selectIncludeHistory(state)

        // adding system role message from settings
        if (systemRole) {
          chatMessages.push({
            role: "system",
            content: systemRole,
          } as const)
        }

        // adding training dialog messages from settings
        if (trainingDialog) {
          try {
            const items = JSON.parse(
              trainingDialog,
            ) as ChatCompletionMessageParam[]
            chatMessages.push(...items)
          } catch (e) {
            console.log("Training dialog is not valid JSON")
          }
        }

        // adding chat history message if checked in settings
        if (includeHistory) {
          const dialog = selectDialog(state)

          dialog.forEach((dialogItem) => {
            const isBot = dialogItem.type === "a"

            if (isBot && !dialogItem.rawAnswer) {
              return
            }

            const botAnswer = isBot
              ? dialogItem.rawAnswer?.choices[0].message
              : null
            const content = isBot ? botAnswer?.content : dialogItem.text
            const role = isBot ? botAnswer?.role || "assistant" : "user"

            if (content) {
              chatMessages.push({ role, content })
            }
          })
        }

        chatMessages.push(...data.messages)

        const payload: ChatCompletionCreateParamsNonStreaming = {
          messages: chatMessages,
          model,
          temperature,
        }

        return baseQuery({
          url: "completions/create",
          body: payload,
        }) as { data: BotRawResponse }
      },
    }),
  }),
})

export const chatApiLC = createApi({
  reducerPath: "chatApiLC",
  baseQuery: remoteBotProvider(),
  endpoints: (builder) => ({
    getCompletionLC: builder.query<BotRawResponse, BotQuery>({
      query: (body) => ({
        url: "completions/create-lc",
        body,
      }),
    }),
  }),
})

export const { useLazyGetCompletionQuery } = chatApi
export const { useLazyGetCompletionLCQuery } = chatApiLC
