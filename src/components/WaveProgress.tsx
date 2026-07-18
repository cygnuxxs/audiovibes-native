import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const WAVELENGTH = 34; // px — vertical distance per wave cycle along the edge
const MAX_AMPLITUDE = 4; // px — how far the boundary bulges left/right
const SEGMENTS = 10; // vertical smoothness of the wave edge

const PHASE_CYCLE_DURATION = 2000; // ms per 2π cycle
const CONTINUOUS_CYCLES = 10000; // enough cycles so it never visibly ends
const CONTINUOUS_DELTA = Math.PI * 2 * CONTINUOUS_CYCLES;
const CONTINUOUS_DURATION = PHASE_CYCLE_DURATION * CONTINUOUS_CYCLES;

// Builds a fill shape from x=0 up to a wavy vertical boundary near `boundaryX`,
// spanning the FULL height — so the fill never has a gap at top or bottom.
function buildWavePath(
  height: number,
  boundaryX: number,
  phase: number,
  amplitude: number,
) {
  "worklet";
  // Guard against 0 height which causes infinite loops or NaN errors
  if (height <= 0) return "";

  const twoPi = Math.PI * 2;

  const xAt = (y: number) =>
    boundaryX + amplitude * Math.sin((y / WAVELENGTH) * twoPi + phase);

  let d = `M${xAt(0).toFixed(2)} 0`;

  for (let i = 1; i <= SEGMENTS; i++) {
    const y = (height / SEGMENTS) * i;
    d += ` L${xAt(y).toFixed(2)} ${y.toFixed(2)}`;
  }

  d += ` L0 ${height} L0 0 Z`;
  return d;
}

const WaveProgress = ({
  progressValue,
  isPlaying,
  width,
  height,
  color,
}: {
  progressValue: SharedValue<number>;
  isPlaying: boolean;
  width: number;
  height: number;
  color: string;
}) => {
  const phase = useSharedValue(0);

  // Continuously advance the wave phase while playing.
  // Instead of withRepeat (which restarts every cycle), we use a single
  // very-long withTiming so the phase increments smoothly without resets.
  useEffect(() => {
    if (isPlaying) {
      // Start from current phase and go forward continuously
      const startPhase = phase.value % (Math.PI * 2);
      phase.value = startPhase;
      phase.value = withTiming(startPhase + CONTINUOUS_DELTA, {
        duration: CONTINUOUS_DURATION,
        easing: Easing.linear,
      });
    } else {
      cancelAnimation(phase);
    }
  }, [isPlaying, phase]);

  // Amplitude fades to 0 at progress 0 AND progress 1 (sin(π·p) peaks at p=0.5).
  // This guarantees a flat, fully-solid fill exactly at 100% — no wavy gap left behind.
  const backProps = useAnimatedProps(() => {
    const amp =
      MAX_AMPLITUDE *
      1.3 *
      Math.max(0, Math.sin(Math.PI * progressValue.value));
    const boundaryX = progressValue.value * width;
    return { d: buildWavePath(height, boundaryX, phase.value * 0.7, amp) };
  }, [width, height]);

  const frontProps = useAnimatedProps(() => {
    const amp =
      MAX_AMPLITUDE * Math.max(0, Math.sin(Math.PI * progressValue.value));
    const boundaryX = progressValue.value * width;
    return { d: buildWavePath(height, boundaryX, phase.value, amp) };
  }, [width, height]);

  if (!width || !height) return null;

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <AnimatedPath animatedProps={backProps} fill={`${color}22`} />
      <AnimatedPath animatedProps={frontProps} fill={`${color}3D`} />
    </Svg>
  );
};

export default WaveProgress;
