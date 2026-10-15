import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  onChange: (val: number) => void;
  accentColor?: string;
};

export function SliderBar({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  formatValue,
  onChange,
  accentColor = '#3b6cf6',
}: Props) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const trackWidthRef = useRef(0);

  // Compute percentage (0 to 1)
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const updateFromRatio = (r: number) => {
    const rawVal = min + r * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;
    const finalVal = Math.max(min, Math.min(max, steppedVal));
    onChange(finalVal);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        setIsDragging(true);
        const w = trackWidthRef.current;
        if (w > 0) {
          const locX = Math.max(0, Math.min(w, evt.nativeEvent.locationX));
          startXRef.current = locX;
          updateFromRatio(locX / w);
        }
      },
      onPanResponderMove: (
        _evt: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        const w = trackWidthRef.current;
        if (w > 0) {
          const currentX = Math.max(
            0,
            Math.min(w, startXRef.current + gestureState.dx),
          );
          updateFromRatio(currentX / w);
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    }),
  ).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(width);
    trackWidthRef.current = width;
  };

  const displayVal = formatValue
    ? formatValue(value)
    : `${value}${unit ? ' ' + unit : ''}`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <View style={[styles.badge, { backgroundColor: accentColor }]}>
          <Text style={styles.badgeText}>{displayVal}</Text>
        </View>
      </View>

      <View
        style={styles.touchArea}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.trackBackground,
            { backgroundColor: theme.border || '#e2e2e8' },
          ]}
        >
          <View
            style={[
              styles.trackActive,
              {
                width: `${ratio * 100}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>

        {trackWidth > 0 && (
          <View
            style={[
              styles.thumb,
              {
                left: ratio * trackWidth - THUMB_RADIUS,
                borderColor: accentColor,
                backgroundColor: theme.card,
                transform: [{ scale: isDragging ? 1.25 : 1 }],
              },
            ]}
          >
            <View
              style={[styles.thumbInner, { backgroundColor: accentColor }]}
            />
          </View>
        )}
      </View>

      <View style={styles.minMaxRow}>
        <Text style={[styles.limitText, { color: theme.muted }]}>
          {min}
          {unit}
        </Text>
        <Text style={[styles.limitText, { color: theme.muted }]}>
          {max}
          {unit}
        </Text>
      </View>
    </View>
  );
}

const THUMB_RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 54,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  touchArea: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  trackActive: {
    height: '100%',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: 6,
    width: THUMB_RADIUS * 2,
    height: THUMB_RADIUS * 2,
    borderRadius: THUMB_RADIUS,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  minMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  limitText: {
    fontSize: 12,
  },
});
