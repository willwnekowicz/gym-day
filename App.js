import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
  TextInput,
  ScrollView,
  Vibration,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const REST_DAY_QUOTES = [
  "Well deserved rest",
  "Amazing streak - time to recover",
  "6 in a row! Take it easy",
  "Your muscles thank you",
  "Recovery is part of the gains",
  "Champions know when to rest",
  "Recharge for the next 6",
  "Rest day = growth day",
  "You've earned this",
  "Let your body rebuild",
];

// Rest timer duration options in seconds
const REST_TIMER_OPTIONS = [30, 60, 90, 120];

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
  rest: {
    primary: '#2E7D32',
    secondary: '#4CAF50',
    bg: '#E8F5E9',
    bgGradientEnd: '#C8E6C9',
    subtle: '#C8E6C9',
    sectionGradient: 'rgba(46, 125, 50, 0.05)',
    stampColor: 'rgba(46, 125, 50, 0.18)',
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

function dateToKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

// Count consecutive completed workouts ending at the most recent completion
// Returns 0 if no completions, otherwise counts back from most recent
function getConsecutiveWorkouts(completions) {
  const sortedDates = Object.keys(completions).sort().reverse();
  if (sortedDates.length === 0) return 0;

  let count = 0;
  for (const dateKey of sortedDates) {
    if (completions[dateKey].type === 'rest') break;
    // Check that this date is the expected consecutive day
    if (count > 0) {
      const expected = new Date(sortedDates[0]);
      expected.setDate(expected.getDate() - count);
      const expectedKey = expected.toISOString().split('T')[0];
      if (dateKey !== expectedKey) break;
    }
    count++;
  }
  return count;
}

// Check if a specific date should be a rest day based on completions before it
function isRestDay(completions, dateKey) {
  // Walk backwards from the day before dateKey, checking each consecutive calendar day
  let consecutiveCount = 0;
  const target = new Date(dateKey + 'T00:00:00');

  for (let i = 1; i <= 6; i++) {
    const prev = new Date(target);
    prev.setDate(target.getDate() - i);
    const prevKey = prev.toISOString().split('T')[0];

    if (!completions[prevKey] || completions[prevKey].type === 'rest') {
      // Gap in calendar or a rest day breaks the streak
      return false;
    }
    consecutiveCount++;
  }
  return consecutiveCount >= 6;
}

// Check if today should be a rest day (6 consecutive workouts completed before today)
function shouldShowRestDay(completions, todayKey) {
  // Don't show rest day if today is already completed
  if (completions[todayKey]) return false;
  return isRestDay(completions, todayKey);
}

// Generate seed data - creates ~20 workout entries spread over 45 days
// with a guaranteed streak of 6 consecutive workouts at the end to trigger rest day
function generateSeedData(currentQueues, currentDayType) {
  const completions = {};
  const queues = JSON.parse(JSON.stringify(currentQueues));
  let dayType = currentDayType;

  // Days 7-45 ago: realistic spread with ~55% skip rate
  const daysToSkip = new Set();
  for (let i = 7; i <= 45; i++) {
    if (Math.random() < 0.55) {
      daysToSkip.add(i);
    }
  }

  // Generate data going backwards from 45 days ago to 7 days ago (spread data)
  for (let i = 45; i >= 7; i--) {
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

  // Days 1-6: guaranteed consecutive streak to trigger rest day
  for (let i = 6; i >= 1; i--) {
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
  notes,
  onDatePress,
}) {
  return (
    <Animated.View style={[styles.page, { backgroundColor: colors.bg }, style, animatedStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.dayLabel, { color: colors.primary }]}>
          {headerLabel}
        </Text>
        <Text style={styles.title}>{dayType} Day</Text>
        {onDatePress ? (
          <TouchableOpacity onPress={onDatePress} activeOpacity={0.6}>
            <Text style={[styles.date, styles.dateTappable, { color: colors.primary }]}>{displayDate}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.date}>{displayDate}</Text>
        )}
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
              {canSkip && (
                <TouchableOpacity
                  style={[styles.changeBtn, { backgroundColor: colors.subtle }]}
                  onPress={() => onSkip(isPush ? 'pushUpper' : 'pullUpper')}
                >
                  <Text style={[styles.changeBtnIcon, { color: colors.primary }]}>↻</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.exercise, styles.exerciseLast]}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseLabel}>LOWER</Text>
                <Text style={styles.exerciseName}>{lowerExercise}</Text>
              </View>
              {canSkip && (
                <TouchableOpacity
                  style={[styles.changeBtn, { backgroundColor: colors.subtle }]}
                  onPress={() => onSkip(isPush ? 'pushLower' : 'pullLower')}
                >
                  <Text style={[styles.changeBtnIcon, { color: colors.primary }]}>↻</Text>
                </TouchableOpacity>
              )}
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
              {canSkip && (
                <TouchableOpacity
                  style={[styles.changeBtn, { backgroundColor: colors.subtle }]}
                  onPress={() => onSkip('abs')}
                >
                  <Text style={[styles.changeBtnIcon, { color: colors.primary }]}>↻</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Notes - only show if notes exist */}
        {notes && notes.trim() !== '' && (
          <LinearGradient
            colors={[colors.sectionGradient, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>NOTES</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          </LinearGradient>
        )}
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

// Rest Day page component
function RestDayPage({
  headerLabel,
  displayDate,
  quote,
  showDoneStamp,
  style,
  animatedStyle,
  footerContent,
  onDatePress,
}) {
  const colors = COLORS.rest;

  return (
    <Animated.View style={[styles.page, { backgroundColor: colors.bg }, style, animatedStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.dayLabel, { color: colors.primary }]}>
          {headerLabel}
        </Text>
        <Text style={styles.title}>Rest Day</Text>
        {onDatePress ? (
          <TouchableOpacity onPress={onDatePress} activeOpacity={0.6}>
            <Text style={[styles.date, styles.dateTappable, { color: colors.primary }]}>{displayDate}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.date}>{displayDate}</Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.restDayContent}>
        <LinearGradient
          colors={[colors.sectionGradient, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.restDayQuoteContainer}
        >
          <Text style={[styles.restDayQuote, { color: colors.primary }]}>"{quote}"</Text>
          <Text style={styles.restDaySubtext}>6 workouts completed in a row!</Text>
          <Text style={styles.restDayEmoji}>🌿</Text>
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
            <Text style={[styles.stampText, { color: colors.stampColor }]}>REST</Text>
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('workout'); // 'workout' | 'exercises' | 'dev'
  const [showNav, setShowNav] = useState(false); // For workout page nav visibility
  const [newExercise, setNewExercise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('pushUpper');
  const [showRestTimer, setShowRestTimer] = useState(false); // For rest timer visibility
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = current page, 1 = next page (tomorrow or newer)
  const settingsAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible
  const calendarAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Track temporary skip indices for today's session (not persisted)
  const [skipIndices, setSkipIndices] = useState({
    pushUpper: 0,
    pushLower: 0,
    pullUpper: 0,
    pullLower: 0,
    abs: 0,
  });

  // Notes modal state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const notesModalAnim = useRef(new Animated.Value(0)).current;

  // Date override for logging workouts on a different day
  const [selectedDate, setSelectedDate] = useState(null); // null = today, Date object = override
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  // Check if today should be a rest day
  const todayIsRestDay = shouldShowRestDay(completions, today);

  // Get a stable random rest day quote
  const restDayQuote = useMemo(() => {
    return REST_DAY_QUOTES[Math.floor(Math.random() * REST_DAY_QUOTES.length)];
  }, []);

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
  const stateRef = useRef({ historyIndex, completedToday, pastCompletedDates, showCalendar, showNav, currentScreen });
  stateRef.current = { historyIndex, completedToday, pastCompletedDates, showCalendar, showNav, currentScreen };


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

  // Open notes modal when completing a workout
  const openNotesModal = () => {
    setShowNotesModal(true);
    setWorkoutNotes('');
    Animated.timing(notesModalAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Close notes modal
  const closeNotesModal = () => {
    Animated.timing(notesModalAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowNotesModal(false);
      setWorkoutNotes('');
    });
  };

  // Complete the workout with optional notes
  const completeDay = (notes = '') => {
    const completionDateKey = selectedDate ? dateToKey(selectedDate) : today;
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
        abExercise: prev.queues.abs[absIndex],
        notes: notes.trim() || undefined, // Only store notes if not empty
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
          [completionDateKey]: completedWorkout
        }
      };
    });

    // Reset skip indices and date override for next session
    setSkipIndices({
      pushUpper: 0,
      pushLower: 0,
      pullUpper: 0,
      pullLower: 0,
      abs: 0,
    });
    setSelectedDate(null);

    // Close the modal if it was open
    if (showNotesModal) {
      closeNotesModal();
    }
  };

  // Handler for the complete button - opens notes modal
  const handleCompletePress = () => {
    openNotesModal();
  };

  // Handler for confirming workout with notes
  const confirmWorkoutWithNotes = () => {
    completeDay(workoutNotes);
  };

  // Handler for skipping notes (complete without notes)
  const skipNotesAndComplete = () => {
    completeDay('');
  };

  // Complete rest day - just mark it as done without rotating queues or changing day type
  const completeRestDay = () => {
    const completionDateKey = selectedDate ? dateToKey(selectedDate) : today;
    setState(prev => ({
      ...prev,
      completions: {
        ...prev.completions,
        [completionDateKey]: { type: 'rest' }
      }
    }));
    setSelectedDate(null);
  };

  // Add a new exercise to a queue
  const addExercise = (queueKey, exerciseName) => {
    if (!exerciseName.trim()) return;
    setState(prev => ({
      ...prev,
      queues: {
        ...prev.queues,
        [queueKey]: [...prev.queues[queueKey], exerciseName.trim()]
      }
    }));
  };

  // Remove an exercise from a queue (minimum 1 exercise required)
  const removeExercise = (queueKey, index) => {
    setState(prev => {
      if (prev.queues[queueKey].length <= 1) return prev; // Keep at least 1 exercise
      const newQueue = [...prev.queues[queueKey]];
      newQueue.splice(index, 1);
      return {
        ...prev,
        queues: {
          ...prev.queues,
          [queueKey]: newQueue
        }
      };
    });
  };

  // Nav overlay functions (for workout page)
  const openNav = () => {
    setShowNav(true);
    Animated.timing(settingsAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeNav = () => {
    Animated.timing(settingsAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowNav(false);
    });
  };

  // Calendar overlay functions
  const openCalendar = () => {
    setShowCalendar(true);
    // Reset to current month when opening
    const now = new Date();
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
    Animated.timing(calendarAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeCalendar = () => {
    Animated.timing(calendarAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowCalendar(false);
    });
  };

  const changeMonth = (delta) => {
    setCalendarMonth(prev => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      return { year: newYear, month: newMonth };
    });
  };

  // Get the expected workout type for a given date
  const getExpectedTypeForDate = (dateKey) => {
    // Find the most recent completion before this date to determine alternation
    const sortedDates = Object.keys(completions).filter(d => d < dateKey).sort().reverse();
    if (sortedDates.length === 0) {
      // No prior completions, use currentDay as base
      return currentDay;
    }
    const lastCompletion = completions[sortedDates[0]];
    if (lastCompletion.type === 'rest') {
      // Find the workout before rest to continue alternation
      for (let i = 1; i < sortedDates.length; i++) {
        if (completions[sortedDates[i]].type !== 'rest') {
          return completions[sortedDates[i]].type === 'push' ? 'pull' : 'push';
        }
      }
      return currentDay;
    }
    return lastCompletion.type === 'push' ? 'pull' : 'push';
  };

  // Get first app use date (earliest completion)
  const firstAppUseDate = useMemo(() => {
    const dates = Object.keys(completions).sort();
    return dates.length > 0 ? dates[0] : null;
  }, [completions]);

  // Get color for a calendar day
  const getDateColor = (dateKey) => {
    const todayKey = getToday();
    const tomorrowKey = getTomorrow();
    const completion = completions[dateKey];

    // Past date with completion
    if (completion) {
      if (completion.type === 'push') return COLORS.push.primary;
      if (completion.type === 'pull') return COLORS.pull.primary;
      if (completion.type === 'rest') return COLORS.rest.primary;
    }

    // Today (not completed)
    if (dateKey === todayKey) {
      if (todayIsRestDay) return COLORS.rest.primary;
      return currentDay === 'push' ? COLORS.push.primary : COLORS.pull.primary;
    }

    // Tomorrow
    if (dateKey === tomorrowKey) {
      // Light version of expected type
      const expectedType = completedToday ? currentDay : (currentDay === 'push' ? 'pull' : 'push');
      // Check if tomorrow would be rest day
      const wouldBeRestDay = isRestDay(completions, tomorrowKey);
      if (wouldBeRestDay) return '#C8E6C9'; // Light green
      return expectedType === 'push' ? '#FFCDD2' : '#BBDEFB'; // Light red or light blue
    }

    // Future dates (after tomorrow)
    if (dateKey > todayKey) {
      return '#E0E0E0'; // Light gray
    }

    // Past date without completion
    if (firstAppUseDate && dateKey >= firstAppUseDate) {
      // After first app use but not completed = skipped
      return '#1A1A1A'; // Black
    }

    // Before first app use
    return '#E0E0E0'; // Light gray
  };

  // Handle date selection in calendar
  const handleDateSelect = (dateKey) => {
    const todayKey = getToday();
    closeCalendar();
    if (dateKey === todayKey) {
      setHistoryIndex(null);
    } else {
      const index = pastCompletedDates.indexOf(dateKey);
      if (index !== -1) setHistoryIndex(index);
    }
  };

  // Calendar pan responder for swiping between months
  const calendarPanResponder = useMemo(() => {
    let startX = 0;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal swipes
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: (_, gestureState) => {
        startX = gestureState.x0;
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 50;
        const velocityThreshold = 0.3;

        // Swipe right = previous month, swipe left = next month
        if (gestureState.dx > threshold || gestureState.vx > velocityThreshold) {
          changeMonth(-1);
        } else if (gestureState.dx < -threshold || gestureState.vx < -velocityThreshold) {
          changeMonth(1);
        }
      },
    });
  }, []);

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
  };

  const seedData = () => {
    const seeded = generateSeedData(INITIAL_QUEUES, 'push');
    setState(seeded);
    setHistoryIndex(null); // Stay on today view
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
      const { historyIndex: hi, completedToday: ct, pastCompletedDates: pcd, showCalendar: sc, showSettings: ss, currentScreen: cs } = stateRef.current;
      const viewingTomorrow = hi === -1;
      const viewingToday = hi === null;
      const viewingHistory = hi !== null && hi >= 0;
      const goToHistory = pcd.length > 0;
      const goOlder = viewingHistory && hi < pcd.length - 1;
      const goNewer = viewingHistory && hi > 0;
      const goToTomorrow = viewingToday && !!ct;
      return { hi, viewingTomorrow, viewingToday, viewingHistory, goToHistory, goOlder, goNewer, goToTomorrow, showCalendar: sc, showSettings: ss, currentScreen: cs };
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { showCalendar: sc, showNav: sn, currentScreen: cs } = getState();
        // Block gestures when calendar is open
        if (sc) return false;

        // When nav is open, only allow vertical swipe down to close it
        if (sn) {
          const isVerticalDown = gestureState.dy > 20 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
          return isVerticalDown;
        }

        // No gestures on exercises screen
        if (cs === 'exercises') return false;

        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isVerticalUp = gestureState.dy < -20 && !isHorizontal;
        const isVerticalDown = gestureState.dy > 20 && !isHorizontal;

        const { viewingTomorrow, goToHistory, goToTomorrow } = getState();
        // Can swipe if: viewing tomorrow (can go back), have history, or can go to tomorrow
        const canSwipe = (viewingTomorrow || goToHistory || goToTomorrow) && Math.abs(gestureState.dx) > 10 && isHorizontal;
        return isVerticalUp || isVerticalDown || canSwipe;
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

        // Swipe up opens nav (workout page only)
        if (!isHorizontal && (gestureState.dy < -50 || gestureState.vy < -0.5)) {
          openNav();
          return;
        }

        // Swipe down: close nav if open, otherwise open calendar
        if (!isHorizontal && (gestureState.dy > 50 || gestureState.vy > 0.5)) {
          const { showNav: sn } = getState();
          if (sn) {
            closeNav();
          } else {
            openCalendar();
          }
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
    outputRange: [300, 0],
  });
  const settingsBackdropOpacity = settingsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  // Calendar overlay animation values
  const calendarTranslateY = calendarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_HEIGHT, 0],
  });
  const calendarBackdropOpacity = calendarAnim.interpolate({
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

    // Handle rest days in history
    if (completion.type === 'rest') {
      return {
        isRestDay: true,
        headerLabel: getDateLabel(dateKey),
        displayDate: formatDate(new Date(dateKey + 'T12:00:00')),
        quote: REST_DAY_QUOTES[Math.floor(Math.random() * REST_DAY_QUOTES.length)],
        showDoneStamp: true,
      };
    }

    const isPush = completion.type === 'push';
    const colors = isPush ? COLORS.push : COLORS.pull;
    return {
      isRestDay: false,
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
      notes: completion.notes,
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
        // Show completed rest day
        if (completedToday.type === 'rest') {
          return {
            isRestDay: true,
            headerLabel: "Today's Rest Day",
            displayDate: formatDate(new Date()),
            quote: restDayQuote,
            showDoneStamp: true,
          };
        }
        // Show completed workout with correct type from completion data
        const isPush = completedToday.type === 'push';
        const colors = isPush ? COLORS.push : COLORS.pull;
        return {
          isRestDay: false,
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
          notes: completedToday.notes,
        };
      }
      // Today is a rest day (not yet completed)
      if (todayIsRestDay) {
        const displayDateObj = selectedDate || new Date();
        return {
          isRestDay: true,
          headerLabel: selectedDate ? getDateLabel(dateToKey(selectedDate)) : "Today's Rest Day",
          displayDate: formatDate(displayDateObj),
          quote: restDayQuote,
          showDoneStamp: false,
          dateOverridden: !!selectedDate,
        };
      }
      const displayDateObj = selectedDate || new Date();
      return {
        isRestDay: false,
        headerLabel: selectedDate ? getDateLabel(dateToKey(selectedDate)) : "Today's Workout",
        dayType: todayIsPush ? 'Push' : 'Pull',
        displayDate: formatDate(displayDateObj),
        colors: todayColors,
        warmups: todayWarmups,
        upperExercise: getExerciseAtIndex(todayUpperKey),
        lowerExercise: getExerciseAtIndex(todayLowerKey),
        abExercise: getExerciseAtIndex('abs'),
        showDoneStamp: false,
        isPush: todayIsPush,
        canSkip: true,
        dateOverridden: !!selectedDate,
      };
    }
    return getHistoryPageData(historyIndex);
  };

  // Get the page that appears when swiping right (older content)
  const getOlderPageData = () => {
    if (isViewingTomorrow) {
      // Swiping right from tomorrow shows today
      if (completedToday) {
        if (completedToday.type === 'rest') {
          return {
            isRestDay: true,
            headerLabel: "Today's Rest Day",
            displayDate: formatDate(new Date()),
            quote: restDayQuote,
            showDoneStamp: true,
          };
        }
        const isPush = completedToday.type === 'push';
        const colors = isPush ? COLORS.push : COLORS.pull;
        return {
          isRestDay: false,
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
          notes: completedToday.notes,
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
          if (completedToday.type === 'rest') {
            return {
              isRestDay: true,
              headerLabel: "Today's Rest Day",
              displayDate: formatDate(new Date()),
              quote: restDayQuote,
              showDoneStamp: true,
            };
          }
          const isPush = completedToday.type === 'push';
          const colors = isPush ? COLORS.push : COLORS.pull;
          return {
            isRestDay: false,
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
            notes: completedToday.notes,
          };
        }
        // Today is rest day (not completed)
        if (todayIsRestDay) {
          return {
            isRestDay: true,
            headerLabel: "Today's Rest Day",
            displayDate: formatDate(new Date()),
            quote: restDayQuote,
            showDoneStamp: false,
          };
        }
        return {
          isRestDay: false,
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
        {currentScreen === 'workout' && olderPageData && (
          olderPageData.isRestDay ? (
            <RestDayPage
              headerLabel={olderPageData.headerLabel}
              displayDate={olderPageData.displayDate}
              quote={olderPageData.quote}
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
                  <View style={[styles.completeBtn, styles.completeBtnDisabled, { backgroundColor: COLORS.rest.primary }]}>
                    <Text style={styles.completeBtnText}>Rested</Text>
                  </View>
                  <View style={styles.swipeIndicator}>
                    {[...Array(totalDots)].map((_, i) => (
                      <View key={i} style={[styles.dot, i === Math.max(0, activeDotIndex - 1) && { backgroundColor: COLORS.rest.primary, transform: [{ scale: 1.2 }] }]} />
                    ))}
                  </View>
                </>
              }
            />
          ) : (
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
              notes={olderPageData.notes}
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
          )
        )}

        {/* Current Page */}
        {currentScreen === 'workout' && currentPageData && (
          currentPageData.isRestDay ? (
            <RestDayPage
              headerLabel={currentPageData.headerLabel}
              displayDate={currentPageData.displayDate}
              quote={currentPageData.quote}
              showDoneStamp={currentPageData.showDoneStamp}
              onDatePress={isViewingToday && !completedToday ? () => setShowDatePicker(true) : undefined}
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
                      style={[styles.completeBtn, { backgroundColor: COLORS.rest.primary }]}
                      onPress={completeRestDay}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.completeBtnText}>Enjoy the rest</Text>
                    </TouchableOpacity>
                    <View style={styles.swipeIndicator}>
                      {totalDots > 0 ? (
                        [...Array(totalDots)].map((_, i) => (
                          <View key={i} style={[styles.dot, i === activeDotIndex && { backgroundColor: COLORS.rest.primary, transform: [{ scale: 1.2 }] }]} />
                        ))
                      ) : (
                        <View style={[styles.dot, { backgroundColor: COLORS.rest.primary, transform: [{ scale: 1.2 }] }]} />
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.completeBtn, styles.completeBtnDisabled, { backgroundColor: COLORS.rest.primary }]}>
                      <Text style={styles.completeBtnText}>Rested</Text>
                    </View>
                    <View style={styles.swipeIndicator}>
                      {[...Array(totalDots)].map((_, i) => (
                        <View key={i} style={[styles.dot, i === activeDotIndex && { backgroundColor: COLORS.rest.primary, transform: [{ scale: 1.2 }] }]} />
                      ))}
                    </View>
                  </>
                )
              }
            />
          ) : (
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
              onDatePress={isViewingToday && !completedToday ? () => setShowDatePicker(true) : undefined}
              style={styles.pageFront}
              animatedStyle={{
                transform: [{ translateX: slideAnim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                }) }],
              }}
              notes={currentPageData.notes}
              footerContent={
                isViewingToday && !completedToday ? (
                  <>
                    <TouchableOpacity
                      style={[styles.completeBtn, { backgroundColor: currentPageData.colors.primary }]}
                      onPress={handleCompletePress}
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
          )
        )}

        {/* Newer Page (swipe left reveals - comes from right) */}
        {currentScreen === 'workout' && newerPageData && (
          newerPageData.isRestDay ? (
            <RestDayPage
              headerLabel={newerPageData.headerLabel}
              displayDate={newerPageData.displayDate}
              quote={newerPageData.quote}
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
                  <View style={[styles.completeBtn, styles.completeBtnDisabled, { backgroundColor: COLORS.rest.primary }]}>
                    <Text style={styles.completeBtnText}>{newerPageData.showDoneStamp ? "Rested" : "Rest day"}</Text>
                  </View>
                  <View style={styles.swipeIndicator}>
                    {[...Array(totalDots)].map((_, i) => (
                      <View key={i} style={[styles.dot, i === Math.min(activeDotIndex + 1, totalDots - 1) && { backgroundColor: COLORS.rest.primary, transform: [{ scale: 1.2 }] }]} />
                    ))}
                  </View>
                </>
              }
            />
          ) : (
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
              notes={newerPageData.notes}
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
          )
        )}

        {/* Bottom Navigation Bar */}
        {/* On workout page: slides up on swipe, on other pages: always visible */}
        {(currentScreen !== 'workout' || showNav) && (
          <>
            {/* Backdrop only on workout page when nav is open */}
            {currentScreen === 'workout' && showNav && (
              <Animated.View
                style={[styles.navBackdrop, { opacity: settingsBackdropOpacity }]}
              >
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  onPress={closeNav}
                  activeOpacity={1}
                />
              </Animated.View>
            )}
            <Animated.View style={[
              styles.bottomNav,
              currentScreen === 'workout' && styles.bottomNavSlide,
              currentScreen === 'workout' && { transform: [{ translateY: settingsTranslateY }] }
            ]}>
              {currentScreen === 'workout' && <View style={styles.navHandle} />}

              <View style={styles.navIconsRow}>
                <TouchableOpacity
                  style={[
                    styles.bottomNavBtn,
                    currentScreen === 'workout' && styles.bottomNavBtnActive
                  ]}
                  onPress={() => { setCurrentScreen('workout'); if (showNav) closeNav(); }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={currentScreen === 'workout' ? 'barbell' : 'barbell-outline'}
                    size={24}
                    color={currentScreen === 'workout' ? COLORS.text.primary : COLORS.text.muted}
                  />
                  <Text style={[
                    styles.bottomNavLabel,
                    currentScreen === 'workout' && styles.bottomNavLabelActive
                  ]}>Workout</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.bottomNavBtn,
                    currentScreen === 'exercises' && styles.bottomNavBtnActive
                  ]}
                  onPress={() => { setCurrentScreen('exercises'); if (showNav) closeNav(); }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={currentScreen === 'exercises' ? 'list' : 'list-outline'}
                    size={24}
                    color={currentScreen === 'exercises' ? COLORS.text.primary : COLORS.text.muted}
                  />
                  <Text style={[
                    styles.bottomNavLabel,
                    currentScreen === 'exercises' && styles.bottomNavLabelActive
                  ]}>Exercises</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bottomNavBtn}
                  onPress={() => { openCalendar(); if (showNav) closeNav(); }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={COLORS.text.muted}
                  />
                  <Text style={styles.bottomNavLabel}>Calendar</Text>
                </TouchableOpacity>


                {__DEV__ && (
                  <TouchableOpacity
                    style={[
                      styles.bottomNavBtn,
                      currentScreen === 'dev' && styles.bottomNavBtnActive
                    ]}
                    onPress={() => { setCurrentScreen('dev'); if (showNav) closeNav(); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={currentScreen === 'dev' ? 'construct' : 'construct-outline'}
                      size={24}
                      color={currentScreen === 'dev' ? COLORS.text.primary : COLORS.text.muted}
                    />
                    <Text style={[
                      styles.bottomNavLabel,
                      currentScreen === 'dev' && styles.bottomNavLabelActive
                    ]}>Dev</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </>
        )}

        {/* Calendar Overlay */}
        {showCalendar && (
          <>
            <Animated.View
              style={[styles.calendarBackdrop, { opacity: calendarBackdropOpacity }]}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={closeCalendar}
                activeOpacity={1}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.calendarOverlay,
                { transform: [{ translateY: calendarTranslateY }] },
              ]}
              {...calendarPanResponder.panHandlers}
            >
              <View style={styles.calendarHandle} />

              {/* Month Header */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calendarArrow}>
                  <Text style={styles.calendarArrowText}>{"<"}</Text>
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>
                  {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calendarArrow}>
                  <Text style={styles.calendarArrowText}>{">"}</Text>
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers */}
              <View style={styles.calendarWeekHeader}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <Text key={i} style={styles.calendarWeekDay}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {(() => {
                  const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
                  const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startDayOfWeek = firstDay.getDay();
                  const todayKey = getToday();

                  const weeks = [];
                  let currentWeek = [];

                  // Padding for first week
                  for (let i = 0; i < startDayOfWeek; i++) {
                    currentWeek.push(null);
                  }

                  // Days of month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateKey = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    currentWeek.push({ day, dateKey });

                    if (currentWeek.length === 7) {
                      weeks.push(currentWeek);
                      currentWeek = [];
                    }
                  }

                  // Padding for last week
                  while (currentWeek.length > 0 && currentWeek.length < 7) {
                    currentWeek.push(null);
                  }
                  if (currentWeek.length > 0) {
                    weeks.push(currentWeek);
                  }

                  return weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.calendarWeekRow}>
                      {week.map((dayData, dayIndex) => {
                        if (!dayData) {
                          return <View key={dayIndex} style={styles.calendarDayCell} />;
                        }

                        const { day, dateKey } = dayData;
                        const color = getDateColor(dateKey);
                        const isToday = dateKey === todayKey;
                        const hasCompletion = !!completions[dateKey];
                        const isTappable = hasCompletion || isToday;
                        const isFuture = dateKey > todayKey;
                        const isBeforeFirstUse = firstAppUseDate && dateKey < firstAppUseDate;

                        return (
                          <TouchableOpacity
                            key={dayIndex}
                            style={styles.calendarDayCell}
                            onPress={() => isTappable && handleDateSelect(dateKey)}
                            disabled={!isTappable}
                            activeOpacity={isTappable ? 0.7 : 1}
                          >
                            <View
                              style={[
                                styles.calendarDay,
                                { backgroundColor: color },
                                isToday && styles.calendarDayToday,
                                (isFuture || isBeforeFirstUse) && !isToday && styles.calendarDayFuture,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.calendarDayText,
                                  (color === '#1A1A1A' || color === COLORS.push.primary || color === COLORS.pull.primary || color === COLORS.rest.primary) && styles.calendarDayTextLight,
                                ]}
                              >
                                {day}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ));
                })()}
              </View>

              {/* Legend */}
              <View style={styles.calendarLegend}>
                <View style={styles.calendarLegendItem}>
                  <View style={[styles.calendarLegendDot, { backgroundColor: COLORS.push.primary }]} />
                  <Text style={styles.calendarLegendText}>Push</Text>
                </View>
                <View style={styles.calendarLegendItem}>
                  <View style={[styles.calendarLegendDot, { backgroundColor: COLORS.pull.primary }]} />
                  <Text style={styles.calendarLegendText}>Pull</Text>
                </View>
                <View style={styles.calendarLegendItem}>
                  <View style={[styles.calendarLegendDot, { backgroundColor: COLORS.rest.primary }]} />
                  <Text style={styles.calendarLegendText}>Rest</Text>
                </View>
                <View style={styles.calendarLegendItem}>
                  <View style={[styles.calendarLegendDot, { backgroundColor: '#1A1A1A' }]} />
                  <Text style={styles.calendarLegendText}>Skipped</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.calendarCloseBtn}
                onPress={closeCalendar}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Exercise Management Screen */}
        {currentScreen === 'exercises' && (
          <View style={styles.exerciseManagementScreen}>
            <View style={styles.exerciseManagementHeader}>
              <Text style={styles.exerciseManagementTitle}>Manage Exercises</Text>
              <Text style={styles.exerciseManagementSubtitle}>Add or remove exercises from your rotation</Text>
            </View>

            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabsContainer}
              contentContainerStyle={styles.categoryTabs}
            >
              {[
                { key: 'pushUpper', label: 'Push Upper', color: COLORS.push.primary },
                { key: 'pushLower', label: 'Push Lower', color: COLORS.push.primary },
                { key: 'pullUpper', label: 'Pull Upper', color: COLORS.pull.primary },
                { key: 'pullLower', label: 'Pull Lower', color: COLORS.pull.primary },
                { key: 'abs', label: 'Abs', color: COLORS.text.primary },
              ].map(({ key, label, color }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryTab,
                    selectedCategory === key && { backgroundColor: color }
                  ]}
                  onPress={() => setSelectedCategory(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryTabText,
                    selectedCategory === key && styles.categoryTabTextActive
                  ]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Add Exercise Input */}
            <View style={styles.addExerciseContainer}>
              <TextInput
                style={styles.addExerciseInput}
                placeholder="Add new exercise..."
                placeholderTextColor={COLORS.text.muted}
                value={newExercise}
                onChangeText={setNewExercise}
                onSubmitEditing={() => {
                  addExercise(selectedCategory, newExercise);
                  setNewExercise('');
                }}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.addExerciseBtn,
                  { backgroundColor: selectedCategory.startsWith('push') ? COLORS.push.primary :
                                     selectedCategory.startsWith('pull') ? COLORS.pull.primary :
                                     COLORS.text.primary }
                ]}
                onPress={() => {
                  addExercise(selectedCategory, newExercise);
                  setNewExercise('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.addExerciseBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Exercise List */}
            <ScrollView style={styles.exerciseListContainer} showsVerticalScrollIndicator={false}>
              {queues[selectedCategory].map((exercise, index) => (
                <View key={`${selectedCategory}-${index}`} style={styles.exerciseListItem}>
                  <View style={styles.exerciseListItemInfo}>
                    <Text style={styles.exerciseListItemNumber}>{index + 1}</Text>
                    <Text style={styles.exerciseListItemName}>{exercise}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeExerciseBtn}
                    onPress={() => removeExercise(selectedCategory, index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeExerciseBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {queues[selectedCategory].length === 0 && (
                <Text style={styles.emptyListText}>No exercises yet. Add one above!</Text>
              )}
              <View style={styles.exerciseListSpacer} />
            </ScrollView>
          </View>
        )}


        {/* Dev Screen */}
        {__DEV__ && currentScreen === 'dev' && (
          <View style={styles.devScreen}>
            <View style={styles.devHeader}>
              <Text style={styles.devTitle}>Developer Tools</Text>
              <Text style={styles.devSubtitle}>Testing and debugging options</Text>
            </View>

            <View style={styles.devContent}>
              <TouchableOpacity
                style={styles.devBtn}
                onPress={seedData}
                activeOpacity={0.7}
              >
                <Ionicons name="flask-outline" size={24} color={COLORS.text.primary} />
                <View style={styles.devBtnText}>
                  <Text style={styles.devBtnTitle}>Seed Demo Data</Text>
                  <Text style={styles.devBtnSubtitle}>Load ~month of history + 6-day streak</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devBtn, styles.devBtnDanger]}
                onPress={resetData}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={24} color={COLORS.push.primary} />
                <View style={styles.devBtnText}>
                  <Text style={[styles.devBtnTitle, styles.devBtnTitleDanger]}>Reset All Data</Text>
                  <Text style={styles.devBtnSubtitle}>Clear all workouts and start fresh</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.devSpacer} />
          </View>
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          <Modal
            transparent
            visible={showDatePicker}
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Log workout for</Text>
                  <TouchableOpacity onPress={() => { setSelectedDate(null); setShowDatePicker(false); }}>
                    <Text style={styles.datePickerReset}>Reset to today</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(event, date) => {
                    if (event.type === 'set' && date) {
                      setSelectedDate(date);
                    }
                  }}
                  style={styles.datePicker}
                />
                <TouchableOpacity
                  style={[styles.datePickerDoneBtn, { backgroundColor: todayIsRestDay ? COLORS.rest.primary : (todayIsPush ? COLORS.push.primary : COLORS.pull.primary) }]}
                  onPress={() => setShowDatePicker(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.datePickerDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Notes Modal */}
        {showNotesModal && (
          <Modal
            transparent
            visible={showNotesModal}
            animationType="none"
            onRequestClose={closeNotesModal}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.notesModalContainer}
            >
              <Animated.View
                style={[
                  styles.notesModalBackdrop,
                  {
                    opacity: notesModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.5],
                    }),
                  },
                ]}
              >
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  onPress={skipNotesAndComplete}
                  activeOpacity={1}
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.notesModalContent,
                  {
                    transform: [
                      {
                        translateY: notesModalAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.notesModalHandle} />
                <Text style={styles.notesModalTitle}>Add workout notes?</Text>
                <Text style={styles.notesModalSubtitle}>Record how you felt, weights used, or any other details</Text>
                <TextInput
                  style={styles.notesModalInput}
                  placeholder="e.g., Increased bench to 185lbs, felt strong today..."
                  placeholderTextColor={COLORS.text.muted}
                  value={workoutNotes}
                  onChangeText={setWorkoutNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
                <View style={styles.notesModalButtons}>
                  <TouchableOpacity
                    style={styles.notesModalSkipBtn}
                    onPress={skipNotesAndComplete}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.notesModalSkipBtnText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.notesModalSaveBtn,
                      { backgroundColor: todayIsPush ? COLORS.push.primary : COLORS.pull.primary },
                    ]}
                    onPress={confirmWorkoutWithNotes}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.notesModalSaveBtnText}>
                      {workoutNotes.trim() ? 'Save & Complete' : 'Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Modal>
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
  dateTappable: {
    textDecorationLine: 'underline',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  datePickerReset: {
    fontSize: 14,
    color: COLORS.text.muted,
    textDecorationLine: 'underline',
  },
  datePicker: {
    height: 200,
  },
  datePickerDoneBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  datePickerDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  restDayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  restDayQuoteContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  restDayQuote: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  restDaySubtext: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  restDayEmoji: {
    fontSize: 64,
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
  changeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  changeBtnIcon: {
    fontSize: 22,
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
  // Nav backdrop (for workout page slide-up)
  navBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 90,
  },
  navHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  navIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  // Calendar styles
  calendarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 100,
  },
  calendarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  calendarHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarArrow: {
    padding: 12,
  },
  calendarArrowText: {
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.text.primary,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarWeekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  calendarGrid: {
    marginBottom: 16,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  calendarDayCell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayToday: {
    borderWidth: 3,
    borderColor: '#1A1A1A',
  },
  calendarDayFuture: {
    opacity: 0.5,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  calendarDayTextLight: {
    color: '#fff',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  calendarLegendText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  calendarCloseBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  calendarCloseBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  // Bottom Navigation Bar styles
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingBottom: 34,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    zIndex: 95,
  },
  bottomNavSlide: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  bottomNavBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 4,
  },
  bottomNavBtnActive: {
    backgroundColor: '#F0F0F0',
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text.muted,
  },
  bottomNavLabelActive: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  // Exercise Management Screen styles
  exerciseManagementScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 50,
  },
  exerciseManagementHeader: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  exerciseManagementTitle: {
    fontSize: 32,
    fontWeight: '400',
    color: COLORS.text.primary,
    fontFamily: 'Georgia',
  },
  exerciseManagementSubtitle: {
    fontSize: 15,
    color: COLORS.text.muted,
    marginTop: 6,
  },
  categoryTabsContainer: {
    flexGrow: 0,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 6,
  },
  categoryTab: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  addExerciseContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  addExerciseInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  addExerciseBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseBtnText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#fff',
  },
  exerciseListContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  exerciseListItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseListItemNumber: {
    width: 28,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  exerciseListItemName: {
    fontSize: 16,
    color: COLORS.text.primary,
    flex: 1,
  },
  removeExerciseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  removeExerciseBtnText: {
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.push.primary,
    marginTop: -2,
  },
  emptyListText: {
    textAlign: 'center',
    color: COLORS.text.muted,
    fontSize: 15,
    paddingVertical: 40,
  },
  exerciseListSpacer: {
    height: 120,
  },
  // Dev Screen styles
  devScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 50,
  },
  devHeader: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  devTitle: {
    fontSize: 32,
    fontWeight: '400',
    color: COLORS.text.primary,
    fontFamily: 'Georgia',
  },
  devSubtitle: {
    fontSize: 15,
    color: COLORS.text.muted,
    marginTop: 6,
  },
  devContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  devBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  devBtnDanger: {
    backgroundColor: '#FFF5F5',
  },
  devBtnText: {
    flex: 1,
  },
  devBtnTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  devBtnTitleDanger: {
    color: COLORS.push.primary,
  },
  devBtnSubtitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  devSpacer: {
    height: 120,
  },
  // Notes styles
  notesContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  notesText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Notes Modal styles
  notesModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  notesModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  notesModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  notesModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  notesModalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  notesModalSubtitle: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 20,
  },
  notesModalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
    minHeight: 100,
    marginBottom: 20,
  },
  notesModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  notesModalSkipBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  notesModalSkipBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  notesModalSaveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  notesModalSaveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
