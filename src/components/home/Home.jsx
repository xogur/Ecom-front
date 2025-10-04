// src/components/home/Home.jsx
import HeroBanner from "./HeroBanner";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { fetchProducts } from "../../store/actions";
import ProductCard from "../shared/ProductCard";
import Loader from "../shared/Loader";
import { FaExclamationTriangle } from "react-icons/fa";
import useBatchProductLikes from "../../utils/useBatchProductLikes"; // ✅ 배치 훅

const Home = () => {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);
  const { isLoading, errorMessage } = useSelector((state) => state.errors);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // ✅ 화면에 보이는 상품만 추려서 배치 요청
  const visibleProducts = useMemo(() => (products || []).slice(0, 8), [products]);
  const ids = useMemo(() => visibleProducts.map((p) => p.productId), [visibleProducts]);

  // ✅ 한 번에 counts/liked 받아오기
  const { counts, liked, mutateOne, loading: likesLoading } = useBatchProductLikes(ids);

  return (
    <div className="lg:px-14 sm:px-8 px-4">
      <div className="py-6">
        <HeroBanner />
      </div>

      <div className="py-5">
        <div className="flex flex-col justify-center items-center space-y-2">
          <h1 className="text-slate-800 text-4xl font-bold"> Productss</h1>
          <span className="text-slate-700">지금 딱! 당신을 위한 인기 아이템을 모았어요</span>
        </div>

        {isLoading ? (
          <Loader />
        ) : errorMessage ? (
          <div className="flex justify-center items-center h-[200px]">
            <FaExclamationTriangle className="text-slate-800 text-3xl mr-2" />
            <span className="text-slate-800 text-lg font-medium">{errorMessage}</span>
          </div>
        ) : (
          <div className="pb-6 pt-14 grid 2xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-y-6 gap-x-6">
            {visibleProducts.map((item) => (
              <ProductCard
                key={item.productId}          // ✅ index 대신 명확한 key
                {...item}
                // ✅ 배치로 받은 값 주입
                likeCount={counts[item.productId] ?? 0}
                liked={!!liked[item.productId]}
                // ✅ 토글 후 캐시 동기화
                onLikeChange={(id, nextLiked, nextCount) => mutateOne(id, nextLiked, nextCount)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
