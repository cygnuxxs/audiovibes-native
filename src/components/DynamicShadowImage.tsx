import { memo, useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";

interface DynamicShadowImageProps {
  imageUrl: string;
  width?: number;
  height?: number;
  borderRadius?: number;

  // Glow customization
  blurRadius?: number;
  glowScale?: number;
  glowOpacity?: number;
}

const DynamicShadowImageComponent = ({
  imageUrl,
  width = 180,
  height = 180,
  borderRadius = 24,

  blurRadius = 40,
  glowScale = 1.75,
  glowOpacity = 0.28,
}: DynamicShadowImageProps) => {
  const source = useMemo(() => ({ uri: imageUrl }), [imageUrl]);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
        },
      ]}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      {/* Single Glow Layer */}
      <Image
        source={source}
        fadeDuration={0}
        // Changed from 'cover' to 'stretch' to force the blur into the exact half-width shape
        resizeMode="stretch"
        blurRadius={blurRadius}
        style={[
          styles.glow,
          {
            // Set width strictly to half (50%) of the container's width
            width: width * 0.5,
            // Height remains scaled, or change to height * 0.5 if you want half height too
            height: height * glowScale,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Foreground Image */}
      <Image
        source={{ uri: source.uri }}
        fadeDuration={0}
        resizeMode="cover"
        style={{
          width,
          height,
          borderRadius,
        }}
      />
    </View>
  );
};

export const DynamicShadowImage = memo(
  DynamicShadowImageComponent,
  (prev, next) =>
    prev.imageUrl === next.imageUrl &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.borderRadius === next.borderRadius &&
    prev.blurRadius === next.blurRadius &&
    prev.glowScale === next.glowScale &&
    prev.glowOpacity === next.glowOpacity,
);

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
    flexShrink: 0,
    zIndex: 0,
  },

  glow: {
    position: "absolute",
    borderRadius: 9999,
  },
});
