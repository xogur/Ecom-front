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

    // 현재 수량 파악 (스토어 우선, 없으면 컴포넌트 state 보조)
    const prevItem = getState().carts.cart.find(i => i.productId === productId);
    const prevQty  = Number(prevItem?.quantity ?? currentQuantity ?? 0);
    const nextQty  = prevQty + 1;

    // ✅ 낙관적 업데이트(즉시 반영)
    dispatch({ type: "CART_UPDATE_QTY_OPTIMISTIC", payload: { productId, quantity: nextQty } });
    setCurrentQuantity?.(nextQty);

    try {
      const { data: dto } = await api.put(
        `/cart/products/${productId}/quantity/add`,
        null,
        { withCredentials: true }
      );

      // ✅ 서버 정합으로 최종 동기화 (리듀서의 CART_SET_FROM_SERVER 사용)
      dispatch({ type: "CART_SET_FROM_SERVER", payload: dto });

      // 최신 수량을 컴포넌트 state에도 반영(선택)
      const updated = Array.isArray(dto?.products)
        ? dto.products.find(p => p.productId === productId)
        : null;
      if (updated && typeof updated.quantity === "number") {
        setCurrentQuantity?.(updated.quantity);
      }

      toast?.success("수량을 1 증가했습니다.");
    } catch (err) {
      // ❗ 실패 → 롤백
      dispatch({ type: "CART_ROLLBACK_QTY", payload: { productId, prevQuantity: prevQty } });
      setCurrentQuantity?.(prevQty);

      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast?.error("로그인이 필요합니다.");
      } else {
        toast?.error(err?.response?.data?.message || "장바구니 업데이트 실패");
      }
    }
  };

/** 수량 -1 (0이면 화면상 0으로만 두고, 실제 삭제 여부는 서버 응답으로 정합 맞춤) */
export const decreaseCartQuantity =
  (data, toast, currentQuantity, setCurrentQuantity) =>
  async (dispatch, getState) => {
    const productId = data?.productId;
    if (productId == null) {
      toast?.error("상품 ID가 없습니다.");
      return;
    }

    // 스토어에 있는 동일 아이템을 먼저 찾고, 그 아이템의 productId를 "스토어용 id"로 사용
    const prevItem = getState().carts.cart.find(
      (i) => String(i.productId) === String(productId)
    );
    const idForStore = prevItem?.productId ?? productId; // 스토어에 저장된 타입 유지
    const prevQty    = Number(prevItem?.quantity ?? currentQuantity ?? 0);
    const nextQty    = Math.max(0, prevQty - 1);
    

    // ✅ 낙관적 업데이트(스토어에서 쓰던 id 타입으로 디스패치)
    dispatch({
      type: "CART_UPDATE_QTY_OPTIMISTIC",
      payload: { productId: idForStore, quantity: nextQty },
    });
    setCurrentQuantity?.(nextQty);

    try {
      // 서버 호출은 경로상 숫자가 안전
      const pidForUrl = Number(productId);
      const { data: dto } = await api.put(
        `/cart/products/${pidForUrl}/quantity/delete`,
        null,
        { withCredentials: true }
      );

      // ✅ 서버 정합 반영
      dispatch({ type: "CART_SET_FROM_SERVER", payload: dto });

      const updated = Array.isArray(dto?.products)
        ? dto.products.find((p) => String(p.productId) === String(productId))
        : null;

      if (updated && typeof updated.quantity === "number") {
        setCurrentQuantity?.(updated.quantity);
        toast?.success("수량을 1 감소했습니다.");
      } else {
        setCurrentQuantity?.(0);
        toast?.success("장바구니에서 품목이 제거되었습니다.");
      }
    } catch (err) {
      // ❗ 실패 → 롤백 (스토어에서 쓰던 id 타입으로 롤백)
      dispatch({
        type: "CART_ROLLBACK_QTY",
        payload: { productId: idForStore, prevQuantity: prevQty },
      });
      setCurrentQuantity?.(prevQty);

      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast?.error("로그인이 필요합니다.");
      } else {
        toast?.error(err?.response?.data?.message || "장바구니 업데이트 실패");
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
