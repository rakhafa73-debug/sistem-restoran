import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { soundService } from '../lib/audio.ts';

type RealtimeListener = (event: { type: string; payload: any }) => void;

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: { type: string; payload: any } | null;
  subscribe: (listener: RealtimeListener) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);
  const listenersRef = useRef<RealtimeListener[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    function connect() {
      try {
        eventSource = new EventSource('/api/realtime/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEvent(data);

            if (data.type === 'ORDER_CREATED') {
              soundService.playOrderBell();
            }

            for (const listener of listenersRef.current) {
              listener(data);
            }
          } catch {
            // Non-JSON ping
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          retryTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setIsConnected(false);
        retryTimeout = setTimeout(connect, 4000);
      }
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const subscribe = (listener: RealtimeListener) => {
    listenersRef.current.push(listener);
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    };
  };

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}
