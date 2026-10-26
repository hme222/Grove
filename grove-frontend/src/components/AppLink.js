import React from 'react';
import { useNavigate } from 'react-router-dom';

// A real <a href> that navigates in-app on a plain left-click and leaves everything else (new tab, copy link,
// middle-click, modifier keys, target="_blank") to the browser. Use it for navigation; use <button> for actions.
export const AppLink = React.forwardRef(function AppLink({ to, onClick, target, children, ...rest }, ref) {
  const navigate = useNavigate();
  const handleClick = (event) => {
    if (onClick) onClick(event);
    if (event.defaultPrevented) return;
    const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (!plain || (target && target !== '_self')) return;
    event.preventDefault();
    navigate(to);
  };
  return (
    <a ref={ref} href={to} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
});

export default AppLink;
