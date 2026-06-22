/* export const FETCH_USER_LOGIN_SUCCESS = "FETCH_USER_LOGIN_SUCCESS";
export const USER_LOGOUT_SUCCESS = "USER_LOGOUT_SUCCESS";
export const UPDATE_USER_PROFILE_SUCCESS = "UPDATE_USER_PROFILE_SUCCESS";

// Định nghĩa Interface cho dữ liệu User (Dựa trên backend của bạn)
interface UserLoginResponse {
  DT: {
    access_token: string;
    refresh_token: string;
    username: string;
    image: string;
    role: string;
    email: string;
  };
  EC: number;
  EM: string;
}

// Sử dụng 'as const' để TypeScript hiểu chính xác giá trị của type
export const doLogin = (data: UserLoginResponse) => {
  return {
    type: FETCH_USER_LOGIN_SUCCESS as const,
    payload: data,
  };
};

export const doLogout = () => {
  return {
    type: USER_LOGOUT_SUCCESS as const,
  };
};

export const doUpdateProfile = (data: any) => {
  return {
    type: UPDATE_USER_PROFILE_SUCCESS as const,
    payload: data,
  };
};

// Định nghĩa kiểu chung cho các Action của User (Hữu ích cho Reducer)
export type UserActions = 
  | ReturnType<typeof doLogin> 
  | ReturnType<typeof doLogout> 
  | ReturnType<typeof doUpdateProfile>; */