// ✅ React Component: PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CircularProgress } from '@mui/material';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [pgToken, setPgToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("pg_token");
    setPgToken(token);

    const approvePayment = async () => {
      try {
        const response = await axios.post("http://localhost:8080/api/pay/approve", {
          pgToken: token,
          userId: "user-001"
        });
        setOrderDetails(response.data); // ✅ 주문 정보 저장
      } catch (error) {
        console.error("카카오페이 승인 오류:", error);
        setOrderDetails({ error: true });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      approvePayment();
    }
  }, [location]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  if (orderDetails?.error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-red-600 text-xl font-semibold">결제 승인에 실패했습니다.</p>
        <button
          onClick={() => navigate('/cart')}
          className="mt-4 bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
        >
          장바구니로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />
      <h1 className="text-2xl font-bold mt-4">결제가 성공적으로 완료되었습니다 🎉</h1>
      <p className="text-gray-600 mt-2">주문이 정상적으로 접수되었습니다.</p>

      <div className="mt-4 text-left">
        <h2 className="text-lg font-semibold mb-2">주문 내역</h2>
        <ul className="text-sm text-gray-700">
          {orderDetails?.items?.map((item, index) => (
            <li key={index} className="mb-1">
              - {item.name} / 수량: {item.quantity} / 가격: {item.price}원
            </li>
          ))}
        </ul>
        <p className="mt-2 text-gray-800 font-semibold">총 결제 금액: {orderDetails.totalAmount}원</p>
        <p className="text-gray-500 text-sm mt-1">결제번호 (TID): {orderDetails.tid}</p>
      </div>

      <button
        onClick={() => navigate('/orders')}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        주문 내역 보기
      </button>
    </div>
  );
};

export default PaymentSuccess;
