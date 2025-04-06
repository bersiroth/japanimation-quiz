import { CountdownCircleTimer } from 'react-countdown-circle-timer';

interface GameCountdownProps {
  isPlaying: boolean;
  initialRemainingTime: number;
  callback: () => void;
}

function GameCountdown({
  isPlaying,
  initialRemainingTime,
  callback,
}: GameCountdownProps) {
  return (
    <div className="flex justify-center pb-10">
      <CountdownCircleTimer
        isPlaying={isPlaying}
        duration={30}
        colors={['#93b62b', '#ffc211', '#f7941c', '#c9171c']}
        colorsTime={[30, 18, 9, 0]}
        size={200}
        strokeWidth={20}
        initialRemainingTime={initialRemainingTime}
        isSmoothColorTransition={true}
      >
        {({ remainingTime, color }) => {
          let content;
          if (remainingTime === 0) {
            callback();
            content = (
              <>
                <div>Time&#39;s</div>
                <div>up!</div>
              </>
            );
          } else {
            content = <span className="text-6xl">{remainingTime}</span>;
          }

          return (
            <div
              className="flex flex-col items-center text-xl"
              style={{ color: color }}
            >
              {content}
            </div>
          );
        }}
      </CountdownCircleTimer>
    </div>
  );
}

export default GameCountdown;
