import { useState, useEffect, useRef } from "react";

const CountdownTimer = ({ initialSeconds = 60, setShowResendButton }) => {
  const endTimeRef = useRef(Date.now() + initialSeconds * 1000);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setShowResendButton(true);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, setShowResendButton]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <>
      {secondsLeft > 0 && (
        <span className="text-gray-400 font-medium">
          {formatTime(secondsLeft)}
        </span>
      )}
    </>
  );
};

export default CountdownTimer;
