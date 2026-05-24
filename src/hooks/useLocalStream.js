import { useEffect, useRef, useState } from 'react';

export function useLocalStream({ video = true, audio = true } = {}) {
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video, audio });
        if (!mounted) {
          s.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = s;
        setActive(true);
      } catch (err) {
        setError(err);
      }
    }

    start();

    return () => {
      mounted = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { streamRef, active, error };
}
