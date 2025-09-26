import { Button, Step, StepLabel, Stepper } from '@mui/material';
import React, { useEffect, useState } from 'react';
import AddressInfo from './AddressInfo';
import { useDispatch, useSelector } from 'react-redux';
import { getUserAddresses } from '../../store/actions';
import toast from 'react-hot-toast';
import Skeleton from '../shared/Skeleton';
import ErrorPage from '../shared/ErrorPage';
import PaymentMethod from './PaymentMethod';
import OrderSummary from './OrderSummary';
import StripePayment from './StripePayment';
import PaypalPayment from './PaypalPayment';
import KakaoPayPayment from './KakaoPayPayment';

const Checkout = () => {
  const [activeStep, setActiveStep] = useState(0);
  const dispatch = useDispatch();

  const { isLoading, errorMessage } = useSelector((state) => state.errors);
  const { cart, totalPrice } = useSelector((state) => state.carts);
  const { address, selectedUserCheckoutAddress } = useSelector((state) => state.auth);
  const { paymentMethod } = useSelector((state) => state.payment);

  // (선택) 주문요약 프리뷰를 올리고 싶다면 유지
  const [orderPreview, setOrderPreview] = useState(null);
  const finalPay = orderPreview?.finalPay;
  console.log("finalPay = ", finalPay);

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleNext = () => {
    // Step 0: Address → 주소 선택 검증
    if (activeStep === 0 && !selectedUserCheckoutAddress) {
      toast.error('Please select checkout address before proceeding.');
      return;
    }
    // Step 2: Payment Method → 결제수단 선택 검증 (순서 변경에 따라 1→2로 이동)
    if (activeStep === 2 && (!selectedUserCheckoutAddress || !paymentMethod)) {
      toast.error('Please select payment method before proceeding.');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  // ✅ 순서 변경: Address → Order Summary → Payment Method → Payment
  const steps = ['Address', 'Order Summary', 'Payment Method', 'Payment'];

  useEffect(() => {
    dispatch(getUserAddresses());
  }, [dispatch]);

  return (
    <div className="py-14 min-h-[calc(100vh-100px)]">
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {isLoading ? (
        <div className="lg:w-[80%] mx-auto py-5">
          <Skeleton />
        </div>
      ) : (
        <div className="mt-5">
          {/* 0: Address */}
          {activeStep === 0 && <AddressInfo address={address} />}

          {/* 1: Order Summary (순서 변경) */}
          {activeStep === 1 && (
            <OrderSummary
              totalPrice={totalPrice}
              cart={cart}
              address={selectedUserCheckoutAddress}
              onPreview={(p) => setOrderPreview(p)} // 필요하면 사용
            />
          )}

          {/* 2: Payment Method (순서 변경) */}
          {activeStep === 2 && <PaymentMethod />}

          {/* 3: Payment */}
          {activeStep === 3 && (
            <>
              {paymentMethod === 'Stripe' ? (
                <StripePayment />
              ) : paymentMethod === 'Paypal' ? (
                <PaypalPayment />
              ) : paymentMethod === 'KakaoPay' ? (
                <KakaoPayPayment finalPay={finalPay}/>
              ) : null}
            </>
          )}
        </div>
      )}

      <div
        className="flex justify-between items-center px-4 fixed z-50 h-24 bottom-0 bg-white left-0 w-full py-4 border-slate-200"
        style={{ boxShadow: '0 -2px 4px rgba(100, 100, 100, 0.15)' }}
      >
        <Button variant="outlined" disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>

        {activeStep !== steps.length - 1 && (
          <button
            disabled={
              !!errorMessage ||
              (activeStep === 0 && !selectedUserCheckoutAddress) ||
              (activeStep === 2 && !paymentMethod) // ✅ 결제수단 검증 위치 변경
            }
            className={`bg-customBlue font-semibold px-6 h-10 rounded-md text-white ${
              errorMessage ||
              (activeStep === 0 && !selectedUserCheckoutAddress) ||
              (activeStep === 2 && !paymentMethod)
                ? 'opacity-60'
                : ''
            }`}
            onClick={handleNext}
          >
            Proceed
          </button>
        )}
      </div>

      {errorMessage && <ErrorPage message={errorMessage} />}
    </div>
  );
};

export default Checkout;
