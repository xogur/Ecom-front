import React from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const KakaoPayPayment = ({ finalPay }) => {
  const { cart } = useSelector((state) => state.carts);
  const { user } = useSelector((state) => state.auth);
  const { selectedUserCheckoutAddress } = useSelector((state) => state.auth);

  const handleKakaoPay = async () => {
    try {
      const productName =
        cart.length === 1
          ? cart[0].productName
          : `${cart[0].productName} 외 ${cart.length - 1}건`;

      const response = await axios.post("http://localhost:8080/api/pay/ready", {
        userId: user.id,
        productName,
        quantity: cart.length,
        totalPrice: finalPay,
        addressId: selectedUserCheckoutAddress?.addressId,
      });

      const { next_redirect_pc_url } = response.data;

      // 리다이렉트
      window.location.href = next_redirect_pc_url;
    } catch (err) {
      console.error("카카오페이 결제 요청 실패", err);
      alert("카카오페이 결제에 실패했습니다.");
    }
  };

  return (
    <div className="text-center">
      <p className="mb-4 text-lg font-semibold">카카오페이 결제를 진행합니다.</p>
      <button
        onClick={handleKakaoPay}
        className="bg-yellow-400 hover:bg-yellow-500 px-6 py-2 rounded-md text-black font-bold"
      >
        카카오페이로 결제하기
      </button>
    </div>
  );
};

export default KakaoPayPayment;