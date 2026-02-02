import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOTIVATING_PHRASES = [
  "Crushed it",
  "Killed it today",
  "Done-zo",
  "Beast mode complete",
  "Nailed it",
  "Let's gooo",
  "Another one down",
  "Gains secured",
  "Mission complete",
  "Locked in",
  "That's a wrap",
  "Victory lap",
  "Smashed it",
  "In the books",
  "Checked off",
  "Money in the bank",
  "Put in the work",
  "No excuses today",
  "Champion stuff",
  "Built different",
  "Hard work pays off",
  "One more down",
  "Progress made",
  "Leveled up",
  "Work complete",
  "All done here",
  "Finished strong",
  "Earn that rest",
  "Time to recover",
  "Proud of myself",
  "Absolutely slayed",
  "Boss moves only",
  "That's how it's done",
  "Another W",
  "Winning",
  "On fire today"
];

const INITIAL_QUEUES = {
  pushUpper: [
    "Hammer Strength Chest Press",
    "Flat Barbell Bench Press",
    "Incline Dumbbell Press",
    "Hammer Strength Incline Press",
    "Seated Shoulder Press Machine",
    "Dumbbell Arnold Press",
    "Landmine Press (half-kneeling)",
    "Ring Push-Ups (feet elevated)"
  ],
  pushLower: [
    "Hack Squat",
    "Safety Bar Squat",
    "Pendulum Squat",
    "45° Leg Press (mid/high foot)",
    "Bulgarian Split Squat (DBs)",
    "Walking Dumbbell Lunges",
    "Heels-Elevated Goblet Squat",
    "Step-Back Lunges (Smith or DB)"
  ],
  pullUpper: [
    "Weighted Pull-Ups",
    "Wide-Grip Pull-Ups",
    "Neutral-Grip Lat Pulldown",
    "Chest-Supported T-Bar Row",
    "One-Arm Dumbbell Row",
    "Seated Cable Row (neutral)",
    "Hammer Strength High Row",
    "Ring Rows (feet elevated)"
  ],
  pullLower: [
    "Barbell Romanian Deadlift",
    "Deficit Romanian Deadlift",
    "Single-Leg Dumbbell RDL",
    "Barbell Hip Thrust",
    "Seated Hamstring Curl",
    "Lying Hamstring Curl",
    "Nordic Hamstring (assisted)",
    "Cable Pull-Through"
  ],
  abs: [
    "Hanging Leg Raises",
    "Cable Crunches",
    "Ab Wheel Rollouts",
    "Decline Sit-Ups",
    "Pallof Press",
    "Dead Bug",
    "Plank (weighted)",
    "Russian Twists"
  ]
};

const WARMUPS = {
  push: {
    upper: "Push-Ups",
    lower: "Step-Ups"
  },
  pull: {
    upper: "Band Pull-Aparts",
    lower: "Hip Thrusts (against bench)"
  }
};

const COLORS = {
  push: {
    primary: '#E63946',
    secondary: '#FF6B6B',
    bg: '#FFF5F5',
    bgGradientEnd: '#FFD4D4',
    subtle: '#FFE8E8',
    sectionGradient: 'rgba(230, 57, 70, 0.04)',
    stampColor: 'rgba(230, 57, 70, 0.18)',
  },
  pull: {
    primary: '#4A90D9',
    secondary: '#6BA8E8',
    bg: '#E8F1FB',
    bgGradientEnd: '#D0E4FF',
    subtle: '#DCE9F7',
    sectionGradient: 'rgba(74, 144, 217, 0.05)',
    stampColor: 'rgba(74, 144, 217, 0.18)',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    muted: '#999999',
  },
  divider: 'rgba(0, 0, 0, 0.08)',
};

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function getDateLabel(dateKey) {
  const today = getToday();
  const yesterday = getYesterday();
  const tomorrow = getTomorrow();

  if (dateKey === today) return "Today's Workout";
  if (dateKey === yesterday) return "Yesterday's Workout";
  if (dateKey === tomorrow) return "Tomorrow's Workout";
  return "Past Workout";
}

// Generate seed data - creates ~20 workout entries spread over the last 45 days
function generateSeedData(currentQueues, currentDayType) {
  const completions = {};
  const queues = JSON.parse(JSON.stringify(currentQueues));
  let dayType = currentDayType;

  // Create about 20 workout entries spread over 45 days (simulating ~3-4 workouts per week)
  const daysToSkip = new Set();
  // Skip about 55% of days to simulate realistic workout frequency
  for (let i = 1; i <= 45; i++) {
    if (Math.random() < 0.55) {
      daysToSkip.add(i);
    }
  }

  // Generate data going backwards from yesterday
  for (let i = 45; i >= 1; i--) {
    if (daysToSkip.has(i)) continue;

    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const isPush = dayType === 'push';
    const upperKey = isPush ? 'pushUpper' : 'pullUpper';
    const lowerKey = isPush ? 'pushLower' : 'pullLower';

    completions[dateKey] = {
      type: dayType,
      upperExercise: queues[upperKey][0],
      lowerExercise: queues[lowerKey][0],
      abExercise: queues.abs[0],
    };

    // Rotate queues
    const rotateQueue = (key) => {
      const queue = [...queues[key]];
      queue.push(queue.shift());
      queues[key] = queue;
    };
    rotateQueue(upperKey);
    rotateQueue(lowerKey);
    rotateQueue('abs');

    // Alternate days
    dayType = dayType === 'push' ? 'pull' : 'push';
  }

  return {
    queues,
    currentDay: dayType,
    completions,
  };
}

// Workout page component
function WorkoutPage({
  headerLabel,
  dayType,
  displayDate,
  colors,
  warmups,
  upperExercise,
  lowerExercise,
  abExercise,
  canSkip,
  onSkip,
  isPush,
  showDoneStamp,
  style,
  animatedStyle,
  footerContent,
}) {
  return (
    <Animated.View style={[styles.page, { backgroundColor: colors.bg }, style, animatedStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.dayLabel, { color: colors.primary }]}>
          {headerLabel}
        </Text>
        <Text style={styles.title}>{dayType} Day</Text>
        <Text style={styles.date}>{displayDate}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Warm-Ups */}
        <LinearGradient
          colors={[colors.sectionGradient, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>WARM-UPS</Text>
          <View style={styles.exerciseList}>
            <View style={styles.exercise}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseLabel}>UPPER</Text>
                <Text style={styles.exerciseName}>{warmups.upper}</Text>
              </View>
            </View>
            <View style={[styles.exercise, styles.exerciseLast]}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseLabel}>LOWER</Text>
                <Text style={styles.exerciseName}>{warmups.lower}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Main Exercises */}
        <LinearGradient
          colors={[colors.sectionGradient, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>MAIN EXERCISES</Text>
          <View style={styles.exerciseList}>
            <View style={styles.exercise}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseLabel}>UPPER</Text>
                <Text style={styles.exerciseName}>{upperExercise}</Text>
              </View>
              <View style={[styles.skipBtn, { backgroundColor: canSkip ? colors.subtle : 'transparent' }]}>
                {canSkip ? (
                  <TouchableOpacity onPress={() => onSkip(isPush ? 'pushUpper' : 'pullUpper')}>
                    <Text style={[styles.skipBtnText, { color: colors.primary }]}>Skip</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.skipBtnText, { color: 'transparent' }]}>Skip</Text>
                )}
              </View>
            </View>
            <View style={[styles.exercise, styles.exerciseLast]}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseLabel}>LOWER</Text>
                <Text style={styles.exerciseName}>{lowerExercise}</Text>
              </View>
              <View style={[styles.skipBtn, { backgroundColor: canSkip ? colors.subtle : 'transparent' }]}>
                {canSkip ? (
                  <TouchableOpacity onPress={() => onSkip(isPush ? 'pushLower' : 'pullLower')}>
                    <Text style={[styles.skipBtnText, { color: colors.primary }]}>Skip</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.skipBtnText, { color: 'transparent' }]}>Skip</Text>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Abs */}
        <LinearGradient
          colors={[colors.sectionGradient, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>ABS</Text>
          <View style={styles.exerciseList}>
            <View style={[styles.exercise, styles.exerciseLast]}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{abExercise}</Text>
              </View>
              <View style={[styles.skipBtn, { backgroundColor: canSkip ? colors.subtle : 'transparent' }]}>
                {canSkip ? (
                  <TouchableOpacity onPress={() => onSkip('abs')}>
                    <Text style={[styles.skipBtnText, { color: colors.primary }]}>Skip</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.skipBtnText, { color: 'transparent' }]}>Skip</Text>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Footer */}
      {footerContent && (
        <View style={styles.footer}>
          {footerContent}
        </View>
      )}

      {/* DONE Stamp - rendered last to be on top */}
      {showDoneStamp && (
        <View style={styles.stampContainer} pointerEvents="none">
          <View style={[styles.stampBorder, { borderColor: colors.stampColor }]}>
            <Text style={[styles.stampText, { color: colors.stampColor }]}>DONE</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

export default function App() {
  const [state, setState] = useState({
    queues: INITIAL_QUEUES,
    currentDay: 'push',
    completions: {}
  });
  const [historyIndex, setHistoryIndex] = useState(null); // null = today, 0+ = index into completed history
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = current page, 1 = next page (tomorrow or newer)
  const settingsAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible

  // Track temporary skip indices for today's session (not persisted)
  const [skipIndices, setSkipIndices] = useState({
    pushUpper: 0,
    pushLower: 0,
    pullUpper: 0,
    pullLower: 0,
    abs: 0,
  });

  // Load state from AsyncStorage
  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem('gymDayState');
        if (saved) {
          setState(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load state:', e);
      }
      setIsLoaded(true);
    };
    loadState();
  }, []);

  // Save state to AsyncStorage
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('gymDayState', JSON.stringify(state)).catch(e =>
        console.error('Failed to save state:', e)
      );
    }
  }, [state, isLoaded]);

  const { queues, currentDay, completions } = state;
  const today = getToday();
  const completedToday = completions[today];

  // Get sorted list of completed dates (most recent first), excluding today
  // Today is handled separately in the UI
  const pastCompletedDates = useMemo(() => {
    const todayKey = getToday();
    return Object.keys(completions).filter(d => d !== todayKey).sort().reverse();
  }, [completions]);

  // Viewing state: -1 = tomorrow, null = today, 0+ = history index into pastCompletedDates
  const isViewingTomorrow = historyIndex === -1;
  const isViewingToday = historyIndex === null;
  const isViewingHistory = historyIndex !== null && historyIndex >= 0;

  // Can we navigate? Use refs to avoid stale closures in pan responder
  const canGoToHistory = pastCompletedDates.length > 0;
  const canGoOlder = isViewingHistory && historyIndex < pastCompletedDates.length - 1;
  const canGoNewer = isViewingHistory && historyIndex > 0;
  const canGoBackToToday = isViewingHistory;
  const canGoToTomorrow = isViewingToday && !!completedToday; // Can see tomorrow preview after completing today

  // Keep refs updated for pan responder
  const stateRef = useRef({ historyIndex, completedToday, pastCompletedDates });
  stateRef.current = { historyIndex, completedToday, pastCompletedDates };


  const buttonText = useMemo(() => {
    return MOTIVATING_PHRASES[Math.floor(Math.random() * MOTIVATING_PHRASES.length)];
  }, []);

  // Get exercise at current skip index
  const getExerciseAtIndex = (queueKey) => {
    const queue = queues[queueKey];
    const index = skipIndices[queueKey] % queue.length;
    return queue[index];
  };

  // Skip to next exercise (temporary, just for today)
  const skipExercise = (queueKey) => {
    if (completedToday) return;
    setSkipIndices(prev => ({
      ...prev,
      [queueKey]: prev[queueKey] + 1,
    }));
  };

  const completeDay = () => {
    setState(prev => {
      const upperKey = prev.currentDay === 'push' ? 'pushUpper' : 'pullUpper';
      const lowerKey = prev.currentDay === 'push' ? 'pushLower' : 'pullLower';

      // Get the currently selected exercises (accounting for skips)
      const upperIndex = skipIndices[upperKey] % prev.queues[upperKey].length;
      const lowerIndex = skipIndices[lowerKey] % prev.queues[lowerKey].length;
      const absIndex = skipIndices.abs % prev.queues.abs.length;

      const completedWorkout = {
        type: prev.currentDay,
        upperExercise: prev.queues[upperKey][upperIndex],
        lowerExercise: prev.queues[lowerKey][lowerIndex],
        abExercise: prev.queues.abs[absIndex]
      };

      const newQueues = { ...prev.queues };

      // Move the selected exercise to the back of each queue
      const moveToBack = (key, selectedIndex) => {
        const queue = [...newQueues[key]];
        const [selected] = queue.splice(selectedIndex, 1);
        queue.push(selected);
        newQueues[key] = queue;
      };

      moveToBack(upperKey, upperIndex);
      moveToBack(lowerKey, lowerIndex);
      moveToBack('abs', absIndex);

      return {
        ...prev,
        queues: newQueues,
        currentDay: prev.currentDay === 'push' ? 'pull' : 'push',
        completions: {
          ...prev.completions,
          [today]: completedWorkout
        }
      };
    });

    // Reset skip indices for next session
    setSkipIndices({
      pushUpper: 0,
      pushLower: 0,
      pullUpper: 0,
      pullLower: 0,
      abs: 0,
    });
  };

  // Settings overlay functions
  const openSettings = () => {
    setShowSettings(true);
    Animated.timing(settingsAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeSettings = () => {
    Animated.timing(settingsAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowSettings(false);
    });
  };

  const resetData = async () => {
    await AsyncStorage.removeItem('gymDayState');
    setState({
      queues: INITIAL_QUEUES,
      currentDay: 'push',
      completions: {},
    });
    setSkipIndices({
      pushUpper: 0,
      pushLower: 0,
      pullUpper: 0,
      pullLower: 0,
      abs: 0,
    });
    setHistoryIndex(null);
    closeSettings();
  };

  const seedData = () => {
    const seeded = generateSeedData(INITIAL_QUEUES, 'push');
    setState(seeded);
    setHistoryIndex(null); // Stay on today view
    closeSettings();
  };

  // Track pending navigation to prevent flash (use object to distinguish from null historyIndex)
  const pendingNavRef = useRef({ pending: false, target: null });

  // Reset slideAnim after state change (prevents flash)
  useEffect(() => {
    if (pendingNavRef.current.pending) {
      slideAnim.setValue(0);
      pendingNavRef.current = { pending: false, target: null };
    }
  }, [historyIndex]);

  // Combined pan responder for horizontal swipe (history) and vertical swipe (settings)
  const combinedPanResponder = useMemo(() => {
    // Helper to get fresh state from ref
    const getState = () => {
      const { historyIndex: hi, completedToday: ct, pastCompletedDates: pcd } = stateRef.current;
      const viewingTomorrow = hi === -1;
      const viewingToday = hi === null;
      const viewingHistory = hi !== null && hi >= 0;
      const goToHistory = pcd.length > 0;
      const goOlder = viewingHistory && hi < pcd.length - 1;
      const goNewer = viewingHistory && hi > 0;
      const goToTomorrow = viewingToday && !!ct;
      return { hi, viewingTomorrow, viewingToday, viewingHistory, goToHistory, goOlder, goNewer, goToTomorrow };
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isVerticalUp = gestureState.dy < -20 && !isHorizontal;
        const { viewingTomorrow, goToHistory, goToTomorrow } = getState();
        // Can swipe if: viewing tomorrow (can go back), have history, or can go to tomorrow
        const canSwipe = (viewingTomorrow || goToHistory || goToTomorrow) && Math.abs(gestureState.dx) > 10 && isHorizontal;
        return isVerticalUp || canSwipe;
      },
      onPanResponderMove: (_, gestureState) => {
        const { viewingTomorrow, viewingToday, viewingHistory, goToHistory, goOlder, goNewer, goToTomorrow } = getState();
        if (!viewingTomorrow && !goToHistory && !goToTomorrow) return;
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          const progress = gestureState.dx / SCREEN_WIDTH;
          const goingOlder = progress > 0;
          const goingNewer = progress < 0;
          let canGoThisWay = false;

          if (goingOlder) {
            canGoThisWay = viewingTomorrow || (viewingToday ? goToHistory : goOlder);
          } else {
            canGoThisWay = viewingHistory ? (goNewer || viewingHistory) : goToTomorrow;
          }

          let clamped = progress;
          if (!canGoThisWay) {
            clamped = progress * 0.3;
          } else {
            clamped = Math.max(-1.1, Math.min(1.1, progress));
          }
          slideAnim.setValue(clamped);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);

        if (!isHorizontal && (gestureState.dy < -50 || gestureState.vy < -0.5)) {
          openSettings();
          return;
        }

        const { hi, viewingTomorrow, viewingToday, viewingHistory, goToHistory, goOlder, goToTomorrow } = getState();

        if ((viewingTomorrow || goToHistory || goToTomorrow) && isHorizontal) {
          const threshold = SCREEN_WIDTH * 0.2;
          const velocityThreshold = 0.5;

          let wantsOlder = false;
          let wantsNewer = false;

          if (Math.abs(gestureState.vx) > velocityThreshold) {
            wantsOlder = gestureState.vx > 0;
            wantsNewer = gestureState.vx < 0;
          } else if (Math.abs(gestureState.dx) > threshold) {
            wantsOlder = gestureState.dx > 0;
            wantsNewer = gestureState.dx < 0;
          }

          const duration = 250;

          if (wantsOlder) {
            let canGo = false;
            let nextIndex = hi;

            if (viewingTomorrow) {
              canGo = true;
              nextIndex = null;
            } else if (viewingToday) {
              canGo = goToHistory;
              nextIndex = 0;
            } else {
              canGo = goOlder;
              nextIndex = hi + 1;
            }

            if (canGo) {
              pendingNavRef.current = { pending: true, target: nextIndex };
              Animated.timing(slideAnim, {
                toValue: 1,
                duration,
                easing: Easing.bezier(0.32, 0.72, 0, 1),
                useNativeDriver: true,
              }).start(() => {
                setHistoryIndex(nextIndex);
              });
              return;
            }
          } else if (wantsNewer) {
            let canGo = false;
            let nextIndex = hi;

            if (viewingHistory) {
              canGo = true;
              nextIndex = hi === 0 ? null : hi - 1;
            } else if (viewingToday && goToTomorrow) {
              canGo = true;
              nextIndex = -1;
            }

            if (canGo) {
              pendingNavRef.current = { pending: true, target: nextIndex };
              Animated.timing(slideAnim, {
                toValue: -1,
                duration,
                easing: Easing.bezier(0.32, 0.72, 0, 1),
                useNativeDriver: true,
              }).start(() => {
                setHistoryIndex(nextIndex);
              });
              return;
            }
          }

          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            easing: Easing.bezier(0.32, 0.72, 0, 1),
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }, [slideAnim]);

  // Settings overlay animation values
  const settingsTranslateY = settingsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });
  const settingsBackdropOpacity = settingsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.push.bg }]}>
        <StatusBar style="dark" />
      </View>
    );
  }

  // Today's data
  const todayIsPush = currentDay === 'push';
  const todayColors = todayIsPush ? COLORS.push : COLORS.pull;
  const todayWarmups = WARMUPS[currentDay];
  const todayUpperKey = todayIsPush ? 'pushUpper' : 'pullUpper';
  const todayLowerKey = todayIsPush ? 'pushLower' : 'pullLower';

  // Get page data for a history index
  const getHistoryPageData = (index) => {
    if (index < 0 || index >= pastCompletedDates.length) return null;
    const dateKey = pastCompletedDates[index];
    const completion = completions[dateKey];
    const isPush = completion.type === 'push';
    const colors = isPush ? COLORS.push : COLORS.pull;
    return {
      headerLabel: getDateLabel(dateKey),
      dayType: isPush ? 'Push' : 'Pull',
      displayDate: formatDate(new Date(dateKey + 'T12:00:00')),
      colors,
      warmups: WARMUPS[completion.type],
      upperExercise: completion.upperExercise,
      lowerExercise: completion.lowerExercise,
      abExercise: completion.abExercise,
      showDoneStamp: true,
      isPush,
    };
  };

  // Tomorrow's data (preview of next workout after completing today)
  const getTomorrowPageData = () => {
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    return {
      headerLabel: "Tomorrow's Workout",
      dayType: todayIsPush ? 'Push' : 'Pull',
      displayDate: formatDate(tomorrowDate),
      colors: todayColors,
      warmups: todayWarmups,
      upperExercise: queues[todayUpperKey][0],
      lowerExercise: queues[todayLowerKey][0],
      abExercise: queues.abs[0],
      showDoneStamp: false,
      isPush: todayIsPush,
      canSkip: false,
    };
  };

  // Current page data depends on what we're viewing
  const getCurrentPageData = () => {
    if (isViewingTomorrow) {
      return getTomorrowPageData();
    }
    if (isViewingToday) {
      if (completedToday) {
        // Show completed workout with correct type from completion data
        const isPush = completedToday.type === 'push';
        const colors = isPush ? COLORS.push : COLORS.pull;
        return {
          headerLabel: "Today's Workout",
          dayType: isPush ? 'Push' : 'Pull',
          displayDate: formatDate(new Date()),
          colors,
          warmups: WARMUPS[completedToday.type],
          upperExercise: completedToday.upperExercise,
          lowerExercise: completedToday.lowerExercise,
          abExercise: completedToday.abExercise,
          showDoneStamp: true,
          isPush,
          canSkip: false,
        };
      }
      return {
        headerLabel: "Today's Workout",
        dayType: todayIsPush ? 'Push' : 'Pull',
        displayDate: formatDate(new Date()),
        colors: todayColors,
        warmups: todayWarmups,
        upperExercise: getExerciseAtIndex(todayUpperKey),
        lowerExercise: getExerciseAtIndex(todayLowerKey),
        abExercise: getExerciseAtIndex('abs'),
        showDoneStamp: false,
        isPush: todayIsPush,
        canSkip: true,
      };
    }
    return getHistoryPageData(historyIndex);
  };

  // Get the page that appears when swiping right (older content)
  const getOlderPageData = () => {
    if (isViewingTomorrow) {
      // Swiping right from tomorrow shows today
      if (completedToday) {
        const isPush = completedToday.type === 'push';
        const colors = isPush ? COLORS.push : COLORS.pull;
        return {
          headerLabel: "Today's Workout",
          dayType: isPush ? 'Push' : 'Pull',
          displayDate: formatDate(new Date()),
          colors,
          warmups: WARMUPS[completedToday.type],
          upperExercise: completedToday.upperExercise,
          lowerExercise: completedToday.lowerExercise,
          abExercise: completedToday.abExercise,
          showDoneStamp: true,
          isPush,
        };
      }
      return null;
    }
    if (isViewingToday) {
      // Swiping right from today shows most recent history
      return getHistoryPageData(0);
    }
    // Swiping right from history shows older history
    return getHistoryPageData(historyIndex + 1);
  };

  // Get the page that appears when swiping left (newer content)
  const getNewerPageData = () => {
    if (isViewingHistory) {
      if (historyIndex === 0) {
        // Swiping left from most recent history goes to today
        if (completedToday) {
          const isPush = completedToday.type === 'push';
          const colors = isPush ? COLORS.push : COLORS.pull;
          return {
            headerLabel: "Today's Workout",
            dayType: isPush ? 'Push' : 'Pull',
            displayDate: formatDate(new Date()),
            colors,
            warmups: WARMUPS[completedToday.type],
            upperExercise: completedToday.upperExercise,
            lowerExercise: completedToday.lowerExercise,
            abExercise: completedToday.abExercise,
            showDoneStamp: true,
            isPush,
          };
        }
        return {
          headerLabel: "Today's Workout",
          dayType: todayIsPush ? 'Push' : 'Pull',
          displayDate: formatDate(new Date()),
          colors: todayColors,
          warmups: todayWarmups,
          upperExercise: getExerciseAtIndex(todayUpperKey),
          lowerExercise: getExerciseAtIndex(todayLowerKey),
          abExercise: getExerciseAtIndex('abs'),
          showDoneStamp: false,
          isPush: todayIsPush,
        };
      }
      // Swiping left from older history shows newer history
      return getHistoryPageData(historyIndex - 1);
    }
    // Swiping left from today shows tomorrow (if today is completed)
    if (isViewingToday && canGoToTomorrow) {
      return getTomorrowPageData();
    }
    return null;
  };

  const currentPageData = getCurrentPageData();
  const olderPageData = getOlderPageData();
  const newerPageData = getNewerPageData();

  // Dot indicator - dots go from oldest (left) to newest/tomorrow (right)
  // Total: past history + today + tomorrow (if available)
  const hasTomorrow = completedToday;
  const totalDots = Math.min(pastCompletedDates.length + 1 + (hasTomorrow ? 1 : 0), 5);

  // Calculate active dot: rightmost is tomorrow (if available), then today, then history
  // Index from right: tomorrow=0, today=1, history[0]=2, etc
  const getActiveDotIndex = () => {
    if (isViewingTomorrow) return totalDots - 1; // Rightmost
    if (isViewingToday) return totalDots - 1 - (hasTomorrow ? 1 : 0); // Second from right if tomorrow exists
    // History: older = more left
    const historyOffset = hasTomorrow ? 2 : 1; // Offset for tomorrow+today or just today
    return totalDots - 1 - historyOffset - historyIndex;
  };
  const activeDotIndex = Math.max(0, Math.min(getActiveDotIndex(), totalDots - 1));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container} {...combinedPanResponder.panHandlers}>
        <StatusBar style="dark" />

        {/* Older Page (swipe right reveals - comes from left) */}
        {olderPageData && (
          <WorkoutPage
            headerLabel={olderPageData.headerLabel}
            dayType={olderPageData.dayType}
            displayDate={olderPageData.displayDate}
            colors={olderPageData.colors}
            warmups={olderPageData.warmups}
            upperExercise={olderPageData.upperExercise}
            lowerExercise={olderPageData.lowerExercise}
            abExercise={olderPageData.abExercise}
            canSkip={false}
            onSkip={() => {}}
            isPush={olderPageData.isPush}
            showDoneStamp={olderPageData.showDoneStamp}
            style={styles.pageBack}
            animatedStyle={{
              transform: [{ translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-SCREEN_WIDTH, 0],
              }) }],
            }}
            footerContent={
              <>
                <View style={[styles.completeBtn, styles.completeBtnDisabled, { backgroundColor: olderPageData.colors.primary }]}>
                  <Text style={styles.completeBtnText}>{olderPageData.showDoneStamp ? "Completed" : "Come back tomorrow"}</Text>
                </View>
                <View style={styles.swipeIndicator}>
                  {[...Array(totalDots)].map((_, i) => (
                    <View key={i} style={[styles.dot, i === Math.max(0, activeDotIndex - 1) && { backgroundColor: olderPageData.colors.primary, transform: [{ scale: 1.2 }] }]} />
                  ))}
                </View>
              </>
            }
          />
        )}

        {/* Current Page */}
        {currentPageData && (
          <WorkoutPage
            headerLabel={currentPageData.headerLabel}
            dayType={currentPageData.dayType}
            displayDate={currentPageData.displayDate}
            colors={currentPageData.colors}
            warmups={currentPageData.warmups}
            upperExercise={currentPageData.upperExercise}
            lowerExercise={currentPageData.lowerExercise}
            abExercise={currentPageData.abExercise}
            canSkip={currentPageData.canSkip}
            onSkip={skipExercise}
            isPush={currentPageData.isPush}
            showDoneStamp={currentPageData.showDoneStamp}
            style={styles.pageFront}
            animatedStyle={{
              transform: [{ translateX: slideAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
              }) }],
            }}
            footerContent={
              isViewingToday && !completedToday ? (
                <>
                  <TouchableOpacity
                    style={[styles.completeBtn, { backgroundColor: currentPageData.colors.primary }]}
                    onPress={completeDay}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.completeBtnText}>{buttonText}</Text>
                  </TouchableOpacity>
                  <View style={styles.swipeIndicator}>
                    {totalDots > 0 ? (
                      [...Array(totalDots)].map((_, i) => (
                        <View key={i} style={[styles.dot, i === activeDotIndex && { backgroundColor: currentPageData.colors.primary, transform: [{ scale: 1.2 }] }]} />
                      ))
                    ) : (
                      <View style={[styles.dot, { backgroundColor: currentPageData.colors.primary, transform: [{ scale: 1.2 }] }]} />
                    )}
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.completeBtn, styles.completeBtnDisabled, { backgroundColor: currentPageData.colors.primary }]}>
                    <Text style={styles.completeBtnText}>{currentPageData.showDoneStamp ? "Completed" : "Come back tomorrow"}</Text>
                  </View>
                  <View style={styles.swipeIndicator}>
                    {[...Array(totalDots)].map((_, i) => (
                      <View key={i} style={[styles.dot, i === activeDotIndex && { backgroundColor: currentPageData.colors.primary, transform: [{ scale: 1.2 }] }]} />
                    ))}
                  </View>
                </>
              )
            }
          />
        )}

        {/* Newer Page (swipe left reveals - comes from right) */}
        {newerPageData && (
          <WorkoutPage
            headerLabel={newerPageData.headerLabel}
            dayType={newerPageData.dayType}
            displayDate={newerPageData.displayDate}
            colors={newerPageData.colors}
            warmups={newerPageData.warmups}
            upperExercise={newerPageData.upperExercise}
            lowerExercise={newerPageData.lowerExercise}
            abExercise={newerPageData.abExercise}
            canSkip={false}
            onSkip={() => {}}
            isPush={newerPageData.isPush}
            showDoneStamp={newerPageData.showDoneStamp}
            style={styles.pageBack}
            animatedStyle={{
              transform: [{ translateX: slideAnim.interpolate({
                inputRange: [-1, 0],
                outputRange: [0, SCREEN_WIDTH],
              }) }],
            }}
            footerContent={
              <>
                <View style={[styles.completeBtn, styles.completeBtnDisabled, { backgroundColor: newerPageData.colors.primary }]}>
                  <Text style={styles.completeBtnText}>{newerPageData.showDoneStamp ? "Completed" : "Come back tomorrow"}</Text>
                </View>
                <View style={styles.swipeIndicator}>
                  {[...Array(totalDots)].map((_, i) => (
                    <View key={i} style={[styles.dot, i === Math.min(activeDotIndex + 1, totalDots - 1) && { backgroundColor: newerPageData.colors.primary, transform: [{ scale: 1.2 }] }]} />
                  ))}
                </View>
              </>
            }
          />
        )}

        {/* Settings Overlay */}
        {showSettings && (
          <>
            <Animated.View
              style={[styles.settingsBackdrop, { opacity: settingsBackdropOpacity }]}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={closeSettings}
                activeOpacity={1}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.settingsOverlay,
                { transform: [{ translateY: settingsTranslateY }] },
              ]}
            >
              <View style={styles.settingsHandle} />
              <Text style={styles.settingsTitle}>Settings</Text>

              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={seedData}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsBtnText}>Seed Demo Data</Text>
                <Text style={styles.settingsBtnSubtext}>Load sample workout history</Text>
              </TouchableOpacity>

              {__DEV__ && (
                <TouchableOpacity
                  style={[styles.settingsBtn, styles.settingsBtnDanger]}
                  onPress={resetData}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingsBtnText, styles.settingsBtnTextDanger]}>Reset All Data</Text>
                  <Text style={styles.settingsBtnSubtext}>Start fresh (dev only)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.settingsCloseBtn}
                onPress={closeSettings}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  page: {
    flex: 1,
    borderRadius: 0,
  },
  pageBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  pageFront: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  stampContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  stampBorder: {
    borderWidth: 6,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    transform: [{ rotate: '-25deg' }],
  },
  stampText: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 12,
    fontFamily: 'Courier',
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '400',
    color: COLORS.text.primary,
    fontFamily: 'Georgia',
  },
  date: {
    fontSize: 15,
    color: COLORS.text.muted,
    marginTop: 6,
  },
  swipeIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.text.muted,
    opacity: 0.3,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  exerciseLast: {
    borderBottomWidth: 0,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  completeBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  completeBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  completeBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  settingsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 100,
  },
  settingsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  settingsHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 24,
  },
  settingsBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  settingsBtnDanger: {
    backgroundColor: '#FFF5F5',
  },
  settingsBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  settingsBtnTextDanger: {
    color: COLORS.push.primary,
  },
  settingsBtnSubtext: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  settingsCloseBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  settingsCloseBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
});
