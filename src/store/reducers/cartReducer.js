const initialState = {
  cart: [],
  totalPrice: 0,
  cartId: null,
};

const priceOf = (item) =>
  Number(
    item?.specialPrice ??
    item?.unitPrice ??
    item?.productPrice ?? // ✅ 누락돼 있던 필드 포함
    item?.price ??
    0
  );

// 숫자/문자 섞여와도 안전 비교
const idEq = (a, b) => String(a) === String(b);

const computeTotal = (cart = []) =>
  cart.reduce((acc, it) => acc + priceOf(it) * Number(it?.quantity ?? 0), 0);

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_CART": {
      const productToAdd = action.payload;
      const exists = state.cart.some((it) => idEq(it.productId, productToAdd.productId));
      const cart = exists
        ? state.cart.map((it) =>
            idEq(it.productId, productToAdd.productId) ? { ...it, ...productToAdd } : it
          )
        : [...state.cart, productToAdd];

      return { ...state, cart, totalPrice: computeTotal(cart) };
    }

    case "REMOVE_CART": {
      const cart = state.cart.filter((it) => !idEq(it.productId, action.payload.productId));
      return { ...state, cart, totalPrice: computeTotal(cart) };
    }

    case "CART_UPDATE_QTY_OPTIMISTIC": {
      const { productId, quantity } = action.payload;
      const cart = state.cart.map((it) =>
        idEq(it.productId, productId) ? { ...it, quantity } : it
      );
      return { ...state, cart, totalPrice: computeTotal(cart) };
    }

    case "CART_ROLLBACK_QTY": {
      const { productId, prevQuantity } = action.payload;
      const cart = state.cart.map((it) =>
        idEq(it.productId, productId) ? { ...it, quantity: prevQuantity } : it
      );
      return { ...state, cart, totalPrice: computeTotal(cart) };
    }
    

    case "CART_SET_FROM_SERVER": {
      const dto = action.payload || {};
      const products = Array.isArray(dto) ? dto : dto.products || [];
      const cart = products.map((p) => ({ ...p }));
      const total =
        typeof (Array.isArray(dto) ? action.totalPrice : dto.totalPrice) === "number"
          ? (Array.isArray(dto) ? action.totalPrice : dto.totalPrice)
          : computeTotal(cart);

      return {
        ...state,
        cart,
        totalPrice: total,
        cartId: (Array.isArray(dto) ? action.cartId : dto.cartId) ?? state.cartId,
      };
    }

    case "GET_USER_CART_PRODUCTS": {
      if (Array.isArray(action.payload)) {
        const cart = action.payload.map((p) => ({ ...p }));
        const total =
          typeof action.totalPrice === "number" ? action.totalPrice : computeTotal(cart);
        return { ...state, cart, totalPrice: total, cartId: action.cartId ?? state.cartId };
      }
      if (action.payload && typeof action.payload === "object") {
        const { products = [], totalPrice, cartId } = action.payload;
        const cart = products.map((p) => ({ ...p }));
        return {
          ...state,
          cart,
          totalPrice: typeof totalPrice === "number" ? totalPrice : computeTotal(cart),
          cartId: cartId ?? state.cartId,
        };
      }
      return state;
    }

    case "CART_CLEAR":
      return { ...state, cart: [], totalPrice: 0, cartId: null };

    default:
      return state;
  }
};
