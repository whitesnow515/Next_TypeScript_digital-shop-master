import moment from "moment";
import React, { useEffect, useState } from "react";

const PaymentTimer = ({ orderTimestamp }: any) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const expirationTime = moment(orderTimestamp).add(8, "hour");
    const difference = expirationTime.diff(moment());
    const duration = moment.duration(difference);

    const hours = Math.max(0, duration.hours());
    const minutes = Math.max(0, duration.minutes());
    const seconds = Math.max(0, duration.seconds());

    return {
      hours,
      minutes,
      seconds,
    };
  }

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [orderTimestamp]);

  const formattedTime = `${String(timeLeft.hours).padStart(2, "0")}:${String(
    timeLeft.minutes
  ).padStart(2, "0")}:${String(timeLeft.seconds).padStart(2, "0")}`;
  return (
    <div>
      <p
        className={`${
          timeLeft.hours > 0 || timeLeft.minutes > 0
            ? "text-[#2BF627]"
            : "text-[#FF3333]"
        } flex items-center gap-1`}
      >
        {timeLeft.hours > 0 || timeLeft.minutes > 0 ? (
          <img src="/assets/images/clock-green.svg" />
        ) : (
          <img src="/assets/images/clock-red.svg" />
        )}
        {formattedTime}
      </p>
    </div>
  );
};

export default PaymentTimer;
