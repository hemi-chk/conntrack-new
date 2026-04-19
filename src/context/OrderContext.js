import React, { createContext, useContext, useState } from "react";

const OrderContext = createContext();

export function OrderProvider({ children }) {

  const [orderStatus, setOrderStatus] = useState("assigned");
  const updateStatus = (status) => {
    setOrderStatus(status);
  };

  return (
    <OrderContext.Provider value={{
      orderStatus,
      setOrderStatus: updateStatus
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  return useContext(OrderContext);
}