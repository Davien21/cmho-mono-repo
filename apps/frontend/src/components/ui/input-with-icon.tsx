import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type IconPosition = 'left' | 'right';

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  position: IconPosition;
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  formError?: string;
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  (
    { icon, position, label, labelClassName, wrapperClassName, className, formError, id, ...rest },
    ref
  ) => {
    return (
      <div className={cn('flex flex-col gap-1 w-full', wrapperClassName)}>
        {label && (
          <Label htmlFor={id} className={cn('text-sm font-medium', labelClassName)}>
            {label}
          </Label>
        )}
        <div className="flex items-center rounded-md bg-transparent shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
          {position === 'left' && <IconBox icon={icon} position={position} />}
          <Input
            ref={ref}
            id={id}
            className={cn(
              'h-[36px]',
              position === 'left' ? 'rounded-l-none' : '',
              position === 'right' ? 'rounded-r-none' : '',
              className
            )}
            formError={formError}
            {...rest}
          />
          {position === 'right' && <IconBox icon={icon} position={position} />}
        </div>
        {formError && <span className="text-sm text-red-600 block">{formError}</span>}
      </div>
    );
  }
);

const IconBox = ({ icon, position }: { icon: React.ReactNode; position: IconPosition }) => {
  const className = cn(
    'flex items-center justify-center px-3 py-[9px] h-full border bg-gray-50 text-gray-500 dark:bg-[rgb(25_25_25/1)] dark:text-gray-100 dark:[&_svg]:text-gray-100',
    position === 'left' ? 'rounded-l-md border-r-0' : 'rounded-r-md border-l-0'
  );
  return <div className={className}>{icon}</div>;
};

InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };
