import { useState, useEffect, useCallback } from 'react';
import { getOpenBiddings, getSupplierBids } from '../services/biddingService';

export const useBiddings = (profileData) => {
  const [biddings, setBiddings] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const supplierId = profileData?.id || profileData?.supplier_id;
      
      const [openData, bidsData] = await Promise.all([
        getOpenBiddings(),
        supplierId ? getSupplierBids(supplierId) : Promise.resolve([])
      ]);

      setBiddings(openData);
      setMyBids(bidsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load biddings');
    } finally {
      setIsLoading(false);
    }
  }, [profileData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { biddings, myBids, isLoading, error, refreshBiddings: fetchData };
};