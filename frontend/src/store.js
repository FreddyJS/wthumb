import { configureStore } from '@reduxjs/toolkit'
import cpuReducer from './reducers/cpuReducer'

export default configureStore({
  reducer: {
      cpu: cpuReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false}),
})