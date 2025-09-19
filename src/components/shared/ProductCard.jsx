// src/components/product/ProductCard.jsx
import { useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import ProductViewModal from "./ProductViewModal";
import truncateText from "../../utils/truncateText";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/actions";
import toast from "react-hot-toast";

// ✅ 좋아요 버튼 컴포넌트(앞서 만든 공용 컴포넌트)
import LikeButton from "./LikeButton";

const ProductCard = ({
  productId,
  productName,
  image,
  description,
  quantity,
  price,
  discount,
  specialPrice,
  about = false,
}) => {
  const [openProductViewModal, setOpenProductViewModal] = useState(false);
  const btnLoader = false;
  const [selectedViewProduct, setSelectedViewProduct] = useState("");
  const isAvailable = quantity && Number(quantity) > 0;
  const dispatch = useDispatch();

  const handleProductView = (product) => {
    if (!about) {
      setSelectedViewProduct(product);
      setOpenProductViewModal(true);
    }
  };

  const addToCartHandler = (cartItems) => {
    dispatch(addToCart(cartItems, 1, toast));
  };

  return (
    <div className="border rounded-lg shadow-xl overflow-hidden transition-shadow duration-300">
      {/* 이미지 + 좋아요 오버레이 */}
      <div
        onClick={() => {
          handleProductView({
            id: productId,
            productName,
            image,
            description,
            quantity,
            price,
            discount,
            specialPrice,
          });
        }}
        className="relative w-full overflow-hidden aspect-[3/2] cursor-pointer group"
      >
        <img
          className="w-full h-full transition-transform duration-300 transform group-hover:scale-105 object-cover"
          src={image}
          alt={productName}
        />
        {/* ✅ 좋아요 버튼 (오버레이) */}
        <div
          className="absolute top-2 right-2"
          onClick={(e) => e.stopPropagation()} // 이미지 클릭(모달)과 이벤트 분리
        >
          <LikeButton productId={productId} />
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4">
        <h2
          onClick={() => {
            handleProductView({
              id: productId,
              productName,
              image,
              description,
              quantity,
              price,
              discount,
              specialPrice,
            });
          }}
          className="text-lg font-semibold mb-2 cursor-pointer"
        >
          {truncateText(productName, 50)}
        </h2>

        <div className="min-h-20 max-h-20">
          <p className="text-gray-600 text-sm">{truncateText(description, 80)}</p>
        </div>

        {!about && (
          <div className="flex items-center justify-between mt-3">
            {specialPrice ? (
              <div className="flex flex-col">
                <span className="text-gray-400 line-through">
                  ${Number(price).toFixed(2)}
                </span>
                <span className="text-xl font-bold text-slate-700">
                  ${Number(specialPrice).toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-slate-700">
                ${Number(price).toFixed(2)}
              </span>
            )}

            <button
              disabled={!isAvailable || btnLoader}
              onClick={() =>
                addToCartHandler({
                  image,
                  productName,
                  description,
                  specialPrice,
                  price,
                  productId,
                  quantity,
                })
              }
              className={`bg-blue-500 ${
                isAvailable ? "opacity-100 hover:bg-blue-600" : "opacity-70"
              } text-white text-sm py-2 px-3 rounded-lg items-center transition-colors duration-300 w-36 flex justify-center`}
            >
              <FaShoppingCart className="mr-2" />
              {isAvailable ? "카트에 담기" : "품절"}
            </button>
          </div>
        )}
      </div>

      {/* 상품 빠른보기 모달 */}
      <ProductViewModal
        open={openProductViewModal}
        setOpen={setOpenProductViewModal}
        product={selectedViewProduct}
        isAvailable={isAvailable}
      />
    </div>
  );
};

export default ProductCard;
