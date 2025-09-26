const krwNumber = (n) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(
    Math.round(Number(n) || 0)
  );

// 12,000원
export const formatPrice = (amount) => `${krwNumber(amount)}원`;

// (수량 × 단가) → 12,000원
export const formatPriceCalculation = (quantity, price) =>
  `${krwNumber(Number(quantity) * Number(price))}원`;