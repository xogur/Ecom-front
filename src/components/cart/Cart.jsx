import { MdArrowBack, MdShoppingCart } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import ItemContent from "./ItemContent";
import CartEmpty from "./CartEmpty";
import { formatPrice } from "../../utils/formatPrice";
import { getUserCart } from "../../store/actions"

const Cart = () => {
  const dispatch = useDispatch();
  const { cart, cartId, totalPrice, status, error } = useSelector(
    (state) => state.carts
  );

  // 1) 마운트 시 GET
  useEffect(() => {
    console.log("[Cart] dispatch(getUserCart()) 호출");
    dispatch(getUserCart());
  }, [dispatch]);

  // 2) 상태 변화 로깅
  useEffect(() => {
    console.log("[Cart] status:", status);
    console.log("[Cart] error :", error);
    console.log("[Cart] cart  :", cart);
    console.log("[Cart] total :", totalPrice);
  }, [status, error, cart, totalPrice]);

  const subtotal = useMemo(() => {
    if (typeof totalPrice === "number") return totalPrice;
    return (cart || []).reduce(
      (acc, cur) =>
        acc +
        Number(cur?.specialPrice ?? cur?.unitPrice ?? 0) *
          Number(cur?.quantity ?? 0),
      0
    );
  }, [cart, totalPrice]);

  // 로딩/에러/빈 카트 분기 (필요시 유지)
  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col gap-4 justify-center items-center text-slate-600">
        <div>Loading your cart...</div>
        {/* RAW 상태 확인용 */}
        <pre className="text-xs bg-slate-100 p-3 rounded w-[90%] max-w-3xl overflow-auto">
{JSON.stringify({ status, error, cartLength: cart?.length, totalPrice }, null, 2)}
        </pre>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col gap-4 justify-center items-center text-red-600">
        <div>{error || "Failed to load cart"}</div>
        {/* RAW 상태 확인용 */}
        <pre className="text-xs bg-red-50 p-3 rounded w-[90%] max-w-3xl overflow-auto">
{JSON.stringify({ status, error }, null, 2)}
        </pre>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    // 빈 카트일 때도 RAW 출력
    return (
      <div className="flex flex-col items-center">
        <CartEmpty />
        <pre className="text-xs bg-slate-100 p-3 rounded w-[90%] max-w-3xl overflow-auto mt-4">
{JSON.stringify({ status, cart, totalPrice }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="lg:px-14 sm:px-8 px-4 py-10">
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <MdShoppingCart size={36} className="text-gray-700" />
          Your Cart
        </h1>
        <p className="text-lg text-gray-600 mt-2">All your selected items</p>
      </div>

      <div className="grid md:grid-cols-5 grid-cols-4 gap-4 pb-2 font-semibold items-center">
        <div className="md:col-span-2 justify-self-start text-lg text-slate-800 lg:ps-4">Product</div>
        <div className="justify-self-center text-lg text-slate-800">Price</div>
        <div className="justify-self-center text-lg text-slate-800">Quantity</div>
        <div className="justify-self-center text-lg text-slate-800">Total</div>
      </div>

      <div>
        {cart.map((item, i) => (
          <ItemContent key={item.productId ?? i} {...item} cartId={cartId}/>
        ))}
      </div>

      <div className="border-t-[1.5px] border-slate-200 py-4 flex sm:flex-row sm:px-0 px-2 flex-col sm:justify-between gap-4">
        <div></div>
        <div className="flex text-sm gap-1 flex-col">
          <div className="flex justify-between w-full md:text-lg text-sm font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <p className="text-slate-500">Taxes and shipping calculated at checkout</p>

          <Link className="w-full flex justify-end" to="/checkout">
            <button className="font-semibold w-[300px] py-2 px-4 rounded-sm bg-customBlue text-white flex items-center justify-center gap-2 hover:text-gray-300 transition duration-500">
              <MdShoppingCart size={20} />
              Checkout
            </button>
          </Link>

          <Link className="flex gap-2 items-center mt-2 text-slate-500" to="/products">
            <MdArrowBack />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* ✅ RAW 응답 상태 덤프 (임시 디버깅용) */}
      {/* <div className="mt-8">
        <h3 className="font-semibold mb-2">[Debug] Cart State Dump</h3>
        <pre className="text-xs bg-slate-100 p-3 rounded w-full overflow-auto">
{JSON.stringify({ status, error, cart, totalPrice, subtotal }, null, 2)}
        </pre>
      </div> */}
    </div>
  );
};

export default Cart;