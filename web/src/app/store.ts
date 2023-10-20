import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"
import chatSettingsReducer from "../features/settings/settings-slice"
import chatReducer from "../features/chat/chat-slice"
import { chatApi, chatApiLC } from "../features/chat/chat-api"
import { localStorageMiddleware, preloadState } from "./localstorage-middleware"
import { baseApi } from "../api/api"

export const store = configureStore({
  devTools: true,
  reducer: {
    chat: chatReducer,
    settings: chatSettingsReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [chatApiLC.reducerPath]: chatApiLC.reducer,
  },
  preloadedState: preloadState(),
  middleware: (getDefaultMiddleware) => {
    return [
      ...getDefaultMiddleware(),
      localStorageMiddleware.middleware,
      chatApi.middleware,
      baseApi.middleware,
      chatApiLC.middleware,
    ]
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
