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
    (dispatch, getState) => {
        // Find the product
        const { products } = getState().products;
        
        const getProduct = products.find(
            (item) => item.productId === data.productId
        );

        const isQuantityExist = getProduct.quantity >= currentQuantity + 1;

        if (isQuantityExist) {
            const newQuantity = currentQuantity + 1;
            setCurrentQuantity(newQuantity);

            dispatch({
                type: "ADD_CART",
                payload: {...data, quantity: newQuantity + 1 },
            });
            localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
        } else {
            toast.error("Quantity Reached to Limit");
        }

    };



export const decreaseCartQuantity = 
    (data, newQuantity) => (dispatch, getState) => {
        dispatch({
            type: "ADD_CART",
            payload: {...data, quantity: newQuantity},
        });
        localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
    }

export const removeFromCart =  (data, toast) => (dispatch, getState) => {
    dispatch({type: "REMOVE_CART", payload: data });
    toast.success(`${data.productName} removed from cart`);
    localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
}



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
