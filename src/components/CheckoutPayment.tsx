import React from "react";

const CheckoutPayment = ({
  getCartAmout,
  items,
  userBalance,
  handleATC,
  currency,
  isEmpty,
  isVisible,
  disableCashapp,
  setPromo,
}: any) => {
  return (
    <div>
      <div className="border border-[#303633] bg-[#1F2421] py-5 px-10 xl:h-[580px]">
        <div className="flex justify-between items-center">
          <h1 className="text-white font-bold text-2xl my-2">
            Select Payment Method
          </h1>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-white text-xl ">Account</h1>
        </div>
        <div className={`flex justify-center mb-3  gap-2 items-center`}>
          <button
            disabled={
              getCartAmout(items) > userBalance ||
              items.length === 0 ||
              !isVisible
            }
            onClick={() => {
              handleATC(false, false, "balance", true);
            }}
            className="border border-[#303633] w-[50%] h-[50%] disabled:opacity-[0.4] hover:bg-[#141716] disabled:hover:bg-transparent rounded-xl gap-4 flex p-4"
          >
            <div>
              <img
                className="h-10 w-10 rounded"
                src="/assets/images/balance.png"
              />
            </div>
            <div className="flex flex-col justify-between">
              <p className="text-white hidden xl:block text-lg font-bold mt-[5px]">
                ${userBalance.toFixed(2)} Balance
              </p>
              <p className="text-white xl:w-[5%] block xl:hidden text-sm font-bold mt-[10px]">
                ${userBalance.toFixed(2)} Bal
              </p>
            </div>
          </button>
          <button
            disabled={disableCashapp}
            onClick={() => {
              handleATC(true, false, "CASH_APP");
            }}
            className={`border border-[#303633] w-[50%] h-[50%] disabled:opacity-[0.4] hover:bg-[#141716] disabled:hover:bg-transparent rounded-xl gap-4 flex p-4`}
          >
            <div>
              <img
                className="h-10 w-10 rounded"
                src="/assets/images/cashapp.png"
              />
            </div>
            <div className="flex flex-col justify-between">
              <p className="text-white text-lg font-bold mt-[5px]">CashApp</p>
            </div>
          </button>
        </div>
        <div className="my-4 mt-6 text-white">
          <h1 className="text-xl">External Payment</h1>
          <div className="flex flex-col mt-2">
            {currency.map((currency: any) => (
              <>
                <button
                  disabled={isEmpty}
                  onClick={() => {
                    handleATC(true, false, currency.value);
                  }}
                  className="flex disabled:opacity-[0.2] hover:bg-[#141716] p-2 rounded-md items-center gap-3"
                >
                  <img
                    className="w-8 h-9 shrink-0"
                    src={currency.logo}
                    alt={currency.coin}
                  />
                  <span>{currency.coin}</span>
                </button>
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPayment;
