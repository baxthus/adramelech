import { useCallback, useRef, useState } from 'react';

interface LongPressOptions {
  shouldPreventDefault?: boolean;
  delay?: number;
}

const isTouchEvent = (event: Event): event is TouchEvent => 'touches' in event;

function preventDefault(event: Event) {
  if (!isTouchEvent(event)) return;
  if (event.touches.length < 2 && event.preventDefault) {
    event.preventDefault();
  }
}

export function useLongPress<T extends React.MouseEvent | React.TouchEvent>(
  onLongPress: (event: T) => void,
  onClick?: (event: T) => void,
  { shouldPreventDefault = true, delay = 300 }: LongPressOptions = {},
) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const target = useRef<EventTarget | null>(null);

  const start = useCallback(
    (event: T) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, {
          passive: false,
        });
        target.current = event.target;
      }
      timeout.current = setTimeout(() => {
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault],
  );

  const clear = useCallback(
    (event: T, shouldTriggerClick = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      if (shouldTriggerClick && !longPressTriggered) {
        onClick?.(event);
      }
      setLongPressTriggered(false);
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener('touchend', preventDefault);
      }
    },
    [shouldPreventDefault, onClick, longPressTriggered],
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e as T),
    onTouchStart: (e: React.TouchEvent) => start(e as T),
    onMouseUp: (e: React.MouseEvent) => clear(e as T),
    onMouseLeave: (e: React.MouseEvent) => clear(e as T, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e as T),
  };
}
