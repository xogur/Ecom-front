import { HiOutlineTrash } from "react-icons/hi";
import SetQuantity from "./SetQuantity";
import { useDispatch, useSelector } from "react-redux";
import {
  decreaseCartQuantity,
  increaseCartQuantity,
  removeFromCart,
} from "../../store/actions";
import toast from "react-hot-toast";
import { formatPrice } from "../../utils/formatPrice";
import truncateText from "../../utils/truncateText";

const baseURL = import.meta.env.VITE_BACK_END_URL;

const ItemContent = ({
  productId,
  productName,
  image,
  description,
  quantity,       // ✅ 부모에서 내려준 최신 수량
  price,
  discount,
  specialPrice,
  cartId,
}) => {
  const dispatch = useDispatch();

  // ✅ 혹시 부모 props가 늦게 올 때도 스토어에 반영된 최신 수량을 우선 사용
  const qtyFromStore = useSelector(
    (s) =>
      s.carts.cart.find((i) => String(i.productId) === String(productId))
        ?.quantity
  );
  const currentQuantity = Number(
    qtyFromStore ?? quantity ?? 0 // 스토어 → props → 0 순으로 fallback
  );

  const handleQtyIncrease = () => {
    dispatch(
      increaseCartQuantity(
        {
          image,
          productName,
          description,
          specialPrice,
          price,
          productId,
          quantity: currentQuantity, // ✅ 넘겨받은 값 사용
        },
        toast
      )
    );
  };

  const handleQtyDecrease = () => {
    // 0 미만 방지(서버가 0에서 삭제 처리한다면 0까지 허용해도 됨)
    if (currentQuantity <= 0) return;

    dispatch(
      decreaseCartQuantity(
        {
          image,
          productName,
          description,
          specialPrice,
          price,
          productId,
          quantity: currentQuantity, // ✅ 넘겨받은 값 사용
        },
        toast
      )
    );
  };

  const handleRemove = () => {
    dispatch(
      removeFromCart(
        {
          cartId,
          productId,
          productName,
        },
        toast
      )
    );
  };

  const unit = Number(specialPrice ?? price ?? 0);

  return (
    <div className="grid md:grid-cols-5 grid-cols-4 md:text-md text-sm gap-4 items-center border-[1px] border-slate-200 rounded-md lg:px-4 py-4 p-2">
      <div className="md:col-span-2 justify-self-start flex flex-col gap-2">
        <div className="flex md:flex-row flex-col lg:gap-4 sm:gap-3 gap-0 items-start">
          <h3 className="lg:text-[17px] text-sm font-semibold text-slate-600">
            {truncateText(productName)}
          </h3>
        </div>

        <div className="md:w-36 sm:w-24 w-12">
          <img
            src={`${baseURL}/images/${image}`}
            alt={productName}
            className="md:h-36 sm:h-24 h-12 w-full object-cover rounded-md"
          />

          <div className="flex items-start gap-5 mt-3">
            <button
              onClick={handleRemove}
              className="flex items-center font-semibold space-x-2 px-4 py-1 text-xs border border-rose-600 text-rose-600 rounded-md hover:bg-red-50 transition-colors duration-200"
            >
              <HiOutlineTrash size={16} className="text-rose-600" />
              Remove
            </button>
          </div>
        </div>
      </div>

      <div className="justify-self-center lg:text-[17px] text-sm text-slate-600 font-semibold">
        {formatPrice(unit)}
      </div>

      <div className="justify-self-center">
        <SetQuantity
          quantity={currentQuantity}      // ✅ 화면 표시도 props/스토어 기반
          cardCounter={true}
          handeQtyIncrease={handleQtyIncrease}
          handleQtyDecrease={handleQtyDecrease}
        />
      </div>

      <div className="justify-self-center lg:text-[17px] text-sm text-slate-600 font-semibold">
        {formatPrice(currentQuantity * unit)}
      </div>
    </div>
  );
};

export default ItemContent;
