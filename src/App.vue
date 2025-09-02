<template>
  <div id="app-container">
    <header>
      <h1>中国农业大学东校区导览系统 (Demo)</h1>
    </header>
    <main>
      <div class="controls">
        <div class="select-group">
          <label for="from">起点:</label>
          <select id="from" v-model="fromId">
            <option disabled value="">请选择起点</option>
            <option v-for="loc in allLocations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
        <div class="select-group">
          <label for="to">终点:</label>
          <select id="to" v-model="toId">
            <option disabled value="">请选择终点</option>
            <option v-for="loc in allLocations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
        <button @click="findPath" :disabled="!fromId || !toId">查找路线</button>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <MapViewer :locations="allLocations" :current-route="route" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import MapViewer from "@/components/MapViewer.vue";
import { getAllLocations, getRoute, type Location, type Route } from "@/api";

const allLocations = ref<Location[]>([]);
const fromId = ref<number | string>("");
const toId = ref<number | string>("");
const route = ref<Route | null>(null);
const errorMessage = ref<string>("");
const isLoading = ref<boolean>(false);
onMounted(async () => {
  try {
    allLocations.value = await getAllLocations();
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    errorMessage.value = "无法加载地点数据，请检查后端服务是否开启。";
  }
});

const findPath = async () => {
  if (typeof fromId.value !== "number" || typeof toId.value !== "number") {
    return;
  }

  if (fromId.value === toId.value) {
    errorMessage.value = "起点和终点不能相同。";
    route.value = null;
    return;
  }

  errorMessage.value = "";
  isLoading.value = true;

  try {
    const result = await getRoute(fromId.value, toId.value);
    if (result) {
      route.value = result;
      console.log("找到路径:", result);
    } else {
      errorMessage.value = "未找到可行路线。";
      route.value = null;
    }
  } catch (error) {
    console.error("Failed to fetch route:", error);
    route.value = null;
    errorMessage.value = "路径计算失败，请重试。";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style>
body {
  font-family: "Helvetica Neue", Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f4f4f4;
}

#app-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

header {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.controls {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.select-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

button {
  padding: 8px 16px;
  border: none;
  background-color: #5cb85c;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #4cae4c;
}

.error-message {
  color: #d9534f;
  text-align: center;
  margin-bottom: 15px;
}
</style>
