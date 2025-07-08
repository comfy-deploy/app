import React, { useState, useEffect, memo, useRef } from 'react';
import { SDInputsRender } from './SDInputsRender';
import type { RGBColor } from './SDInputsRender';
import { useDebounce } from '@/hooks/use-debounce';

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
  
  // Use the existing debounce hook
  const debouncedValue = useDebounce(localValue, debounceMs);
  
  // Track if this is the first render
  const isFirstRender = useRef(true);

  // Update local value when initial value changes (e.g., reset)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // Call parent's onValueChange when debounced value changes
  useEffect(() => {
    // Skip the first render to avoid unnecessary initial update
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    onValueChange(inputNode.input_id, debouncedValue);
  }, [debouncedValue, inputNode.input_id, onValueChange]);

  // Handle input updates - only update local state immediately
  const handleUpdate = (inputId: string, value: any) => {
    setLocalValue(value);
  };

  return (
    <SDInputsRender
      inputNode={inputNode}
      updateInput={handleUpdate}
      inputValue={localValue}
    />
  );
});