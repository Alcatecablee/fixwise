'use client';

import { useEffect, useRef } from 'react';

interface UsePassiveEventsOptions {
  passive?: boolean;
  capture?: boolean;
}

type EventListenerOptionsWithPassive = EventListenerOptions & {
  passive?: boolean;
};

export function usePassiveEvents(
  eventName: string,
  handler: EventListener,
  element: HTMLElement | Window | Document | null = null,
  options: UsePassiveEventsOptions = {}
) {
  const { passive = true, capture = false } = options;
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element || window;
    const eventListener = (event: Event) => savedHandler.current(event);

    const options: EventListenerOptionsWithPassive = {
      passive,
      capture
    };
    
    targetElement.addEventListener(eventName, eventListener, options);

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, passive, capture]);
}

export function usePassiveTouchEvents(
  handler: (event: TouchEvent) => void,
  element: HTMLElement | null = null
) {
  usePassiveEvents('touchstart', handler as EventListener, element, { passive: true });
  usePassiveEvents('touchmove', handler as EventListener, element, { passive: true });
  usePassiveEvents('touchend', handler as EventListener, element, { passive: true });
}

export function usePassiveScrollEvents(
  handler: (event: Event) => void,
  element: HTMLElement | Window | Document | null = null
) {
  usePassiveEvents('scroll', handler, element, { passive: true });
}

export function usePassiveWheelEvents(
  handler: (event: WheelEvent) => void,
  element: HTMLElement | null = null
) {
  usePassiveEvents('wheel', handler as EventListener, element, { passive: true });
} 