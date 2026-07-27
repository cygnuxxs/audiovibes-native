import { useCallback, useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import {
  Zap,
  Download,
  FileEdit,
  BarChart3,
  Cpu,
  Trash2,
  Clock,
  HardDrive,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { SettingsSection } from "./SettingsSection";
import { useActiveColors } from "@/hooks/useActiveColors";
import {
  useMetricsStore,
  selectAvgDownloadMs,
  selectAvgMetadataMs,
  selectFastestMetadataMs,
  type DownloadMetric,
} from "@/store/metricsStore";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatSessionTime(ms: number): string {
  const totalSec = Math.floor((Date.now() - ms) / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${secs}s`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
  sublabel,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  sublabel?: string;
}) {
  return (
    <View
      className="flex-1 rounded-xl p-3 gap-1 border border-border/40 bg-card"
      style={{ minWidth: "46%" }}
    >
      <View className="flex-row items-center gap-1.5 mb-1">{icon}</View>
      <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] font-semibold text-muted-foreground">
        {label}
      </Text>
      {sublabel ? (
        <Text className="text-[10px] text-muted-foreground/70">{sublabel}</Text>
      ) : null}
    </View>
  );
}

function HistoryRow({ metric, accent }: { metric: DownloadMetric; accent: string }) {
  const downloadOk = metric.downloadDurationMs > 0;
  const metaOk = metric.metadataDurationMs !== null;

  return (
    <View className="px-4 py-3 border-b border-border/30">
      <Text
        className="text-sm font-semibold text-foreground mb-1.5"
        numberOfLines={1}
      >
        {metric.songTitle}
      </Text>
      <View className="flex-row gap-4">
        {/* Download */}
        <View className="flex-row items-center gap-1">
          <Download size={11} color={downloadOk ? accent : "#888"} />
          <Text className="text-xs text-muted-foreground">
            {downloadOk ? formatMs(metric.downloadDurationMs) : "…"}
          </Text>
        </View>
        {/* Metadata */}
        <View className="flex-row items-center gap-1">
          <FileEdit size={11} color={metaOk ? accent : "#888"} />
          <Text className="text-xs text-muted-foreground">
            {metaOk ? formatMs(metric.metadataDurationMs) : "…"}
          </Text>
        </View>
        {/* File size */}
        {metric.fileSizeBytes !== null && (
          <View className="flex-row items-center gap-1">
            <HardDrive size={11} color="#888" />
            <Text className="text-xs text-muted-foreground">
              {formatBytes(metric.fileSizeBytes)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function PerformanceSection() {
  const activeColors = useActiveColors();
  const accent = activeColors["--primary"];

  const {
    totalDownloads,
    totalMetadataWrites,
    totalBytesDownloaded,
    downloadMetrics,
    sessionStartMs,
    reset,
  } = useMetricsStore();

  const avgDownloadMs = useMemo(
    () => selectAvgDownloadMs(downloadMetrics),
    [downloadMetrics]
  );
  const avgMetadataMs = useMemo(
    () => selectAvgMetadataMs(downloadMetrics),
    [downloadMetrics]
  );
  const fastestMetadataMs = useMemo(
    () => selectFastestMetadataMs(downloadMetrics),
    [downloadMetrics]
  );

  const handleReset = useCallback(() => reset(), [reset]);

  const hasData = totalDownloads > 0 || downloadMetrics.length > 0;

  return (
    <SettingsSection
      title="Performance"
      icon={<Zap size={16} color={accent} />}
    >
      {/* ── Summary stat cards ── */}
      <View className="p-4 gap-3">
        {/* Row 1 */}
        <View className="flex-row gap-3">
          <StatCard
            label="Downloads"
            value={String(totalDownloads)}
            accent={accent}
            sublabel="this session"
            icon={<Download size={14} color={accent} />}
          />
          <StatCard
            label="Metadata writes"
            value={String(totalMetadataWrites)}
            accent={accent}
            sublabel="C++ FFmpeg remux"
            icon={<FileEdit size={14} color={accent} />}
          />
        </View>

        {/* Row 2 */}
        <View className="flex-row gap-3">
          <StatCard
            label="Avg download"
            value={formatMs(avgDownloadMs)}
            accent={accent}
            sublabel="parallel song + art"
            icon={<Clock size={14} color={accent} />}
          />
          <StatCard
            label="Avg metadata write"
            value={formatMs(avgMetadataMs)}
            accent={accent}
            sublabel="no re-encoding"
            icon={<Cpu size={14} color={accent} />}
          />
        </View>

        {/* Row 3 */}
        <View className="flex-row gap-3">
          <StatCard
            label="Fastest write"
            value={formatMs(fastestMetadataMs)}
            accent={accent}
            sublabel="best time this session"
            icon={<Zap size={14} color={accent} />}
          />
          <StatCard
            label="Total downloaded"
            value={formatBytes(totalBytesDownloaded)}
            accent={accent}
            sublabel="raw audio bytes"
            icon={<HardDrive size={14} color={accent} />}
          />
        </View>

        {/* Session timer */}
        <View className="flex-row items-center gap-2 mt-1">
          <BarChart3 size={13} color={activeColors["--muted-foreground"]} />
          <Text className="text-xs text-muted-foreground">
            Session time: {formatSessionTime(sessionStartMs)}
          </Text>
          {hasData && (
            <Pressable
              onPress={handleReset}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Reset performance metrics"
              className="ml-auto flex-row items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 active:opacity-60"
            >
              <Trash2 size={11} color={activeColors["--muted-foreground"]} />
              <Text className="text-[11px] text-muted-foreground">Reset</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Context note ── */}
      <View className="mx-4 mb-4 bg-muted/30 rounded-xl p-3 border border-border/30">
        <Text className="text-[11px] text-muted-foreground leading-relaxed">
          <Text className="font-semibold text-foreground">@cygnuxxs/writer </Text>
          is a custom C++ Nitro Module that injects metadata and artwork into
          M4A files via a pure FFmpeg remux — no re-encoding, no JS-thread
          blocking, and ~80–90% smaller than a full FFmpeg wrapper.
        </Text>
      </View>

      {/* ── History list ── */}
      {downloadMetrics.length > 0 && (
        <View className="border-t border-border/40">
          <View className="px-4 pt-3 pb-1 flex-row items-center gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Recent downloads
            </Text>
          </View>
          <ScrollView
            style={{ maxHeight: 280 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {downloadMetrics.map((m) => (
              <HistoryRow key={m.id} metric={m} accent={accent} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Empty state ── */}
      {!hasData && (
        <View className="px-4 pb-5 pt-1 items-center gap-1">
          <Download size={28} color={activeColors["--muted-foreground"]} strokeWidth={1.2} />
          <Text className="text-sm text-muted-foreground mt-2 text-center">
            No downloads yet this session.{"\n"}Download a song to see live metrics here.
          </Text>
        </View>
      )}
    </SettingsSection>
  );
}
