import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api"; // 프로젝트 경로에 맞게 유지

const baseURL = import.meta.env.VITE_BACK_END_URL;
const PAGE_SIZE = 2;

// YYYY-MM-DD 또는 ISO 날짜에서 YYYY-MM-DD만 추출
function fmtDate(d) {
  if (!d) return "";
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

// YYYY-MM-DD 로 포맷
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

// 간단 금액 포맷(원하면 Intl.NumberFormat으로 교체 가능)
function fmtMoney(n) {
  if (n == null) return "0";
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  return num.toLocaleString();
}

export default function OrderProfile() {
  const [orders, setOrders] = useState([]);
  const [pageNumber, setPageNumber] = useState(0); // ✅ 0-based로 시작
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ 기간(개월) 상태: 1/2/3/6/12
  const [months, setMonths] = useState(1);

  // 날짜 계산
  const endDate = new Date();            // 오늘
  const startDate = monthsAgo(months);   // N개월 전
  const start = fmtYYYYMMDD(startDate);
  const end = fmtYYYYMMDD(endDate);

  // 서버에서 목록 가져오기
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await api.get("/order/users/orders", {
        params: {
          page: pageNumber,        // 0-based
          size: PAGE_SIZE,         // ✅ 한 페이지 2개
          sort: "orderDate,desc",
          startDate: start,        // YYYY-MM-DD
          endDate: end,            // YYYY-MM-DD
          // status: "PAID"        // 필요시 추가
        },
      });

      const data = res?.data ?? {};
      const content = Array.isArray(data.content) ? data.content : [];

      // 우선순위 1: totalPages, 2: totalElements로 계산
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

  // pageNumber 또는 months 변경 시 재조회
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, months]);

  // 페이지 버튼 1..N
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  // UI 렌더
  if (loading) return <div style={{ padding: 16 }}>불러오는 중…</div>;
  if (err) return <div style={{ padding: 16, color: "red" }}>{err}</div>;

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>내 주문 내역</h2>

      {/* ✅ 기간 필터 */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <label htmlFor="months">기간:</label>
        <select
          id="months"
          value={months}
          onChange={(e) => {
            setMonths(Number(e.target.value));
            setPageNumber(0); // 기간 바꾸면 1페이지로 이동
          }}
        >
          <option value={1}>1개월</option>
          <option value={2}>2개월</option>
          <option value={3}>3개월</option>
          <option value={6}>6개월</option>
          <option value={12}>1년</option>
        </select>
        <span style={{ color: "#6b7280" }}>
          ({start} ~ {end})
        </span>
      </div>

      {/* 주문 카드 목록 */}
      <div style={{ display: "grid", gap: 10 }}>
        {orders.length === 0 && (
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
            표시할 주문이 없습니다.
          </div>
        )}

        {orders.map((o) => {
          const items = Array.isArray(o.orderItems) ? o.orderItems : [];
          const firstItem = items[0];
          const firstProduct = firstItem?.product;
          const thumb = firstProduct?.image;

          return (
            <div
              key={o.orderId}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <div style={{ fontWeight: 700 }}>주문번호 #{o.orderId}</div>
                <div style={{ color: "#6b7280" }}>{fmtDate(o.orderDate)}</div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 14 }}>
                <span>
                  상태: <b>{o.orderStatus ?? "-"}</b>
                </span>
                <span>
                  총액: <b>{fmtMoney(o.totalAmount)}</b>
                </span>
                <span>
                  품목 수: <b>{items.length}</b>
                </span>
                {o.address?.city && (
                  <span style={{ color: "#6b7280" }}>
                    배송지: {o.address.city} {o.address.street ?? ""}
                  </span>
                )}
              </div>

              {/* 첫 상품 간단 썸네일/요약 (있으면 표시) */}
              {firstProduct && (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    borderTop: "1px dashed #e5e7eb",
                    paddingTop: 8,
                  }}
                >
                  {thumb && (
                    <img
                      src={
                        thumb.startsWith("http")
                          ? thumb
                          : `${baseURL}/images/${thumb}`
                      }
                      alt={firstProduct.productName}
                      width={56}
                      height={56}
                      style={{ borderRadius: 8, objectFit: "cover", border: "1px solid #eee" }}
                      onError={(e) => console.log("[img error]", e.currentTarget.src)}
                    />
                  )}
                  <div style={{ fontSize: 14 }}>
                    <div style={{ fontWeight: 600 }}>
                      {firstProduct.productName ?? "(상품명 없음)"}
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      수량 {firstItem?.quantity ?? 0} · 단가 {fmtMoney(firstProduct.price)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {pages.map((p) => {
          const active = pageNumber === p - 1;
          return (
            <button
              key={p}
              onClick={() => setPageNumber(p - 1)} // 서버는 0-based
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: active ? "#111827" : "#fff",
                color: active ? "#fff" : "#111827",
                cursor: "pointer",
              }}
              aria-current={active ? "page" : undefined}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
