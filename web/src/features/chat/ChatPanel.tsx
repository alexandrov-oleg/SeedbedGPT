import { useEffect, useState } from "react"
import Box from "@mui/material/Box"
import List from "../../components/List/List"
import AnswerListItem from "../../components/List/BotAnswerListItem"
import QuestionListItem from "../../components/List/UserQuestionListItem"
import ChatInput from "./ChatInput"
import {
  useLazyGetCompletionQuery,
  useLazyGetCompletionLCQuery,
} from "./chat-api"
import { responseToDialogItem } from "./utills"
import { useAppSelector, useAppDispatch } from "../../app/hooks"
import { addDialogItem, selectDialog, setDialog } from "./chat-slice"
import type { OpenAI } from "openai"
import CircularProgress from "@mui/material/CircularProgress"

export type DialogItem = {
  text: string
  type: "q" | "a"
  rawAnswer?: OpenAI.Chat.Completions.ChatCompletion
}

function ChatPanel(props: { isLC?: boolean }) {
  const { isLC } = props
  const dispatch = useAppDispatch()

  const [triggerPromptOpenAI, queryOpenAI] = useLazyGetCompletionQuery()
  const [triggerPromptLC, queryLC] = useLazyGetCompletionLCQuery()

  const [triggerPrompt, query] = isLC
    ? [triggerPromptLC, queryLC]
    : [triggerPromptOpenAI, queryOpenAI]

  const dialog = useAppSelector(selectDialog)
  const [userInput, setUserInput] = useState("")

  const onInputChange = (value: string) => {
    setUserInput(value)
  }

  const clearDialog = () => {
    dispatch(setDialog([]))
  }

  useEffect(() => {
    document.querySelector(".chat-list")?.scrollTo(0, 999999)
  }, [dialog])

  const makePrompt = async () => {
    const value = userInput.trim()

    if (!value) {
      return
    }

    setUserInput("")
    const loading = triggerPrompt({
      messages: [
        {
          role: "user",
          content: value,
        },
      ],
    })
    // if the history should be included we must include it after the request to prevent duplications
    dispatch(addDialogItem([{ text: value, type: "q" }]))

    const response = await loading
    const answerItems = responseToDialogItem(response.data)

    dispatch(addDialogItem(answerItems))
  }

  let listItems = dialog.map((item, index) => {
    if (item.type === "q") {
      return <QuestionListItem key={index} primaryText={item.text} />
    } else {
      return <AnswerListItem key={index} primaryText={item.text} />
    }
  })

  const Loading = query.isFetching ? <CircularProgress /> : null

  return (
    <Box className="chat-panel">
      <List className="chat-list" emptyText="Start a new conversation">
        {listItems}
        {Loading}
      </List>
      <ChatInput
        onSubmit={makePrompt}
        onChange={onInputChange}
        onClear={() => clearDialog()}
        value={userInput}
      />
    </Box>
  )
}

export default ChatPanel
