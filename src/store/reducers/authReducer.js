const initialState = {
  user: null,
  address: [],                        // 배열 유지
  selectedUserCheckoutAddress: null,
  isAuthenticated: false,             // ★ 명시 플래그 추가(권장)
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOGIN_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!(action.payload && (action.payload.id ?? action.payload.userId ?? action.payload.username)),
      };

    case "USER_ADDRESS":
      return { ...state, address: Array.isArray(action.payload) ? action.payload : [] };

    case "SELECT_CHECKOUT_ADDRESS":
      return { ...state, selectedUserCheckoutAddress: action.payload };

    case "REMOVE_CHECKOUT_ADDRESS":
      return { ...state, selectedUserCheckoutAddress: null };

    case "LOG_OUT":
      // ★ 가장 안전: 초기 상태로 되돌리기 (주소는 []로, 선택 주소 null로, 인증 false로)
      return { ...initialState };

    default:
      return state;
  }
};
