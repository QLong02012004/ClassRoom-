import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { IModelUser } from "../../types/backend";

export interface UserState {
  userInfo: IModelUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Khởi tạo state từ localStorage nếu có
const savedUser = localStorage.getItem("user");
const initialState: UserState = {
  userInfo: savedUser ? JSON.parse(savedUser) : null,
  isAuthenticated: !!savedUser,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<IModelUser>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.userInfo = action.payload;
      state.error = null;
      // Đồng bộ với localStorage
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.userInfo = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    updateUserInfo: (state, action: PayloadAction<Partial<IModelUser>>) => {
      if (state.userInfo) {
        state.userInfo = { ...state.userInfo, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.userInfo));
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUserInfo } = userSlice.actions;
export default userSlice.reducer;
