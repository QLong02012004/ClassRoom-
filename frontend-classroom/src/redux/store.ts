/**
 * ============================================================================
 * TÊN FILE: store.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/redux/store.ts
 * MỤC ĐÍCH:
 *   Khởi tạo và cấu hình Redux Store toàn cục cho ứng dụng (Redux Toolkit Store).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Gom các reducers (như `userReducer` từ `userSlice`).
 *   - Định nghĩa các kiểu dữ liệu `RootState` và `AppDispatch`.
 * ============================================================================
 */

import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Tắt check serializable để dùng với redux-persist nếu cần sau này
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {user: UserState}
export type AppDispatch = typeof store.dispatch;
