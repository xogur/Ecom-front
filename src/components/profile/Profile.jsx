// src/components/profile/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { AiFillHeart } from "react-icons/ai";

const PAGE_SIZE = 12;
const baseURL = import.meta.env.VITE_BACK_END_URL;

const fmtMoney = (n) => {
  const num = Number(n ?? 0);
  return Number.isFinite(num) ? num.toLocaleString() : String(n);
};
const truncate = (s, len = 50) => (!s ? "" : s.length > len ? s.slice(0, len) + "…" : s);

export default function Profile() {
  // ✅ 포인트 상태
  const [pointBalance, setPointBalance] = useState(0);
  const [pointLoading, setPointLoading] = useState(false);
  const [pointErr, setPointErr] = useState("");

  // 좋아요 목록 상태
  const [items, setItems] = useState([]);
  const [pageNumber, setPageNumber] = useState(0); // 0-based
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ 포인트 불러오기
  const fetchPointBalance = async () => {
    try {
      setPointLoading(true);
      setPointErr("");
      const res = await api.get("/points/balance"); // withCredentials는 api 인스턴스에서 처리
      // BalanceRes가 { balance: number } 형태라고 가정
      const bal = Number(res?.data?.balance ?? res?.data ?? 0);
      setPointBalance(Number.isFinite(bal) ? bal : 0);
    } catch (e) {
      console.error(e);
      setPointErr("포인트를 불러오지 못했습니다.");
    } finally {
      setPointLoading(false);
    }
  };

  // 좋아요 목록 불러오기
  const fetchLiked = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await api.get("/likes/my", {
        params: { page: pageNumber, size: PAGE_SIZE, sort: "productId,desc" },
      });
      const data = res?.data ?? {};
      const content = Array.isArray(data.content) ? data.content : [];

      // ✅ totalPages 우선 사용, 없으면 totalElements/size 로 보정
      const sizeFromServer = Number(data.size) || PAGE_SIZE;
      let tp = Number(data.totalPages);
      if (!Number.isFinite(tp) || tp < 1) {
        const total = Number(data.totalElements ?? content.length);
        tp = Math.max(1, Math.ceil(total / sizeFromServer));
      }

      setItems(content);
      setTotalPages(tp);
    } catch (e) {
      console.error(e);
      setErr("좋아요한 상품을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 최초 진입 시 포인트 + 좋아요 목록 로드
  useEffect(() => {
    fetchPointBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    fetchLiked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  // 1..N 페이지 목록
  const pages = useMemo(
    () => Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1),
    [totalPages]
  );

  // 좋아요 토글(내 목록에서 제거)
  const handleToggle = async (productId) => {
    try {
      setItems((prev) => prev.filter((p) => p.productId !== productId));
      await api.post(`/products/${productId}/like/toggle`);
      // 현재 페이지가 비면 이전 페이지로
      setItems((prev) => {
        if (prev.length === 0 && pageNumber > 0) {
          setPageNumber((pn) => pn - 1);
        }
        return prev;
      });
    } catch (e) {
      console.error(e);
      fetchLiked();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ✅ 내 포인트 카드 */}
      <div className="mb-6 flex items-center justify-between border rounded-lg p-4 bg-white shadow-sm">
        <div>
          <h3 className="text-sm text-gray-500">내 포인트</h3>
          <div className="text-2xl font-bold">
            {pointLoading ? "불러오는 중…" : `₩${fmtMoney(pointBalance)} P`}
          </div>
          {pointErr && <div className="text-xs text-red-600 mt-1">{pointErr}</div>}
        </div>
        <button
          onClick={fetchPointBalance}
          className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          title="포인트 새로고침"
        >
          새로고침
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-4">내가 좋아요한 상품</h2>

      {loading && <div className="text-gray-500 mb-4">불러오는 중…</div>}
      {err && <div className="text-red-600 mb-4">{err}</div>}
      {!loading && !err && items.length === 0 && (
        <div className="border border-gray-200 rounded-lg p-6 text-gray-600">
          아직 좋아요한 상품이 없습니다.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => {
          const { productId, productName, image, price, specialPrice, likeCount } = p;
          const imgSrc = image
            ? image.startsWith("http")
              ? image
              : `${baseURL}/images/${image}`
            : undefined;

          return (
            <div
              key={productId}
              className="border rounded-lg shadow-sm hover:shadow-md overflow-hidden transition-shadow duration-200 flex flex-col"
            >
              <div className="relative aspect-[3/2] bg-gray-50">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={productName}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    이미지 없음
                  </div>
                )}

                <button
                  onClick={() => handleToggle(productId)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                  title="좋아요 취소"
                >
                  <AiFillHeart className="text-rose-600" size={20} />
                </button>
              </div>

              <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-sm font-semibold mb-1">
                  {truncate(productName, 40)}
                </h3>

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex flex-col">
                    {specialPrice ? (
                      <>
                        <span className="text-gray-400 line-through text-xs">
                          ₩{fmtMoney(price)}
                        </span>
                        <span className="text-lg font-bold text-slate-800">
                          ₩{fmtMoney(specialPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-slate-800">
                        ₩{fmtMoney(price)}
                      </span>
                    )}
                  </div>

                  {typeof likeCount === "number" && (
                    <span className="text-xs text-gray-500">
                      ❤️ {likeCount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ 전체 페이지 숫자 노출 + 이전/다음 */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {/* 현재 페이지 표시 */}
          <span className="text-sm text-gray-600 mr-2">
            페이지 {pageNumber + 1} / {totalPages}
          </span>

          {/* 이전 */}
          <button
            onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
            disabled={pageNumber === 0}
            className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50"
          >
            이전
          </button>

          {/* 숫자 버튼들 */}
          {pages.map((p) => {
            const active = pageNumber === p - 1;
            return (
              <button
                key={p}
                onClick={() => setPageNumber(p - 1)}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    : "px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                }
              >
                {p}
              </button>
            );
          })}

          {/* 다음 */}
          <button
            onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
            disabled={pageNumber >= totalPages - 1}
            className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
