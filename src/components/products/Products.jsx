// src/components/products/ index.jsx (혹은 현재 Products 파일 위치)
import { FaExclamationTriangle } from "react-icons/fa";
import ProductCard from "../shared/ProductCard";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { fetchCategories } from "../../store/actions";
import Filter from "./Filter";
import Loader from "../shared/Loader";
import Paginations from "../shared/Paginations";
import useBatchProductLikes from "../../utils/useBatchProductLikes";
import { useSearchParams } from "react-router-dom";
import api from "../../api/api";

const DEFAULT_PAGE_SIZE = 8;

const Products = () => {
  const dispatch = useDispatch();
  const { isLoading, errorMessage } = useSelector((state) => state.errors);
  const { categories } = useSelector((state) => state.products);

  // URL 쿼리
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromURL = Math.max(1, Number(searchParams.get("page") || 0)); // 1-base
  const sizeFromURL = Math.max(1, Number(searchParams.get("size") || DEFAULT_PAGE_SIZE));
  const sortBy      = searchParams.get("sortby")    || "price";
  const sortOrder   = searchParams.get("order")     || "asc";
  const category    = searchParams.get("category")  || "";
  const keyword     = searchParams.get("keyword")   || "";

  // 로컬 상태(주문 예시처럼)
  const [products, setProducts] = useState([]);
  const [pageNumber, setPageNumber] = useState(pageFromURL - 1); // 0-base
  const [pageSize, setPageSize] = useState(sizeFromURL);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 카테고리만 Redux로 유지
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // URL -> 로컬 페이지/사이즈 동기화
  useEffect(() => {
    setPageNumber(pageFromURL - 1);
    setPageSize(sizeFromURL);
  }, [pageFromURL, sizeFromURL]);

  // 상품 조회
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const params = {
          pageNumber,                // 0-base
          pageSize,                  // 페이지 크기
          sortBy,                    // e.g. "price"
          sortOrder,                 // "asc" | "desc"
        };
        if (category) params.category = category;
        if (keyword)  params.keyword  = keyword;

        const { data } = await api.get("/public/products", {
          params,
          signal: controller.signal,
        });

        // 서버 응답(ProductResponse)에 맞춰 세팅
        setProducts(Array.isArray(data?.content) ? data.content : []);
        setTotalPages(Number(data?.totalPages ?? 1));
        setTotalElements(Number(data?.totalElements ?? 0));
      } catch (e) {
        if (e.name !== "CanceledError") {
          setErr("상품을 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [pageNumber, pageSize, sortBy, sortOrder, category, keyword]);

  // 좋아요 배치 조회 (화면에 보이는 것만)
  const ids = useMemo(() => (products || []).map((p) => p.productId), [products]);
  const { counts, liked, mutateOne } = useBatchProductLikes(ids);

  // 페이지네이션 변경 핸들러 (MUI Pagination이 URL의 page=1-base를 바꾸도록)
  const handlePageChange = (_e, value) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(value));     // 1-base 유지
    next.set("size", String(pageSize));  // 필요 시 유지
    setSearchParams(next);
    // pageNumber는 위의 useEffect(URL -> 로컬 동기화)에서 자동으로 갱신됨
  };

  return (
    <div className="lg:px-14 sm:px-8 px-4 py-14 2xl:w-[90%] 2xl:mx-auto">
      <Filter categories={categories ?? []} />

      {isLoading || loading ? (
        <Loader />
      ) : errorMessage || err ? (
        <div className="flex justify-center items-center h-[200px]">
          <FaExclamationTriangle className="text-slate-800 text-3xl mr-2" />
          <span className="text-slate-800 text-lg font-medium">
            {errorMessage || err}
          </span>
        </div>
      ) : (
        <div className="min-h-[700px]">
          <div className="pb-6 pt-14 grid 2xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-y-6 gap-x-6">
            {(products || []).map((item) => (
              <ProductCard
                key={item.productId}
                {...item}
                likeCount={counts[item.productId] ?? 0}
                liked={!!liked[item.productId]}
                onLikeChange={(id, nextLiked, nextCount) =>
                  mutateOne(id, nextLiked, nextCount)
                }
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center pt-10">
            <Paginations
              numberOfPage={totalPages}
              totalProducts={totalElements}
              // 기존 컴포넌트는 내부에서 URL의 page를 읽지만,
              // onChange를 내려주면 그대로 사용하게끔 확장(아래처럼 prop을 받을 수 있게 Paginations를 살짝 수정해도 됨)
              onChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
