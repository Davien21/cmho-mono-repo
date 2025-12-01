import * as React from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { useEffect } from 'react';

export interface MoneyInputProps extends Omit<InputProps, 'type' | 'onChange' | 'value'> {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatMoney = (value: string) => {
  const raw = value.replace(/,/g, '').replace(/[^\d]/g, '');
  const formatted = new Intl.NumberFormat('en-NG').format(Number(raw || 0));
  return raw === '' ? '' : formatted;
};

export const parseCurrencyToRawNumber = (formatted: string) => {
  return formatted.replace(/,/g, '');
};

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(
      value !== undefined ? formatMoney(String(value)) : ''
    );

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(formatMoney(String(value)));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const formatted = formatMoney(raw);
      setInternalValue(formatted);

      if (onChange) {
        onChange({
          ...e,
          target: {
            ...e.target,
            value: parseCurrencyToRawNumber(formatted),
          },
        });
      }
    };

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        value={internalValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

MoneyInput.displayName = 'MoneyInput';
