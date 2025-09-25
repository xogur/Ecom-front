import api from "../../api/api"


export const fetchProducts = (queryString) => async (dispatch) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const { data } = await api.get(`/public/products?${queryString}`);
        dispatch({
            type: "FETCH_PRODUCTS",
            payload: data.content,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            lastPage: data.lastPage,
        });
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        console.log(error);
        dispatch({ 
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch products",
         });
    }
};


export const fetchCategories = () => async (dispatch) => {
    try {
        dispatch({ type: "CATEGORY_LOADER" });
        const { data } = await api.get(`/public/categories`);
        dispatch({
            type: "FETCH_CATEGORIES",
            payload: data.content,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            lastPage: data.lastPage,
        });
        dispatch({ type: "IS_ERROR" });
    } catch (error) {
        console.log(error);
        dispatch({ 
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch categories",
         });
    }
};


// export const addToCart = (data, qty = 1, toast) => 
//     (dispatch, getState) => {
//         // Find the product
//         const { products } = getState().products;
//         const getProduct = products.find(
//             (item) => item.productId === data.productId
//         );

//         // Check for stocks
//         const isQuantityExist = getProduct.quantity >= qty;

//         // If in stock -> add
//         if (isQuantityExist) {
//             dispatch({ type: "ADD_CART", payload: {...data, quantity: qty}});
//             toast.success(`${data?.productName} added to the cart`);
//             localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
//         } else {
//             // error
//             toast.error("Out of stock");
//         }
// };

// import api from "../utils/api"; // axios 인스턴스 (baseURL, withCredentials 설정 권장)

export const addToCart = (data, qty = 1, toast) =>
  async (dispatch, getState) => {
    try {
      const quantity = Number(qty) > 0 ? Number(qty) : 1;
      // ✅ POST + JSON 바디로 전송 (@RequestBody AddToCartRequest와 매칭)
      // 백엔드: @PostMapping("/cart/addProduct") + @RequestBody { productId, quantity }
      const payload = {
        productId: data.productId,
        quantity,
      };

      // axios는 객체 전달 시 기본적으로 application/json으로 전송합니다.
      const { data: serverResponse } = await api.post("/cart/addProduct", payload);
      
      dispatch({
        type: "ADD_CART",
        payload: { ...data, quantity },
      });

      toast?.success(`${data?.productName} added to the cart`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add to cart";
      toast?.error(msg);
    }
  };


export const increaseCartQuantity =
  (data, toast, currentQuantity, setCurrentQuantity) => 
  async (dispatch, getState) => {
    const productId = data?.productId;
    if (!productId) {
      toast?.error("상품 ID가 없습니다.");
      return;
    }

    try {
      // operation: "delete" 이외는 +1 이므로 "add"로 호출
      // 클래스 레벨이 "/api/carts"라고 가정하면 아래 경로가 최종 "/api/carts/cart/products/{id}/quantity/add"가 됩니다.
      const res = await api.put(
        `/cart/products/${productId}/quantity/add`,
        null,
        { withCredentials: true }
      );

      const cart = res?.data;

      // 서버가 내려준 CartDTO로 스토어 동기화
      // 프로젝트에서 카트 갱신 액션 타입을 "GET_CART"/"SET_CART" 중 무엇을 쓰는지에 맞춰 사용하세요.
      dispatch({ type: "GET_CART", payload: cart });

      // 방금 증가시킨 상품의 최신 수량을 컴포넌트 state에도 반영 (있으면)
      const updatedItem = cart?.products?.find(p => p.productId === productId);
      if (updatedItem && typeof updatedItem.quantity === "number") {
        setCurrentQuantity?.(updatedItem.quantity);
      }

      toast?.success("수량을 1 증가했습니다.");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast?.error("로그인이 필요합니다.");
      } else {
        const msg = err?.response?.data?.message || "장바구니 업데이트 실패";
        toast?.error(msg);
      }
    }
  };



export const decreaseCartQuantity =
  (data, toast, currentQuantity, setCurrentQuantity) =>
  async (dispatch) => {
    const productId = data?.productId;
    if (!productId) {
      toast?.error("상품 ID가 없습니다.");
      return;
    }

    try {
      const res = await api.put(
        `/cart/products/${productId}/quantity/delete`,
        null,
        { withCredentials: true }
      );

      const cart = res?.data;

      // 서버가 내려준 CartDTO로 스토어 갱신
      dispatch({ type: "GET_CART", payload: cart });

      // 해당 상품의 최신 수량을 컴포넌트 state에도 반영
      const updatedItem = cart?.products?.find((p) => p.productId === productId);
      if (updatedItem && typeof updatedItem.quantity === "number") {
        setCurrentQuantity?.(updatedItem.quantity);
        toast?.success("수량을 1 감소했습니다.");
      } else {
        // 수량이 0이 되어 품목이 제거된 경우
        setCurrentQuantity?.(0);
        toast?.success("장바구니에서 품목이 제거되었습니다.");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast?.error("로그인이 필요합니다.");
      } else {
        const msg = err?.response?.data?.message || "장바구니 업데이트 실패";
        toast?.error(msg);
      }
    }
  };

export const removeFromCart =
  ({ cartId, productId, productName }, toast) =>
  async (dispatch, getState) => {
    try {
      // 1) 서버에 삭제 요청
      await api.delete(`/carts/${cartId}/product/${productId}`);

      // 2) 스토어에서 삭제 반영 (기존 리듀서의 REMOVE_CART 규약에 맞춰 payload 전달)
      //    - 기존 코드가 data 전체를 넘기던 형태였다면,
      //      리듀서가 productId만으로 삭제할 수 있게 수정했거나
      //      아래처럼 동일 구조로 맞춰주세요.
      dispatch({
        type: "REMOVE_CART",
        payload: { productId }, // 리듀서가 productId로 삭제하도록 권장
      });

      // 3) 로컬스토리지 동기화
      localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));

      // 4) 알림
      if (toast) toast.success(`${productName} removed from cart`);
    } catch (error) {
      // 서버/네트워크 에러 처리
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to remove item";
      if (toast) toast.error(msg);

      // 필요 시 실패 액션 디스패치 (옵션)
      dispatch({
        type: "REMOVE_CART_ERROR",
        payload: { productId, message: msg },
      });
    }
  };



export const authenticateSignInUser 
    = (sendData, toast, reset, navigate, setLoader) => async (dispatch) => {
        try {
            setLoader(true);
            const { data } = await api.post("/auth/signin", sendData);
            dispatch({ type: "LOGIN_USER", payload: data });
            localStorage.setItem("auth", JSON.stringify(data));
            reset();
            toast.success("Login Success");
            window.location.replace("/")
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || "Internal Server Error");
        } finally {
            setLoader(false);
        }
}

export const authenticateOAuthUser = (toast, navigate) => async (dispatch) => {
  try {
    const { data } = await api.get("/auth/user"); // 서버 쿠키로 인증
    dispatch({ type: "LOGIN_USER", payload: data });
    localStorage.setItem("auth", JSON.stringify(data));
    if (toast) toast.success("Login Success");
    if (navigate) navigate("/", { replace: true });
    else window.location.replace("/");
  } catch (error) {
    console.error(error);
    if (toast) toast.error(error?.response?.data?.message || "Failed to get user");
    if (navigate) navigate("/login", { replace: true });
  }
};



export const registerNewUser 
    = (sendData, toast, reset, navigate, setLoader) => async (dispatch) => {
        try {
            setLoader(true);
            const { data } = await api.post("/auth/signup", sendData);
            reset();
            toast.success(data?.message || "User Registered Successfully");
            navigate("/login");
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || error?.response?.data?.password || "Internal Server Error");
        } finally {
            setLoader(false);
        }
};


// export const logOutUser = (navigate) => (dispatch) => {
//     dispatch({ type:"LOG_OUT" });
//     localStorage.removeItem("auth");
//     navigate("/login");
// };

export const logOutUser = (navigate) => async (dispatch) => {
  try {
    await api.post("/auth/signout"); // 서버가 쿠키 삭제 + 세션 무효화
    toast.success("Signed out");
  } catch {
    toast.error("Logout request failed. Clearing local state...");
  } finally {
    // 1) 클라이언트 상태 초기화
    dispatch({ type: "LOG_OUT" });
    // 장바구니 등도 같이 비우려면:
    // dispatch({ type: "CLEAR_CART" });

    localStorage.removeItem("auth");
    try { await persistor?.purge?.(); } catch {}

    // 2) 하드 리로드로 완전 초기화
    //    - 라우터 상태/메모리/캐시가 모두 초기화됨
    if (typeof window !== "undefined") {
      window.location.replace("/login");
      // window.location.replace 사용 시 아래 navigate는 불필요
      return;
    }

    // (fallback) SSR 등 특수 환경이면 기존 navigate로 이동만
    navigate("/login", { replace: true });
  }
};

export const addUpdateUserAddress =
     (sendData, toast, addressId, setOpenAddressModal) => async (dispatch, getState) => {
    /*
    const { user } = getState().auth;
    await api.post(`/addresses`, sendData, {
          headers: { Authorization: "Bearer " + user.jwtToken },
        });
    */
    dispatch({ type:"BUTTON_LOADER" });
    try {
        if (!addressId) {
            const { data } = await api.post("/addresses", sendData);
        } else {
            await api.put(`/addresses/${addressId}`, sendData);
        }
        dispatch(getUserAddresses());
        toast.success("Address saved successfully");
        dispatch({ type:"IS_SUCCESS" });
    } catch (error) {
        console.log(error);
        toast.error(error?.response?.data?.message || "Internal Server Error");
        dispatch({ type:"IS_ERROR", payload: null });
    } finally {
        setOpenAddressModal(false);
    }
};


export const deleteUserAddress = 
    (toast, addressId, setOpenDeleteModal) => async (dispatch, getState) => {
    try {
        dispatch({ type: "BUTTON_LOADER" });
        await api.delete(`/addresses/${addressId}`);
        dispatch({ type: "IS_SUCCESS" });
        dispatch(getUserAddresses());
        dispatch(clearCheckoutAddress());
        toast.success("Address deleted successfully");
    } catch (error) {
        console.log(error);
        dispatch({ 
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Some Error Occured",
         });
    } finally {
        setOpenDeleteModal(false);
    }
};

export const clearCheckoutAddress = () => {
    return {
        type: "REMOVE_CHECKOUT_ADDRESS",
    }
};

export const getUserAddresses = () => async (dispatch, getState) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const { data } = await api.get(`/addresses`);
        dispatch({type: "USER_ADDRESS", payload: data});
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        console.log(error);
        dispatch({ 
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch user addresses",
         });
    }
};

export const selectUserCheckoutAddress = (address) => {
    return {
        type: "SELECT_CHECKOUT_ADDRESS",
        payload: address,
    }
};


export const addPaymentMethod = (method) => {
    return {
        type: "ADD_PAYMENT_METHOD",
        payload: method,
    }
};


export const createUserCart = (sendCartItems) => async (dispatch, getState) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        await api.post('/cart/create', sendCartItems);
        await dispatch(getUserCart());
    } catch (error) {
        console.log(error);
        dispatch({ 
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to create cart items",
         });
    }
};


export const getUserCart = () => async (dispatch) => {
  try {
    dispatch({ type: "IS_FETCHING" });
    const { data } = await api.get("/carts/users/cart");
    // 백엔드 응답이 { cartId, totalPrice, cartItems: [...] } 라고 가정
    const products = data.products ?? data.cartItems ?? [];
    const totalPrice = typeof data.totalPrice === "number"
      ? data.totalPrice
      : products.reduce(
          (acc, cur) =>
            acc +
            Number(cur?.specialPrice ?? cur?.unitPrice ?? 0) *
              Number(cur?.quantity ?? 0),
          0
        );

    dispatch({
      type: "GET_USER_CART_PRODUCTS",
      payload: products,
      totalPrice,
      cartId: data.cartId ?? null,
    });
  } catch (e) {
    dispatch({
      type: "IS_ERROR",
      payload: e?.response?.data?.message || "Failed to fetch cart items",
    });
  }
};
