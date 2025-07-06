import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Skeleton from '../shared/Skeleton'; // 기존과 동일하게 사용
import toast from 'react-hot-toast';

const KakaoPaymentConfirmation = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const pgToken = searchParams.get("pg_token");

  const { cart } = useSelector((state) => state.carts);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentResult, setPaymentResult] = useState(null);

  const selectedUserCheckoutAddress = localStorage.getItem("CHECKOUT_ADDRESS")
    ? JSON.parse(localStorage.getItem("CHECKOUT_ADDRESS"))
    : null;

  useEffect(() => {
    const approvePayment = async () => {
      try {
        const response = await axios.post("http://localhost:8080/api/pay/approve", {
          pgToken,
          userId: "user-001" // ✔️ 실제 로그인 사용자 이메일/ID로 교체 필요
        });

        console.log("✅ 결제 승인 결과:", response.data);
        setPaymentResult(response.data);
        toast.success("카카오페이 결제 완료");
      } catch (error) {
        console.error("❌ 결제 승인 실패:", error);
        setErrorMessage("결제 승인에 실패했습니다.");
        toast.error("결제 승인 실패");
      } finally {
        setLoading(false);
      }
    };

    if (pgToken && cart && cart.length > 0) {
      approvePayment();
    }
  }, [pgToken, cart]);

  return (
    <div className='min-h-screen flex items-center justify-center'>
      {loading ? (
        <div className='max-w-xl mx-auto'>
          <Skeleton />
        </div>
      ) : errorMessage ? (
        <div className="p-8 rounded-lg shadow-lg text-center max-w-md mx-auto border border-red-300">
          <p className="text-red-600 font-semibold text-lg">{errorMessage}</p>
        </div>
      ) : (
        <div className="p-8 rounded-lg shadow-lg text-center max-w-md mx-auto border border-gray-200">
          <div className="text-green-500 mb-4 flex justify-center">
            <FaCheckCircle size={64} />
          </div>
          <h2 className='text-3xl font-bold text-gray-800 mb-2'>카카오페이 결제 완료 🎉</h2>
          <p className="text-gray-600 mb-4">
            주문이 정상적으로 접수되었습니다.
          </p>
          <p className="text-sm text-gray-400">
            결제번호: <strong>{paymentResult?.tid}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default KakaoPaymentConfirmation;
