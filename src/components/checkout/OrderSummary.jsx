import React, { useEffect, useMemo, useState } from 'react';
import { formatPriceCalculation } from '../../utils/formatPrice';

/**
 * props:
 *  - totalPrice: 장바구니 총액(포인트 적용 전, 숫자)
 *  - cart: 장바구니 아이템 배열
 *  - address: 선택된 주소
 *  - paymentMethod: 결제수단 문자열
 *  - onPreview?: (preview) => void  // 선택: 프리뷰 결과(최종결제금액/사용포인트 등)를 부모로 전달
 */
const OrderSummary = ({ totalPrice = 0, cart = [], address, paymentMethod, onPreview }) => {
  // === 포인트 관련 상태 ===
  const [pointsInput, setPointsInput] = useState(0);      // 사용자가 입력한 포인트(로컬 입력값)
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);           // 서버 프리뷰 응답
  const [error, setError] = useState('');

  // 백엔드 URL (vite 환경변수)
  const API_BASE = import.meta.env.VITE_BACK_END_URL || '';

  // 미리보기 호출 함수
  const callPreview = async (cartTotal, pointsToUse) => {
    if (!Number.isFinite(cartTotal) || cartTotal < 0) cartTotal = 0;
    if (!Number.isFinite(pointsToUse) || pointsToUse < 0) pointsToUse = 0;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/orders/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // JWT가 httpOnly 쿠키(springBootEcom)로 전달되는 경우
        body: JSON.stringify({ cartTotal, pointsToUse }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Preview failed with ${res.status}`);
      }
      const data = await res.json();

      setPreview(data);
      onPreview?.(data); // 부모(Checkout)로 프리뷰 전달 (최종 결제금액/사용포인트 등)
    } catch (e) {
      setError(e?.message || 'Failed to preview.');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  // 초기 진입 및 totalPrice 변경 시, 0포인트 기준 프리뷰
  useEffect(() => {
    callPreview(totalPrice, 0);
    setPointsInput(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice]);

  // 입력값 변경 디바운스(사용자가 타이핑 중일 때 호출 과다 방지)
  useEffect(() => {
    const t = setTimeout(() => {
      // 서버가 알아서 허용 범위로 클램프하므로, 여기선 0 이상의 숫자로만 보냅니다.
      callPreview(totalPrice, Math.max(0, Number(pointsInput || 0)));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsInput]);

  // 미리보기에서 최종 결제금액 계산 (프리뷰 없으면 totalPrice)
  const finalPay = useMemo(() => preview?.finalPay ?? totalPrice ?? 0, [preview, totalPrice]);

  // 입력 핸들러: 숫자 외 제거
  const onChangePoints = (e) => {
    const raw = `${e.target.value}`.replace(/\D/g, '');
    setPointsInput(raw ? Number(raw) : 0);
  };

  // 최대치 사용: 서버가 balance/total 기준으로 다시 클램프
  const useMax = () => {
    // 미리보기에서 balance가 보이면 그 값으로 한 번 더 요청 (UX 보정)
    const optimisticMax = preview?.myBalanceBefore ?? pointsInput;
    setPointsInput(optimisticMax);
    // 즉시 미리보기 갱신
    callPreview(totalPrice, optimisticMax);
  };

  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="flex flex-wrap">
        {/* 좌측: 주소/결제/아이템 */}
        <div className="w-full lg:w-8/12 pr-4">
          <div className="space-y-4">
            {/* Billing Address */}
            <div className="p-4 border rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-2">Billing Address</h2>
              <p><strong>Building Name: </strong>{address?.buildingName}</p>
              <p><strong>City: </strong>{address?.city}</p>
              <p><strong>Street: </strong>{address?.street}</p>
              <p><strong>State: </strong>{address?.state}</p>
              <p><strong>Pincode: </strong>{address?.pincode}</p>
              <p><strong>Country: </strong>{address?.country}</p>
            </div>

            {/* Payment Method */}
            <div className="p-4 border rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-2">Payment Method</h2>
              <p><strong>Method: </strong>{paymentMethod}</p>
            </div>

            {/* Order Items */}
            <div className="pb-4 border rounded-lg shadow-sm mb-6">
              <h2 className="text-2xl font-semibold mb-2">Order Items</h2>
              <div className="space-y-2">
                {cart?.map((item) => (
                  <div key={item?.productId} className="flex items-center gap-3">
                    <img
                      src={`${API_BASE}/images/${item?.image}`}
                      alt="Product"
                      className="w-12 h-12 rounded"
                    />
                    <div className="text-gray-500">
                      <p>{item?.productName}</p>
                      <p>
                        {item?.quantity} x ${item?.specialPrice} = {
                          formatPriceCalculation(item?.quantity, item?.specialPrice)
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 요약 + 포인트 입력 */}
        <div className="w-full lg:w-4/12 mt-4 lg:mt-0">
          <div className="border rounded-lg shadow-sm p-4 space-y-4">
            <h2 className="text-2xl font-semibold mb-2">Order Summary</h2>

            {/* === 포인트 사용 박스 === */}
            <div className="p-3 border rounded space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600">Use Points</label>
                  <input
                    value={pointsInput}
                    onChange={onChangePoints}
                    inputMode="numeric"
                    className="border rounded px-3 py-2 w-full text-right"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Balance: <b>{(preview?.myBalanceBefore ?? 0).toLocaleString()} P</b>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={useMax}
                  className="h-10 px-4 rounded bg-black text-white"
                >
                  Use Max
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              <div className="grid grid-cols-1 gap-2 text-sm">
                <Row k="Allowed Points To Use" v={`${(preview?.pointsToUse ?? 0).toLocaleString()} P`} r={loading} />
                <Row k="Expected Earn (5%)" v={`${(preview?.willEarn ?? 0).toLocaleString()} P`} r={loading} />
                <Row
                  k="Balance → After Use → After Earn"
                  v={
                    preview
                      ? `${(preview.myBalanceBefore).toLocaleString()}P → ${(preview.myBalanceAfterUse).toLocaleString()}P → ${(preview.myBalanceAfterEarn).toLocaleString()}P`
                      : '—'
                  }
                  r={loading}
                />
              </div>
            </div>

            {/* === 금액 요약 === */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Products</span>
                <span>${formatPriceCalculation(totalPrice, 1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Points Used</span>
                <span>- {formatCurrency(preview?.pointsToUse ?? 0)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Final Pay</span>
                <span>{formatCurrency(finalPay)}</span>
              </div>
            </div>

            {loading && (
              <p className="text-xs text-gray-500">Updating preview...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Row({ k, v, r }) {
  return (
    <div className="flex justify-between border rounded px-3 py-2">
      <span className="text-gray-600">{k}</span>
      <span className="font-semibold">{r ? '...' : v}</span>
    </div>
  );
}

function formatCurrency(n) {
  const x = Number(n || 0);
  // formatPriceCalculation(amount, 1) 는 금액 문자열 반환(프로젝트 함수 재사용 필요 시 교체)
  // 여기선 간단히 toLocaleString 사용
  return `$${x.toLocaleString()}`;
}

export default OrderSummary;
