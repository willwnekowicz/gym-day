import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  "Proud of you",
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
  return new Date().toISOString().split('T')[0];
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
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
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
                  style={[styles.skipBtn, { backgroundColor: colors.subtle }]}
                  onPress={() => onSkip(isPush ? 'pushUpper' : 'pullUpper')}
                >
                  <Text style={[styles.skipBtnText, { color: colors.primary }]}>Skip</Text>
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
                  style={[styles.skipBtn, { backgroundColor: colors.subtle }]}
                  onPress={() => onSkip(isPush ? 'pushLower' : 'pullLower')}
                >
                  <Text style={[styles.skipBtnText, { color: colors.primary }]}>Skip</Text>
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
                  style={[styles.skipBtn, { backgroundColor: colors.subtle }]}
                  onPress={() => onSkip('abs')}
                >
                  <Text style={[styles.skipBtnText, { color: colors.primary }]}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </ScrollView>

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
  const [viewingCompleted, setViewingCompleted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = completed, 1 = tomorrow

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

  // Animate to specific page
  const animateToPage = (toCompleted, duration = 400) => {
    Animated.timing(slideAnim, {
      toValue: toCompleted ? 0 : 1,
      duration,
      easing: Easing.bezier(0.32, 0.72, 0, 1), // iOS spring-like curve
      useNativeDriver: true,
    }).start(() => {
      setViewingCompleted(toCompleted);
    });
  };

  // Pan responder for swipe gestures - high-end iOS-like behavior
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !!completedToday,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !!completedToday && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!completedToday) return;
        // Convert dx to 0-1 range (0 = completed, 1 = tomorrow)
        const currentBase = viewingCompleted ? 0 : 1;
        const progress = currentBase - (gestureState.dx / SCREEN_WIDTH);
        // Clamp between 0 and 1 with slight overscroll resistance
        const clamped = Math.max(-0.1, Math.min(1.1, progress));
        slideAnim.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!completedToday) return;

        const threshold = SCREEN_WIDTH * 0.2;
        const velocityThreshold = 0.5;
        const currentBase = viewingCompleted ? 0 : 1;
        const progress = currentBase - (gestureState.dx / SCREEN_WIDTH);

        // Determine target based on position and velocity
        let targetCompleted;
        if (Math.abs(gestureState.vx) > velocityThreshold) {
          // Velocity-based decision
          targetCompleted = gestureState.vx > 0;
        } else if (gestureState.dx > threshold) {
          targetCompleted = true;
        } else if (gestureState.dx < -threshold) {
          targetCompleted = false;
        } else {
          targetCompleted = viewingCompleted;
        }

        // Calculate remaining distance for proportional duration
        const targetValue = targetCompleted ? 0 : 1;
        const distance = Math.abs(progress - targetValue);
        const duration = Math.max(150, Math.min(400, distance * 500));

        Animated.timing(slideAnim, {
          toValue: targetValue,
          duration,
          easing: Easing.bezier(0.32, 0.72, 0, 1),
          useNativeDriver: true,
        }).start(() => {
          setViewingCompleted(targetCompleted);
        });
      },
    });
  }, [completedToday, slideAnim, viewingCompleted]);

  // Data for completed page (left page)
  const completedDay = completedToday ? completedToday.type : currentDay;
  const completedIsPush = completedDay === 'push';
  const completedColors = completedIsPush ? COLORS.push : COLORS.pull;
  const completedWarmups = WARMUPS[completedDay];
  const completedUpper = completedToday?.upperExercise || '';
  const completedLower = completedToday?.lowerExercise || '';
  const completedAbs = completedToday?.abExercise || '';

  // Data for tomorrow page (right page)
  const tomorrowIsPush = currentDay === 'push';
  const tomorrowColors = tomorrowIsPush ? COLORS.push : COLORS.pull;
  const tomorrowWarmups = WARMUPS[currentDay];
  const tomorrowUpperKey = tomorrowIsPush ? 'pushUpper' : 'pullUpper';
  const tomorrowLowerKey = tomorrowIsPush ? 'pushLower' : 'pullLower';
  const tomorrowUpper = queues[tomorrowUpperKey][0];
  const tomorrowLower = queues[tomorrowLowerKey][0];
  const tomorrowAbs = queues.abs[0];

  // Animation interpolations for both pages
  const completedPageTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH * 0.3],
  });
  const completedPageScale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });
  const completedPageOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.7, 0.5],
  });

  const tomorrowPageTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH, 0],
  });
  const tomorrowPageScale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  // Current display colors (for footer)
  const displayColors = viewingCompleted ? completedColors : tomorrowColors;

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

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.push.bg }]}>
        <StatusBar style="dark" />
      </View>
    );
  }

  // Single page view (not completed yet)
  if (!completedToday) {
    const isPush = currentDay === 'push';
    const colors = isPush ? COLORS.push : COLORS.pull;
    const warmups = WARMUPS[currentDay];
    const upperKey = isPush ? 'pushUpper' : 'pullUpper';
    const lowerKey = isPush ? 'pushLower' : 'pullLower';

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          <StatusBar style="dark" />
          <WorkoutPage
            headerLabel="Today's Workout"
            dayType={isPush ? 'Push' : 'Pull'}
            displayDate={formatDate(new Date())}
            colors={colors}
            warmups={warmups}
            upperExercise={getExerciseAtIndex(upperKey)}
            lowerExercise={getExerciseAtIndex(lowerKey)}
            abExercise={getExerciseAtIndex('abs')}
            canSkip={true}
            onSkip={skipExercise}
            isPush={isPush}
            showDoneStamp={false}
            footerContent={
              <TouchableOpacity
                style={[styles.completeBtn, { backgroundColor: colors.primary }]}
                onPress={completeDay}
                activeOpacity={0.8}
              >
                <Text style={styles.completeBtnText}>{buttonText}</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  // Two page view (completed - can swipe between completed and tomorrow)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <StatusBar style="dark" />

        {/* Completed Page (Left/Back) */}
        <WorkoutPage
          headerLabel="Completed Today"
          dayType={completedIsPush ? 'Push' : 'Pull'}
          displayDate={formatDate(new Date())}
          colors={completedColors}
          warmups={completedWarmups}
          upperExercise={completedUpper}
          lowerExercise={completedLower}
          abExercise={completedAbs}
          canSkip={false}
          onSkip={() => {}}
          isPush={completedIsPush}
          showDoneStamp={true}
          style={styles.pageBack}
          animatedStyle={{
            transform: [
              { translateX: completedPageTranslate },
              { scale: completedPageScale },
            ],
            opacity: completedPageOpacity,
          }}
          footerContent={
            <>
              <View style={[styles.completeBtn, styles.completeBtnDisabled, { backgroundColor: completedColors.primary }]}>
                <Text style={styles.completeBtnText}>Completed</Text>
              </View>
              <View style={styles.swipeIndicator}>
                <View style={[styles.dot, { backgroundColor: completedColors.primary, transform: [{ scale: 1.2 }] }]} />
                <View style={styles.dot} />
              </View>
            </>
          }
        />

        {/* Tomorrow Page (Right/Front) */}
        <WorkoutPage
          headerLabel="Tomorrow's Workout"
          dayType={tomorrowIsPush ? 'Push' : 'Pull'}
          displayDate={formatDate(new Date(Date.now() + 86400000))}
          colors={tomorrowColors}
          warmups={tomorrowWarmups}
          upperExercise={tomorrowUpper}
          lowerExercise={tomorrowLower}
          abExercise={tomorrowAbs}
          canSkip={false}
          onSkip={() => {}}
          isPush={tomorrowIsPush}
          showDoneStamp={false}
          style={styles.pageFront}
          animatedStyle={{
            transform: [
              { translateX: tomorrowPageTranslate },
              { scale: tomorrowPageScale },
            ],
          }}
          footerContent={
            <>
              <View style={[styles.completeBtn, styles.completeBtnDisabled, { backgroundColor: tomorrowColors.primary }]}>
                <Text style={styles.completeBtnText}>Come back tomorrow</Text>
              </View>
              <View style={styles.swipeIndicator}>
                <View style={styles.dot} />
                <View style={[styles.dot, { backgroundColor: tomorrowColors.primary, transform: [{ scale: 1.2 }] }]} />
              </View>
            </>
          }
        />
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
});
