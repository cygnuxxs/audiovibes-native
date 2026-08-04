import { useEffect } from "react";
import { Easing, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { useAudioStore } from "./useAudioStore";

// Bridge: expose a Reanimated SharedValue that smoothly follows the zustand progress
export function useProgressSharedValue(): SharedValue<number> {
    const position = useAudioStore((s) => s.position);
    const duration = useAudioStore((s) => s.duration);
    const sv = useSharedValue<number>(0);

    useEffect(() => {
        const ratio = duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0;
        // animate the shared value on the UI thread
        sv.value = withTiming(ratio, { duration: 200, easing: Easing.linear });
    }, [position, duration, sv]);

    return sv;
}

export default useProgressSharedValue;
