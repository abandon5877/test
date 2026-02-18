export interface GameConfig {
  atb: {
    baseSpeed: number;
    speedMultiplier: number;
    maxProgress: number;
  };
  cast: {
    baseTime: number;
    timeMultiplier: number;
  };
  battle: {
    interruptThreshold: number;
    stunDuration: number;
  };
  ui: {
    updateInterval: number;
    animationDuration: number;
  };
}

export const defaultConfig: GameConfig = {
  atb: {
    baseSpeed: 200,
    speedMultiplier: 10,
    maxProgress: 100
  },
  cast: {
    baseTime: 1,
    timeMultiplier: 1,
  },
  battle: {
    interruptThreshold: 10,
    stunDuration: 1
  },
  ui: {
    updateInterval: 16,
    animationDuration: 100
  }
};

export const difficultyPresets = {
  easy: {
    atb: {
      baseSpeed: 80,
      speedMultiplier: 1.5,
      maxProgress: 100
    },
    cast: {
      baseTime: 1.2,
      timeMultiplier: 1,
    },
    battle: {
      interruptThreshold: 15,
      stunDuration: 0.5
    },
    ui: {
      updateInterval: 16,
      animationDuration: 100
    }
  },
  normal: {
    atb: {
      baseSpeed: 100,
      speedMultiplier: 2,
      maxProgress: 100
    },
    cast: {
      baseTime: 1,
      timeMultiplier: 1,
    },
    battle: {
      interruptThreshold: 10,
      stunDuration: 1
    },
    ui: {
      updateInterval: 16,
      animationDuration: 100
    }
  },
  hard: {
    atb: {
      baseSpeed: 150,
      speedMultiplier: 3,
      maxProgress: 100
    },
    cast: {
      baseTime: 0.8,
      timeMultiplier: 1,
    },
    battle: {
      interruptThreshold: 5,
      stunDuration: 1.5
    },
    ui: {
      updateInterval: 16,
      animationDuration: 50
    }
  }
};