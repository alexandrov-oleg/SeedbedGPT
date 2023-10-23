import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import SubmitButton from "./SubmitButton"
import { dataSets } from "../settings/data-sets"

type InputProps = {
  onSubmit: () => void
  onChange: (value: string) => void
  onClear: () => void
  value: string
}

const actions = [
  {
    name: "gherkin",
    label: "Gherkin Prompt",
  },
  {
    name: "cypress",
    label: "Cypress Prompt",
  },
  {
    name: "clear",
    label: "Clear History",
  },
]

function ChatInput({ value, onSubmit, onChange, onClear }: InputProps) {
  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.code === "Enter") {
      onSubmit()
    }
  }

  const onButtonClick = (action: string) => {
    if (action === "gherkin" || action === "cypress") {
      onChange(dataSets[action].prompt.trim())
    } else if (action === "clear") {
      onClear()
    } else if (action === "send") {
      onSubmit()
    }
  }

  return (
    <Stack spacing={2} direction="row" alignItems="center">
      <TextField
        autoComplete="off"
        label="Prompt"
        multiline={true}
        sx={{
          flexGrow: 1,
        }}
        maxRows={10}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        onKeyDown={onKeyUp}
      />
      <SubmitButton onAction={onButtonClick} options={actions} />
    </Stack>
  )
}

export default ChatInput
