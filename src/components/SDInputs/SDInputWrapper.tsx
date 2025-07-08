import React, { useState, useCallback, useEffect, memo } from 'react';
import { SDInputsRender } from './SDInputsRender';
import type { RGBColor } from './SDInputsRender';

interface SDInputWrapperProps {
  inputNode: any;
  initialValue: any;
  onValueChange: (inputId: string, value: any) => void;
  debounceMs?: number;
}

// This component manages its own state to prevent parent re-renders
export const SDInputWrapper = memo(function SDInputWrapper({
  inputNode,
  initialValue,
  onValueChange,
  debounceMs = 200,
}: SDInputWrapperProps) {
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(initialValue);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Update local value when initial value changes (e.g., reset)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // Handle input updates with debouncing
  const handleUpdate = useCallback(
    (inputId: string, value: any) => {
      // Update local state immediately for responsive UI
      setLocalValue(value);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to update parent state
      timeoutRef.current = setTimeout(() => {
        onValueChange(inputId, value);
      }, debounceMs);
    },
    [onValueChange, debounceMs]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <SDInputsRender
      inputNode={inputNode}
      updateInput={handleUpdate}
      inputValue={localValue}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders
  return (
    prevProps.inputNode === nextProps.inputNode &&
    prevProps.initialValue === nextProps.initialValue &&
    prevProps.onValueChange === nextProps.onValueChange &&
    prevProps.debounceMs === nextProps.debounceMs
  );
});