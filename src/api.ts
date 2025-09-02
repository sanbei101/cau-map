// 类型定义
export interface Location {
  id: number;
  name: string;
  x: number;
  y: number;
}

interface Edge {
  to: number;
  weight: number;
}

interface Graph {
  [key: number]: Edge[];
}

export interface Route {
  path: number[]; // 地点ID序列
  distance: number; // 总距离
  coordinates: { x: number; y: number }[]; // 坐标序列，用于前端渲染
}

// 模拟数据
const mockLocations: Location[] = [
  { id: 1, name: "水院实验楼", x: 405, y: 125 },
  { id: 2, name: "信电学院", x: 350, y: 165 },
  { id: 3, name: "锅炉房", x: 480, y: 150 },
  { id: 4, name: "图书馆", x: 500, y: 200 },
  { id: 5, name: "第三教学楼", x: 380, y: 295 },
  { id: 6, name: "食品学院", x: 380, y: 330 },
  { id: 7, name: "体育馆", x: 515, y: 400 },
  { id: 8, name: "运动场", x: 605, y: 385 },
  { id: 9, name: "旧图书馆", x: 295, y: 435 },
  { id: 10, name: "计算中心", x: 245, y: 420 },
  { id: 11, name: "第一教学楼", x: 375, y: 480 },
  { id: 12, name: "第二教学楼", x: 280, y: 490 },
  { id: 13, name: "主楼", x: 330, y: 540 },
  { id: 14, name: "二号学生公寓", x: 683, y: 441 },
  { id: 15, name: "三号学生公寓", x: 572, y: 265 },
  { id: 16, name: "民主楼", x: 480, y: 525 },
];

// 计算两点之间的欧几里得距离
function calculateDistance(loc1: Location, loc2: Location): number {
  return Math.sqrt(Math.pow(loc2.x - loc1.x, 2) + Math.pow(loc2.y - loc1.y, 2));
}

// 基于最近邻构建图
function buildGraphByNearestNeighbors(
  locations: Location[],
  neighborsCount: number = 3
): Graph {
  const graph: Graph = {};

  locations.forEach((loc1) => {
    // 计算到其他所有点的距离
    const distances = locations
      .filter((loc2) => loc2.id !== loc1.id)
      .map((loc2) => ({
        id: loc2.id,
        distance: calculateDistance(loc1, loc2),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, neighborsCount); // 取最近的N个

    graph[loc1.id] = distances.map((d) => ({
      to: d.id,
      weight: d.distance,
    }));
  });

  return graph;
}

// Dijkstra 算法实现
function dijkstra(
  graph: Graph,
  start: number,
  end: number,
  locations: Location[]
): Route | null {
  const distances: { [key: number]: number } = {};
  const previous: { [key: number]: number | null } = {};
  const unvisited = new Set<number>();

  // 初始化所有节点
  Object.keys(graph).forEach((nodeId) => {
    const id = parseInt(nodeId);
    distances[id] = id === start ? 0 : Infinity;
    previous[id] = null;
    unvisited.add(id);
  });

  while (unvisited.size > 0) {
    // 找到距离最小的未访问节点
    let current = Array.from(unvisited).reduce((min, node) =>
      distances[node] < distances[min] ? node : min
    );

    // 如果最短距离是无穷大，说明剩余节点不可达
    if (distances[current] === Infinity) break;

    // 如果到达目标节点，提前结束
    if (current === end) break;

    // 标记当前节点为已访问
    unvisited.delete(current);

    // 更新邻居节点距离
    graph[current]?.forEach((edge) => {
      if (unvisited.has(edge.to)) {
        const newDistance = distances[current] + edge.weight;
        if (newDistance < distances[edge.to]) {
          distances[edge.to] = newDistance;
          previous[edge.to] = current;
        }
      }
    });
  }

  // 如果目标节点不可达
  if (distances[end] === Infinity) {
    return null;
  }

  // 重构路径
  const path: number[] = [];
  let current = end;
  while (current !== null) {
    path.unshift(current);
    current = previous[current]!;
  }

  // 获取坐标序列
  const coordinates = path.map((id) => {
    const loc = locations.find((l) => l.id === id);
    if (!loc) throw new Error(`Location with id ${id} not found`);
    return { x: loc.x, y: loc.y };
  });

  return {
    path,
    distance: Math.round(distances[end] * 100) / 100, // 保留两位小数
    coordinates,
  };
}

// 主要的路径查找函数
export async function getRoute(
  fromID: number,
  toID: number
): Promise<Route | null> {
  try {
    // 验证输入参数
    const fromLocation = mockLocations.find((loc) => loc.id === fromID);
    const toLocation = mockLocations.find((loc) => loc.id === toID);

    if (!fromLocation) {
      throw new Error(`起点 ID ${fromID} 不存在`);
    }
    if (!toLocation) {
      throw new Error(`终点 ID ${toID} 不存在`);
    }

    if (fromID === toID) {
      // 起点和终点相同，返回单点路径
      return {
        path: [fromID],
        distance: 0,
        coordinates: [{ x: fromLocation.x, y: fromLocation.y }],
      };
    }

    // 构建图 - 每个节点连接最近的3个节点
    const graph = buildGraphByNearestNeighbors(mockLocations, 3);

    // 执行 Dijkstra 算法
    const result = dijkstra(graph, fromID, toID, mockLocations);

    return result;
  } catch (error) {
    console.error("路径计算错误:", error);
    return null;
  }
}
export function getAllLocations(): Location[] {
  return mockLocations;
}
