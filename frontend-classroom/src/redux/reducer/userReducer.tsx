/* import {
  FETCH_USER_LOGIN_SUCCESS,
  USER_LOGOUT_SUCCESS,
} from "../action/userAction";

// 1. Định nghĩa cấu trúc dữ liệu của User
interface UserAccount {
  access_token: string;
  refresh_token: string;
  username: string;
  image: string;
  role: string;
  email: string;
}

interface UserState {
  account: UserAccount;
  isAuthenticated: boolean;
}

const INITIAL_STATE: UserState = {
  account: {
    access_token: "",
    refresh_token: "",
    username: "",
    image: "",
    role: "",
    email: "",
  },
  isAuthenticated: false,
};

// 2. Định nghĩa kiểu cho Action (Đơn giản hóa với any hoặc cụ thể hơn)
const userReducer = (state = INITIAL_STATE, action: any): UserState => {
  switch (action.type) {
    case FETCH_USER_LOGIN_SUCCESS:
      return {
        ...state,
        account: {
          access_token: action?.payload?.DT?.access_token || "",
          refresh_token: action?.payload?.DT?.refresh_token || "",
          username: action?.payload?.DT?.username || "",
          image: action?.payload?.DT?.image || "",
          role: action?.payload?.DT?.role || "",
          email: action?.payload?.DT?.email || "",
        },
        isAuthenticated: true,
      };

    case USER_LOGOUT_SUCCESS:
      return { ...INITIAL_STATE }; // Reset về trạng thái ban đầu nhanh hơn
      
    default:
      return state;
  }
};

export default userReducer; */