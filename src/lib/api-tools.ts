interface ObstacleAlert {
  type: string; // loại rào cản
  severity: string; // mức độ nghiêm trọng
  distance: number; // khoảng cách (mét)
  direction: string; // hướng tương đối
  description: string; // mô tả
  action: string; // hành động
}

interface Landmark {
  name: string; // tên địa danh
  direction: string; // hướng tương đối
  distance: number; // khoảng cách (mét)
}

interface NavigationGuidance {
  instruction: string; // hướng dẫn
  direction: string; // hướng tương đối
}

// Mock API Functions for Walking Assistant
// gửi cảnh báo chướng ngại vật
export function sendObstacleAlert(params: ObstacleAlert): void {
  console.log("🚨 OBSTACLE ALERT:");
  console.log(`Type: ${params.type}`);
  console.log(`Severity: ${params.severity}`);
  console.log(`Distance: ${params.distance} meters`);
  console.log(`Direction: ${params.direction}`);
  console.log(`Description: ${params.description}`);
  console.log(`Action: ${params.action}`);
  console.log("-------------------");
}

// dẫn đường
export function sendNavigationGuidance(params: NavigationGuidance): void {
  console.log("🧭 NAVIGATION GUIDANCE:");
  console.log(`Instruction: ${params.instruction}`);
  console.log(`Direction: ${params.direction}`);
  console.log("-------------------");
}
