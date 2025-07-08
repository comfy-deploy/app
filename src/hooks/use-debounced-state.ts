import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebouncedState<T>(
  initialValue: T,
  delay = 300
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const setValueWithDebounce = useCallback((newValue: T) => {
    setValue(newValue);
  }, []);

  return [value, debouncedValue, setValueWithDebounce];
}

// Hook specifically for form inputs with individual field debouncing
export function useDebouncedFormState<T extends Record<string, any>>(
  initialValues: T,
  delay = 300
): {
  values: T;
  debouncedValues: T;
  updateValue: (key: keyof T, value: T[keyof T]) => void;
  setValues: React.Dispatch<React.SetStateAction<T>>;
} {
  const [values, setValues] = useState<T>(initialValues);
  const [debouncedValues, setDebouncedValues] = useState<T>(initialValues);
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const updateValue = useCallback((key: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [key]: value }));

    // Clear existing timeout for this field
    if (timeoutRefs.current[key as string]) {
      clearTimeout(timeoutRefs.current[key as string]);
    }

    // Set new timeout for this field
    timeoutRefs.current[key as string] = setTimeout(() => {
      setDebouncedValues(prev => ({ ...prev, [key]: value }));
      delete timeoutRefs.current[key as string];
    }, delay);
  }, [delay]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return { values, debouncedValues, updateValue, setValues };
}