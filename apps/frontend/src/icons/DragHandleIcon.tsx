import * as React from "react";

type DragHandleIconProps = React.SVGProps<SVGSVGElement>;

const DragHandleIcon: React.FC<DragHandleIconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className={className}
    {...props}
  >
    <path
      d="M11 20H9c-.8 0-1.6-.3-2.1-.9-.6-.5-.9-1.3-.9-2.1V9c0-.8.3-1.6.9-2.1C7.4 6.3 8.2 6 9 6h8c.8 0 1.6.3 2.1.9.6.5.9 1.3.9 2.1v2c0 .6-.4 1-1 1s-1-.4-1-1V9c0-.3-.1-.5-.3-.7S17.3 8 17 8H9c-.3 0-.5.1-.7.3S8 8.7 8 9v8c0 .3.1.5.3.7s.4.3.7.3h2c.6 0 1 .4 1 1s-.4 1-1 1z"
      fill="currentColor"
    />
    <path
      d="M16 23c-.5 0-.8-.3-.9-.7l-3-9c-.1-.4 0-.8.2-1 .3-.3.7-.4 1-.2l9 3c.4.1.7.5.7.9s-.2.8-.5 1l-3.7 1.9-1.9 3.7c-.2.2-.5.4-.9.4zm-1.4-8.4 1.6 4.8.9-1.8c.1-.2.3-.4.4-.4l1.8-.9zM3 4c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zM7 4c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zM11 4c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zM15 4c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zM3 8c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zM3 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zM3 16c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"
      fill="currentColor"
    />
  </svg>
);

export default DragHandleIcon;

