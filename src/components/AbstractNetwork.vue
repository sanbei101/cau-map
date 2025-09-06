<template>
  <div class="relative w-screen h-screen bg-gray-900 overflow-hidden">
    <canvas
      ref="canvas"
      class="absolute inset-0 w-full h-full"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    />

    <!-- 调试信息 -->
    <div
      v-if="showDebugInfo"
      class="absolute top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-200 font-mono text-sm z-10 shadow-sm"
    >
      <div class="space-y-1">
        <p>节点数量: {{ particles.length }}</p>
        <p>连接距离: {{ connectionDistance }}</p>
        <p>悬停节点: {{ hoveredParticle?.name || "无" }}</p>
      </div>
    </div>

    <!-- 控制面板 -->
    <div
      class="absolute bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-4 z-10 shadow-sm"
    >
      <div class="flex items-center space-x-4">
        <button
          @click="toggleDebugInfo"
          class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200 text-sm transition-colors border border-gray-600"
        >
          {{ showDebugInfo ? "隐藏调试" : "显示调试" }}
        </button>
        <div class="flex items-center space-x-2">
          <label class="text-gray-300 text-sm">连接距离:</label>
          <input
            v-model="connectionDistance"
            type="range"
            min="50"
            max="300"
            class="w-20"
          />
          <span class="text-gray-200 text-sm">{{ connectionDistance }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { Location } from "@/api";

interface Props {
  locations: Location[];
}

const props = defineProps<Props>();

const canvas = ref<HTMLCanvasElement | null>(null);
const showDebugInfo = ref(false);
const connectionDistance = ref(150);
const mousePos = ref({ x: -1000, y: -1000 });
const hoveredParticle = ref<Particle | null>(null);

// 动画相关
let animationId: number | null = null;

// 粒子系统
interface Particle {
  id: number;
  name: string;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  radius: number;
  connections: number[];
}

const particles = ref<Particle[]>([]);

// 初始化画布
const initCanvas = () => {
  if (!canvas.value) return;

  canvas.value.width = window.innerWidth;
  canvas.value.height = window.innerHeight;

  initParticles();
};

// 初始化粒子系统
const initParticles = () => {
  if (!props.locations || props.locations.length === 0) return;

  // 计算边界
  const margin = 100;
  const minX = Math.min(...props.locations.map((loc) => loc.x)) - margin;
  const maxX = Math.max(...props.locations.map((loc) => loc.x)) + margin;
  const minY = Math.min(...props.locations.map((loc) => loc.y)) - margin;
  const maxY = Math.max(...props.locations.map((loc) => loc.y)) + margin;

  const mapWidth = maxX - minX;
  const mapHeight = maxY - minY;

  particles.value = props.locations.map((loc) => {
    // 将地图坐标转换为屏幕坐标
    const screenX =
      ((loc.x - minX) / mapWidth) * (window.innerWidth - margin * 2) + margin;
    const screenY =
      ((loc.y - minY) / mapHeight) * (window.innerHeight - margin * 2) + margin;

    return {
      id: loc.id,
      name: loc.name,
      x: screenX,
      y: screenY,
      originalX: screenX,
      originalY: screenY,
      radius: 10,
      connections: [],
    };
  });

  updateConnections();
};

// 获取粒子颜色（简化为黑白）

// 更新连接关系
const updateConnections = () => {
  particles.value.forEach((particle, i) => {
    particle.connections = [];
    particles.value.forEach((other, j) => {
      if (i !== j) {
        const dx = particle.originalX - other.originalX;
        const dy = particle.originalY - other.originalY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance.value) {
          particle.connections.push(j);
        }
      }
    });
  });
};

// 动画循环
const animate = () => {
  if (!canvas.value) return;

  const ctx = canvas.value.getContext("2d");
  if (!ctx) return;

  // 清空画布
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // 绘制
  drawConnections(ctx);
  drawParticles(ctx);

  animationId = requestAnimationFrame(animate);
};

// 绘制连接线
const drawConnections = (ctx: CanvasRenderingContext2D) => {
  const isHovered = hoveredParticle.value !== null;

  particles.value.forEach((particle, i) => {
    particle.connections.forEach((j) => {
      if (j > i) {
        const other = particles.value[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance.value) {
          // 检查是否与悬停的节点相关
          const isRelated =
            isHovered &&
            (particle === hoveredParticle.value ||
              other === hoveredParticle.value);

          // 设置样式
          if (isRelated) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            // 悬停时添加动画效果
            const time = Date.now() / 1000;
            const opacity = 0.8 + Math.sin(time * 5) * 0.2;
            ctx.globalAlpha = opacity;
          } else {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.2;
          }

          // 绘制曲线
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          
          // 计算控制点创建曲线效果
          const midX = (particle.x + other.x) / 2;
          const midY = (particle.y + other.y) / 2;
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 垂直偏移量，距离越远偏移越大
          const offset = distance * 0.1;
          const perpX = -dy / distance * offset;
          const perpY = dx / distance * offset;
          
          // 使用二次贝塞尔曲线
          ctx.quadraticCurveTo(midX + perpX, midY + perpY, other.x, other.y);
          ctx.stroke();

          // 重置透明度
          ctx.globalAlpha = 1;

          // 如果是相关连接，添加流动光点
          if (isRelated) {
            const time = Date.now() / 1000;
            const flowOffset = (time * 2) % 1;
            
            // 计算曲线上的点
            const midX = (particle.x + other.x) / 2;
            const midY = (particle.y + other.y) / 2;
            const dx = other.x - particle.x;
            const dy = other.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const offset = distance * 0.1;
            const perpX = -dy / distance * offset;
            const perpY = dx / distance * offset;
            
            // 使用二次贝塞尔曲线公式计算光点位置
            const t = flowOffset;
            const flowX = (1 - t) * (1 - t) * particle.x + 2 * (1 - t) * t * (midX + perpX) + t * t * other.x;
            const flowY = (1 - t) * (1 - t) * particle.y + 2 * (1 - t) * t * (midY + perpY) + t * t * other.y;

            ctx.beginPath();
            ctx.arc(flowX, flowY, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
          }
        }
      }
    });
  });
};

// 绘制粒子
const drawParticles = (ctx: CanvasRenderingContext2D) => {
  particles.value.forEach((particle) => {
    const isHovered = particle === hoveredParticle.value;
    const radius = isHovered ? particle.radius + 2 : particle.radius;

    // 绘制外圈（悬停时）
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 绘制主体
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? "#ffffff" : "#e5e7eb";
    ctx.fill();

    // 显示名称（悬停时）
    if (isHovered) {
      ctx.fillStyle = "#ffffff";
      ctx.font =
        '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(particle.name, particle.x, particle.y - radius - 12);
    }
  });
};

// 鼠标事件处理
const handleMouseMove = (e: MouseEvent) => {
  if (!canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  mousePos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };

  // 检查悬停
  hoveredParticle.value = null;
  particles.value.forEach((particle) => {
    const dx = mousePos.value.x - particle.x;
    const dy = mousePos.value.y - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < particle.radius + 15) {
      hoveredParticle.value = particle;
    }
  });
};

const handleMouseLeave = () => {
  mousePos.value = { x: -1000, y: -1000 };
  hoveredParticle.value = null;
};

// 控制函数
const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value;
};

// 监听窗口大小变化
const handleResize = () => {
  initCanvas();
};

onMounted(() => {
  initCanvas();
  animationId = requestAnimationFrame(animate);
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener("resize", handleResize);
});

// 监听连接距离变化
watch(connectionDistance, () => {
  updateConnections();
});

// 监听locations变化，重新初始化粒子系统
watch(() => props.locations, (newLocations) => {
  if (newLocations && newLocations.length > 0) {
    initParticles();
  }
}, { deep: true });
</script>
