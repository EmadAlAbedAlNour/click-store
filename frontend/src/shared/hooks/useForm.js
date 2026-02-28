import { useCallback, useState } from 'react';

export const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);

  const handleChange = useCallback((eventOrKey, maybeValue) => {
    if (typeof eventOrKey === 'string') {
      setValues((prev) => ({ ...prev, [eventOrKey]: maybeValue }));
      return;
    }
    const event = eventOrKey;
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const reset = useCallback((nextValues = initialValues) => {
    setValues(nextValues);
  }, [initialValues]);

  return { values, setValues, handleChange, reset };
};

