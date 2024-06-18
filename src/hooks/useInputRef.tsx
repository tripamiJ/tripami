import { useState } from 'react';

export const useInputFocus = () => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const inputProps = {
    onFocus: () => setTimeout(handleFocus, 150),
    onBlur: () => setTimeout(handleBlur, 150),
  };

  return { inputProps, isFocused };
};
