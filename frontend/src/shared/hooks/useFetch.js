import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export const useFetch = (request, { immediate = true, deps = [] } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (overrideConfig = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios(overrideConfig || request);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (!immediate) return;
    execute().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, execute, ...deps]);

  return { data, loading, error, execute, setData };
};

