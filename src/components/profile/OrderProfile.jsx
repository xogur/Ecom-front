import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../css/orderListStyle.css";

const baseURL = import.meta.env.VITE_BACK_END_URL;
const PAGE_SIZE = 2;

// YYYY-MM-DD만 추출
function fmtDate(d) {
  if (!d) return "";
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

// YYYY-MM-DD 포맷
function fmtYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 오늘 기준 N개월 전
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

// 간단 금액 포맷
function fmtMoney(n) {
  if (n == null) return "0";
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  return num.toLocaleString();
}

export default function OrderProfile() {
  const [orders, setOrders] = useState([]);
  const [pageNumber, setPageNumber] = useState(0); // 0-based
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ 기간(개월): 처음엔 null(=전체/미지정). 선택되면 1/2/3/6/12 중 하나
  const [months, setMonths] = useState(null);

  // ✅ months가 있을 때만 날짜 범위를 계산(표시용)
  const { startStr, endStr } = useMemo(() => {
    if (months == null) return { startStr: null, endStr: null };
    const endDate = new Date();
    const startDate = monthsAgo(months);
    return { startStr: fmtYYYYMMDD(startDate), endStr: fmtYYYYMMDD(endDate) };
  }, [months]);

  // 서버 호출
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErr("");

      // ✅ 파라미터를 조건부로 구성: null이면 아예 안 보냄
      const params = {
        page: pageNumber,
        size: PAGE_SIZE,
        sort: "orderDate,desc",
      };

      // 정책 1) months만 보내고 날짜는 서버에서 계산하게 할 경우:
      if (months != null) {
        params.months = months;
        // 정책 2) 직접 날짜를 보낼 거면 아래 두 줄을 사용하고 months는 빼면 됨.
        // params.startDate = startStr;
        // params.endDate = endStr;
      }

      const res = await api.get("/order/users/orders", { params });

      const data = res?.data ?? {};
      const content = Array.isArray(data.content) ? data.content : [];
      let tp = Number(data.totalPages);
      if (!Number.isFinite(tp) || tp <= 0) {
        const total = Number(data.totalElements ?? data.total ?? content.length);
        tp = Math.max(1, Math.ceil(total / PAGE_SIZE));
      }

      setOrders(content);
      setTotalPages(tp);
    } catch (e) {
      setErr("주문 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, months]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  if (loading) return <div style={{ padding: 16 }}>불러오는 중…</div>;
  if (err) return <div style={{ padding: 16, color: "red" }}>{err}</div>;

  return (
    <div id="webcrumbs">
      <div className="p-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">내 주문 내역</h2>

        {/* 기간 필터 */}
        <div className="flex items-center gap-3 mb-6">
          <label htmlFor="months" className="font-medium">
            기간:
          </label>
          <select
            id="months"
            value={months ?? ""} // "" = 전체(미지정)
            onChange={(e) => {
              const v = e.target.value;
              setMonths(v === "" ? null : Number(v));
              setPageNumber(0);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          >
            {/* ✅ 기본값: 전체(=null) */}
            <option value="">전체</option>
            <option value={1}>1개월</option>
            <option value={2}>2개월</option>
            <option value={3}>3개월</option>
            <option value={6}>6개월</option>
            <option value={12}>1년</option>
          </select>

          <span className="text-gray-500 text-sm">
            {months == null ? "(전체 기간)" : `(${startStr} ~ ${endStr})`}
          </span>
        </div>

        {/* 상태 영역 */}
        {loading && <div className="text-gray-500 mb-4">불러오는 중…</div>}
        {err && (
          <div className="text-red-600 mb-4">주문 목록을 불러오지 못했습니다.</div>
        )}

        {/* 주문 목록 */}
        <div className="space-y-4">
          {orders.length === 0 && !loading && !err && (
            <div className="border border-gray-200 rounded-lg p-4 text-gray-600">
              표시할 주문이 없습니다.
            </div>
          )}

          {orders.map((o) => {
            const items = Array.isArray(o.orderItems) ? o.orderItems : [];
            const firstItem = items[0];
            const firstProduct = firstItem?.product;
            const thumb = firstProduct?.image;
            const imgSrc =
              thumb && (thumb.startsWith("http") ? thumb : `${baseURL}/images/${thumb}`);

            return (
              <div
                key={o.orderId}
                className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-baseline mb-2">
                  <div className="font-bold text-lg">주문번호 #{o.orderId}</div>
                  <div className="text-gray-500">{fmtDate(o.orderDate)}</div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-3">
                  <span>
                    상태:{" "}
                    <span className="font-semibold text-primary-600">
                      {o.orderStatus ?? "-"}
                    </span>
                  </span>
                  <span>
                    총액: <span className="font-semibold">{fmtMoney(o.totalAmount)}원</span>
                  </span>
                  <span>
                    품목 수: <span className="font-semibold">{items.length}</span>
                  </span>
                  {o.address?.city && (
                    <span className="text-gray-500">
                      배송지: {o.address.city} {o.address.street ?? ""}
                    </span>
                  )}
                </div>

                {firstProduct && (
                  <div className="flex gap-3 items-center border-t border-dashed border-gray-200 pt-3 group">
                    <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={firstProduct.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => console.log("[img error]", e.currentTarget.src)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold">
                        {firstProduct.productName ?? "(상품명 없음)"}
                      </div>
                      <div className="text-gray-500">
                        수량 {firstItem?.quantity ?? 0} · 단가 {fmtMoney(firstProduct.price)}원
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {pages.map((p) => {
              const active = pageNumber === p - 1;
              return (
                <button
                  key={p}
                  onClick={() => setPageNumber(p - 1)}
                  className={
                    active
                      ? "px-4 py-2 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                      : "px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  }
                  aria-current={active ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
