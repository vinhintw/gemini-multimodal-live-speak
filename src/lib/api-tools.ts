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

interface EnvironmentInfo {
  environment_type: string; // loại môi trường
  description: string; // mô tả
  landmarks?: Landmark[]; // danh sách các địa danh quan trọng
}

interface TextContent {
  text_content: string; // nội dung văn bản
  text_type: string; // loại văn bản (ví dụ: biển báo, chỉ dẫn)
  location: string; // vị trí của văn bản
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

// gửi nội dung văn bản
export function sendTextContent(params: TextContent): void {
  console.log("📖 TEXT CONTENT:");
  console.log(`Text Type: ${params.text_type}`);
  console.log(`Location: ${params.location}`);
  console.log(`Content: "${params.text_content}"`);
  console.log("-------------------");
}

// mô tả môi trường
export function sendEnvironmentInfo(params: EnvironmentInfo): void {
  console.log("🌍 ENVIRONMENT INFO:");
  console.log(`Environment Type: ${params.environment_type}`);
  console.log(`Description: ${params.description}`);

  if (params.landmarks && params.landmarks.length > 0) {
    console.log("Landmarks:");
    params.landmarks.forEach((landmark, index) => {
      console.log(
        `  ${index + 1}. ${landmark.name} - ${landmark.direction} (${
          landmark.distance
        }m)`
      );
    });
  }
  console.log("-------------------");
}

// dẫn đường
export function sendNavigationGuidance(params: NavigationGuidance): void {
  console.log("🧭 NAVIGATION GUIDANCE:");
  console.log(`Instruction: ${params.instruction}`);
  console.log(`Direction: ${params.direction}`);
  console.log("-------------------");
}
