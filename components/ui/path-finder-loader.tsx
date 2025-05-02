import React, { useEffect, useState } from "react";

interface Coordinates {
  top: number;
  left: number;
}

interface BFSParams {
  startTop: number;
  startLeft: number;
  endTop: number;
  endLeft: number;
}

export const PathFinderLoader = ({ fullScreen = true }: { fullScreen?: boolean }) => {
  return (
    <div className={`grid ${fullScreen ? "h-screen" : "h-full"} w-full place-content-center bg-neutral-950`}>
      <PathFinder />
    </div>
  );
};

export const PathFinder = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    loaded && playGame();
  }, [loaded]);

  const playGame = async () => {
    const startTop = Math.floor(Math.random() * ROWS);
    const startLeft = Math.floor(Math.random() * COLS);

    const endTop = Math.floor(Math.random() * ROWS);
    const endLeft = Math.floor(Math.random() * COLS);

    const startEl = document.getElementById(`${startTop}-${startLeft}`);
    const endEl = document.getElementById(`${endTop}-${endLeft}`);

    if (!startEl || !endEl) return;

    (startEl as HTMLElement).style.background = START_COLOR;
    (startEl as HTMLElement).dataset.visited = "true";
    (endEl as HTMLElement).style.background = START_COLOR;

    let answer = await bfs({
      startTop,
      startLeft,
      endTop,
      endLeft,
    });

    await paintPath(answer);

    await reset();

    playGame();
  };

  const paintPath = async (answer: Coordinates[]) => {
    for (let i = 1; i < answer.length; i++) {
      const { top, left } = answer[i];

      const el = document.getElementById(`${top}-${left}`);
      if (!el) continue;

      if (i === answer.length - 1) {
        (el as HTMLElement).style.background = GOAL_COLOR;
      } else {
        (el as HTMLElement).style.background = FOUND_PATH_COLOR;
      }

      await sleep(25);
    }
  };

  const reset = async () => {
    await sleep(1500);
    document.querySelectorAll(".game-box").forEach((el) => {
      (el as HTMLElement).style.background = "transparent";
      (el as HTMLElement).dataset.visited = "false";
    });
    await sleep(1000);
  };

  const bfs = async ({ startTop, startLeft, endTop, endLeft }: BFSParams): Promise<Coordinates[]> => {
    let possiblePaths: Coordinates[][] = [[{ top: startTop, left: startLeft }]];
    let answer: Coordinates[] = [];

    while (possiblePaths.length) {
      const curPath = possiblePaths.pop();

      if (!curPath) return answer;
      let curStep = curPath.length ? curPath[curPath.length - 1] : null;

      if (!curStep) return answer;

      await sleep(5);

      const curStepEl = document.getElementById(
        `${curStep.top}-${curStep.left}`
      );

      if (!curStepEl) return answer;

      const newPaths = getPossibleNextSteps(curStep).map((s) => [
        ...curPath,
        s,
      ]);

      newPaths.forEach((p) => {
        const target = p[p.length - 1];

        const el = document.getElementById(`${target.top}-${target.left}`);
        if (!el) return;
        (el as HTMLElement).dataset.visited = "true";

        if (target.top === endTop && target.left === endLeft) {
          answer = p;
        } else {
          (el as HTMLElement).style.background = FLOOD_COLOR;
        }
      });

      if (answer.length) {
        break;
      }

      possiblePaths = [...newPaths, ...possiblePaths];
    }

    return answer;
  };

  const getPossibleNextSteps = ({ top, left }: Coordinates): Coordinates[] => {
    const canGoLeft = left > 0;
    const canGoRight = left < COLS - 1;
    const canGoUp = top > 0;
    const canGoDown = top < ROWS - 1;

    const newPaths: Coordinates[] = [];

    // --- Diagonal moves
    if (canGoUp && canGoLeft) {
      newPaths.push({
        top: top - 1,
        left: left - 1,
      });
    }
    if (canGoUp && canGoRight) {
      newPaths.push({
        top: top - 1,
        left: left + 1,
      });
    }
    if (canGoDown && canGoLeft) {
      newPaths.push({
        top: top + 1,
        left: left - 1,
      });
    }
    if (canGoDown && canGoRight) {
      newPaths.push({
        top: top + 1,
        left: left + 1,
      });
    }

    // --- Horizontal and vertical moves
    if (canGoLeft) {
      newPaths.push({
        top,
        left: left - 1,
      });
    }
    if (canGoRight) {
      newPaths.push({
        top,
        left: left + 1,
      });
    }
    if (canGoUp) {
      newPaths.push({
        top: top - 1,
        left,
      });
    }
    if (canGoDown) {
      newPaths.push({
        top: top + 1,
        left,
      });
    }

    return newPaths.filter((s) => {
      const el = document.getElementById(`${s.top}-${s.left}`);
      return el && (el as HTMLElement).dataset.visited === "false";
    });
  };

  const generateBoxes = () => {
    const els = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        els.push(
          <div
            data-visited="false"
            id={`${r}-${c}`}
            className="game-box col-span-1 aspect-square w-full border-b border-r border-neutral-800 transition-colors duration-1000"
            key={`${r}-${c}`}
          />
        );
      }
    }

    return <>{els}</>;
  };

  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
      }}
      className="grid w-[75vmin] border-l border-t border-neutral-800 bg-neutral-950 shadow-2xl shadow-neutral-900"
    >
      {generateBoxes()}
    </div>
  );
};

const START_COLOR = "#8b5cf6";
const GOAL_COLOR = "#10b981";
const FLOOD_COLOR = "#404040";
const FOUND_PATH_COLOR = "#FFFFFF";

const ROWS = 16;
const COLS = 16;

const sleep = async (ms: number) => new Promise((r) => setTimeout(r, ms)); 