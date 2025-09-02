<template>
  <div class="map-container" ref="mapContainer">
    <img
      ref="mapImage"
      src="/map.png"
      alt="CAU East Campus Map"
      class="map-image"
      @load="onImageLoad"
    />
    <svg
      class="map-overlay"
      :viewBox="`0 0 ${actualMapWidth} ${actualMapHeight}`"
      :width="actualMapWidth"
      :height="actualMapHeight"
    >
      <!-- 绘制所有地点 -->
      <g v-for="loc in locations" :key="loc.id">
        <circle
          :cx="loc.x"
          :cy="loc.y"
          r="8"
          :fill="getLocationColor(loc.id)"
          stroke="white"
          stroke-width="2"
        />
        <text
          :x="loc.x + 10"
          :y="loc.y + 5"
          fill="#333"
          font-size="12"
          font-weight="bold"
          text-shadow="1px 1px 2px rgba(255,255,255,0.8)"
        >
          {{ loc.name }}
        </text>
      </g>

      <!-- 绘制路径 -->
      <g v-if="currentRoute && routePoints">
        <!-- 路径线条 -->
        <polyline
          :points="routePoints"
          fill="none"
          stroke="#007bff"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="0"
        />

        <!-- 路径上的点（可选，用于调试） -->
        <g v-if="showRoutePoints">
          <circle
            v-for="(coord, index) in currentRoute.coordinates"
            :key="index"
            :cx="coord.x"
            :cy="coord.y"
            r="4"
            fill="#ff6b6b"
            stroke="white"
            stroke-width="1"
          />
        </g>

        <!-- 起点标记 -->
        <circle
          v-if="currentRoute.coordinates.length > 0"
          :cx="currentRoute.coordinates[0].x"
          :cy="currentRoute.coordinates[0].y"
          r="10"
          fill="#28a745"
          stroke="white"
          stroke-width="2"
        />

        <!-- 终点标记 -->
        <circle
          v-if="currentRoute.coordinates.length > 1"
          :cx="currentRoute.coordinates[currentRoute.coordinates.length - 1].x"
          :cy="currentRoute.coordinates[currentRoute.coordinates.length - 1].y"
          r="10"
          fill="#dc3545"
          stroke="white"
          stroke-width="2"
        />
      </g>
    </svg>

    <!-- 调试信息 -->
    <div v-if="showDebugInfo" class="debug-info">
      <p>图片尺寸: {{ actualMapWidth }} x {{ actualMapHeight }}</p>
      <p>容器尺寸: {{ containerWidth }} x {{ containerHeight }}</p>
      <p>地点总数: {{ locations.length }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import type { Location, Route } from "@/api";

interface Props {
  locations: Location[];
  currentRoute: Route | null;
}

const props = defineProps<Props>();

const mapContainer = ref<HTMLElement | null>(null);
const mapImage = ref<HTMLImageElement | null>(null);
const actualMapWidth = ref(800); // 默认值
const actualMapHeight = ref(600); // 默认值
const containerWidth = ref(0);
const containerHeight = ref(0);
const showRoutePoints = ref(false); // 设为 true 可以显示路径上的调试点
const showDebugInfo = ref(false); // 设为 true 显示调试信息

// 图片加载完成后获取真实尺寸
const onImageLoad = () => {
  if (mapImage.value) {
    // 获取图片的原始尺寸
    actualMapWidth.value = mapImage.value.naturalWidth;
    actualMapHeight.value = mapImage.value.naturalHeight;

    console.log("图片加载完成:", {
      naturalWidth: mapImage.value.naturalWidth,
      naturalHeight: mapImage.value.naturalHeight,
      displayWidth: mapImage.value.width,
      displayHeight: mapImage.value.height,
    });

    updateContainerSize();
  }
};

// 更新容器尺寸
const updateContainerSize = () => {
  if (mapContainer.value) {
    const rect = mapContainer.value.getBoundingClientRect();
    containerWidth.value = rect.width;
    containerHeight.value = rect.height;
  }
};

// 计算路径的 SVG points 字符串
const routePoints = computed(() => {
  if (!props.currentRoute || !props.currentRoute.coordinates) {
    return "";
  }

  return props.currentRoute.coordinates
    .map((coord) => `${coord.x},${coord.y}`)
    .join(" ");
});

// 根据地点是否在路径中决定颜色
const getLocationColor = (locationId: number): string => {
  if (!props.currentRoute) {
    return "rgba(217, 83, 79, 0.8)"; // 默认红色
  }

  if (props.currentRoute.path.includes(locationId)) {
    const index = props.currentRoute.path.indexOf(locationId);
    if (index === 0) {
      return "#28a745"; // 起点绿色
    } else if (index === props.currentRoute.path.length - 1) {
      return "#dc3545"; // 终点红色
    } else {
      return "#ffc107"; // 路径中的点黄色
    }
  }

  return "rgba(150, 150, 150, 0.6)"; // 非路径点灰色
};

onMounted(async () => {
  console.log("MapViewer mounted");

  await nextTick();

  // 如果图片已经加载，直接获取尺寸
  if (mapImage.value && mapImage.value.complete) {
    onImageLoad();
  }

  // 监听窗口大小变化
  window.addEventListener("resize", updateContainerSize);

  // 初始调试：打印所有地点坐标
  console.log(
    "地点坐标:",
    props.locations.map((loc) => ({
      name: loc.name,
      x: loc.x,
      y: loc.y,
    }))
  );
});
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.map-image {
  width: 100%;
  height: auto;
  display: block;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.map-overlay text {
  pointer-events: none;
  user-select: none;
}

.map-overlay circle {
  cursor: pointer;
  pointer-events: all;
}

.map-overlay circle:hover {
  opacity: 0.8;
  transform: scale(1.1);
  transition: all 0.2s ease;
}

.debug-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.debug-info p {
  margin: 2px 0;
}
</style>
