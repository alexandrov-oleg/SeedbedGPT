import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../../app/store"

export type ChatSettings = {
  systemRole: string
  model: string
  temperature: number
  trainingDialog: string
  includeHistory: boolean
}

const initialState: ChatSettings = {
  systemRole:
    "Act as a quality analyst who is highly experienced in behavioral driven development and developing well-constructed Gherkin Scenarios from supplied requirements.",
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  trainingDialog: "",
  includeHistory: true,
}

export const counterSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSystemRole: (state, action: PayloadAction<string>) => {
      state.systemRole = action.payload
    },
    setModel: (state, action: PayloadAction<string>) => {
      state.model = action.payload
    },
    setTemperature: (state, action: PayloadAction<number>) => {
      state.temperature = action.payload
    },
    setTrainingDialog: (state, action: PayloadAction<string>) => {
      state.trainingDialog = action.payload
    },
    setIncludeHistory: (state, action: PayloadAction<boolean>) => {
      state.includeHistory = action.payload
    },
    resetSettings: () => {
      return { ...initialState }
    },
  },
})

export const actions = counterSlice.actions

export const {
  setSystemRole,
  setModel,
  setTemperature,
  setTrainingDialog,
  resetSettings,
  setIncludeHistory,
} = counterSlice.actions

export const selectSystemRole = (state: RootState) => state.settings.systemRole
export const selectTemperature = (state: RootState) =>
  state.settings.temperature
export const selectModel = (state: RootState) => state.settings.model
export const selectTrainingDialog = (state: RootState) =>
  state.settings.trainingDialog
export const selectIncludeHistory = (state: RootState) =>
  state.settings.includeHistory

export default counterSlice.reducer
