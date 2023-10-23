import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import FormControlLabel from "@mui/material/FormControlLabel"
import Checkbox from "@mui/material/Checkbox"
import ButtonGroup from "@mui/material/ButtonGroup"
import { useAppSelector, useAppDispatch } from "../../app/hooks"
import {
  setSystemRole,
  setTemperature,
  setModel,
  setTrainingDialog,
  setIncludeHistory,
  resetSettings,
} from "./settings-slice"
import { dataSets } from "./data-sets"

const nameActionMap = {
  systemRole: setSystemRole,
  model: setModel,
  temperature: setTemperature,
  trainingDialog: setTrainingDialog,
  includeHistory: setIncludeHistory,
}

function SettingsPanel() {
  const systemRole = useAppSelector((state) => state.settings.systemRole)
  const model = useAppSelector((state) => state.settings.model)
  const temperature = useAppSelector((state) => state.settings.temperature)
  const trainingDialog = useAppSelector(
    (state) => state.settings.trainingDialog,
  )
  const selectIncludeHistory = useAppSelector(
    (state) => state.settings.includeHistory,
  )

  const dispatch = useAppDispatch()

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    const action = nameActionMap[name as keyof typeof nameActionMap]

    switch (action.type) {
      case "chat/setTemperature":
        return dispatch(action(Number(value)))
      case "chat/setIncludeHistory":
        return dispatch(action(event.target.checked))
      default:
        return dispatch(action(value.trim()))
    }
  }

  const onResetClick = () => {
    dispatch(resetSettings())
  }

  const validateTrainingDialog = (
    event: React.FocusEvent<HTMLInputElement>,
  ) => {
    const { value } = event.target

    if (!value) {
      return
    }

    try {
      JSON.parse(value.trim())
    } catch (e) {
      alert("Invalid JSON in training dialog")
    }
  }

  const onSetChange = (value: "gherkin" | "cypress") => {
    const dataSet = dataSets[value]
    dispatch(setSystemRole(dataSet.system.trim()))
    dispatch(setModel(dataSet.model))
  }

  return (
    <Stack spacing={2} alignItems="stretch">
      <TextField
        name="systemRole"
        autoComplete="off"
        label="System Role"
        multiline={true}
        rows={6}
        value={systemRole}
        onChange={onChange}
      />
      <ButtonGroup>
        <Button onClick={() => onSetChange("gherkin")}>Role "Gherkin"</Button>
        <Button onClick={() => onSetChange("cypress")}>Role "Cypress"</Button>
      </ButtonGroup>
      <TextField
        name="trainingDialog"
        autoComplete="off"
        label="Training Dialog"
        multiline={true}
        rows={3}
        value={trainingDialog}
        onChange={onChange}
        onBlur={validateTrainingDialog}
      />
      <TextField
        name="model"
        autoComplete="off"
        label="Model"
        value={model}
        onChange={onChange}
      />
      <TextField
        name="temperature"
        autoComplete="off"
        label="Temperature"
        value={temperature}
        type={"number"}
        inputProps={{
          maxvalue: 10,
          minvalue: 0,
          maxLength: 2,
          step: "0.1",
        }}
        onChange={onChange}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={selectIncludeHistory}
            onChange={onChange}
            name="includeHistory"
          />
        }
        label="Attach dialog history to prompts"
      />
      <Button variant="outlined" onClick={() => onResetClick()}>
        Reset to defaults
      </Button>
    </Stack>
  )
}

export default SettingsPanel
