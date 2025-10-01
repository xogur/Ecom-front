import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_BACK_END_URL;

const PaymentSuccess = () => {
  const location = useLocation();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const pgToken = searchParams.get('pg_token');
  const userId = searchParams.get('userId');

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/pay/success`, {
          params: { pg_token: pgToken, userId }
        });
        console.log('✅ 결제 응답:', response.data);
        setPaymentData(response.data);
      } catch (err) {
        console.error("❌ 결제 승인 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    if (pgToken && userId) fetchPaymentData();
  }, [pgToken, userId]);

  if (loading) return <div className="text-center py-10">로딩 중...</div>;
  if (!paymentData) return <div className="text-center py-10 text-red-500">주문 정보를 불러올 수 없습니다.</div>;

  const { kakaoResponse, productName, quantity, totalPrice, order } = paymentData;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">결제 및 주문 완료</h2>

      {/* ✅ 결제 정보 */}
      <section className="mb-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">결제 정보</h3>
        <p><strong>결제 수단:</strong> {kakaoResponse.payment_method_type}</p>
        <p><strong>상품명:</strong> {kakaoResponse.item_name}</p>
        <p><strong>결제 금액:</strong> {kakaoResponse.amount?.total.toLocaleString()}원</p>
        <p><strong>결제 시각:</strong> {new Date(kakaoResponse.approved_at).toLocaleString()}</p>
      </section>

      {/* ✅ 주문 정보 */}
      <section className="mb-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">주문 정보</h3>
        <p><strong>주문자:</strong> {order.email}</p>
        <p><strong>주문일자:</strong> {order.orderDate}</p>
        <p><strong>주문 상태:</strong> {order.orderStatus}</p>
        <p><strong>총 금액:</strong> {order.totalAmount.toLocaleString()}원</p>
      </section>

      {/* ✅ 배송지 정보 (예시: addressId로 배송지 조회하거나 서버에서 address 포함하도록 수정 필요) */}
      <section className="mb-6 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">배송지 정보</h3>
        <p><strong>도시:</strong> {order.address?.city}</p>
        <p><strong>도로명 주소:</strong> {order.address?.street}</p>
        <p><strong>우편번호:</strong> {order.address?.pincode}</p>
      </section>

      {/* ✅ 주문 상품 이미지 및 상세 정보 */}
      <section className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">주문 상품</h3>
        {order.orderItems.map((item) => (
          <div key={item.orderItemId} className="mb-4 flex gap-4 items-center">
            <img
              src={`${baseURL}/images/${item.product.image}`}
              alt={item.product.productName}
              className="w-20 h-20 border rounded"
            />
            <div>
              <p><strong>{item.product.productName}</strong></p>
              <p>{item.quantity}개 × {item.product.specialPrice.toLocaleString()}원</p>
              <p><strong>총:</strong> {item.orderedProductPrice.toLocaleString()}원</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default PaymentSuccess;
