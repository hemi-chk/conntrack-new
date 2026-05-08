const BASE_URL = 'http://localhost:5000/api';

export const getOpenBiddings = async () => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/open-biddings`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch biddings');
    }
    return await res.json();
  } catch (error) {
    console.error("Service: getOpenBiddings error:", error);
    throw error;
  }
};

export const submitBid = async (bidData) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bidData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit bid');
    }
    return await res.json();
  } catch (error) {
    console.error("Service: submitBid error:", error);
    throw error;
  }
};

export const getSupplierBids = async (supplierId) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/bids?supplier_id=${supplierId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch your bids');
    }
    return await res.json();
  } catch (error) {
    console.error("Service: getSupplierBids error:", error);
    throw error;
  }
};

export const updateBid = async (bidId, updateData) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/bids/${bidId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update bid');
    }
    return await res.json();
  } catch (error) {
    console.error("Service: updateBid error:", error);
    throw error;
  }
};

export const deleteBid = async (bidId) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/bids/${bidId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete bid');
    }
    return await res.json();
  } catch (error) {
    console.error("Service: deleteBid error:", error);
    throw error;
  }
};