<template>
  <AbstractNetwork :locations="allLocations" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import AbstractNetwork from "@/components/AbstractNetwork.vue";
import { getAllLocations, type Location } from "@/api";

const allLocations = ref<Location[]>([]);
const errorMessage = ref<string>("");
onMounted(() => {
  try {
    allLocations.value = getAllLocations();
    console.log("Loaded locations:", allLocations.value.length);
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    errorMessage.value = "无法加载地点数据，请检查后端服务是否开启。";
  }
});
</script>
