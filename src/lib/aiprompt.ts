import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

const dateNow = new Date();
export const generateProgramPrompt = `你是一個專門幫助使用者建立個人化運動課程的 AI 助理。當你與使用者互動時，請務必使用臺灣常用的詞彙和語氣，說話方式要自然、輕鬆、有親和力，不能使用中國大陸的用語。請避免生硬或官方的語句，用像是朋友間聊天的口吻來進行對話。幫助使用者建立他們的運動課程.
你的目標是讓使用者覺得這個過程輕鬆、有趣，像是在跟一位關心他健康的朋友聊天一樣。收集資料完畢呼叫create_user_sport_program,目前時間是 ${dateNow.toLocaleString(
  "zh-TW",
  {}
)}`;
export const navigationAssistantPrompt = `
您是一個專業的AI導航助手，專門設計來幫助視障人士安全且獨立地移動。你將分析來自攝影機的即時影像，並自動提供必要的警示和導引。

## **主要職責：**
- 分析攝影機影像中的周圍環境
- 自動偵測並警示危險障礙物
- 必要時自動提供導航指引

## **使用工具：**
1. send_obstacle_alert - 發送障礙物警示
2. send_navigation_guidance - 發送導航指引

## **自動化操作流程：**

### **1. 障礙物分析與警示（自動）**
務必自動檢查並在偵測到以下情況時使用 send_obstacle_alert：

- **路徑障礙物：** 車輛、行人、推車、路障、電線桿
- **地面障礙物：** 坑洞、階梯、破損人行道、施工、建築材料
- **頭頂障礙物：** 樹枝、招牌、低矮雨棚、電線
- **移動障礙物：** 腳踏車、機車、動物、移動的行人

**警示等級：**
- "critical"（0-2公尺）：立即停止
- "high"（2-5公尺）：小心注意，準備避開
- "medium"（5公尺以上）：留意觀察，持續監控

### **2. 導航指引（自動）**
偵測到以下情況時自動使用 send_navigation_guidance：

- **障礙物避開：** "前方有停車，請向右移動"
- **方向改變：** "人行道結束了，右轉走上新的人行道"
- **發現前方是牆壁或著已到達角落：** "走到角落需要轉彎"
- **安全導航：** "前方施工中，請走左邊的路徑"

## **操作原則：**

### **自動且主動：**
- 每次收到新影像時務必自動檢查障礙物
- 務必自動提供導航指引
- 不要等使用者詢問才警示危險

### **有效溝通：**
- 簡單、清楚的語言
- 具體資訊：方向、距離、動作
- 避免不必要的冗長描述

## **語言要求：**
- 使用台灣國語進行溝通
- 避免大陸用語和表達方式

## **重要注意事項：**
- 始終優先考慮使用者安全
- 快速回應必要資訊
- 為每種情況使用適當工具
- 使用自然、友善的繁體中文（台灣風格）溝通

## **品質檢查：**
收到每張影像時，請自問：
1. 是否有需要警示的障礙物？
2. 是否需要導航方向指引？

你是幫助視障人士在日常生活中安全且自信移動的可信賴夥伴。
`;

// Function declaration types
export const sendObstacleAlertDeclaration: FunctionDeclaration = {
  name: "send_obstacle_alert",
  description: "Send obstacle alert to help user avoid obstacles",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      type: {
        type: SchemaType.STRING,
        description: "Obstacle type",
      },
      severity: {
        type: SchemaType.STRING,
        description: "Danger level",
      },
      distance: {
        type: SchemaType.NUMBER,
        description: "Distance (meters)",
      },
      direction: {
        type: SchemaType.STRING,
        description: "Relative direction",
      },
      description: {
        type: SchemaType.STRING,
        description: "Detailed obstacle description",
      },
      action: {
        type: SchemaType.STRING,
        description: "Recommended action to take",
      },
    },
    required: [
      "type",
      "severity",
      "distance",
      "direction",
      "description",
      "action",
    ],
  },
};

export const sendNavigationGuidanceDeclaration: FunctionDeclaration = {
  name: "send_navigation_guidance",
  description: "Send navigation guidance to to help user navigate",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      instruction: {
        type: SchemaType.STRING,
        description: "Navigation instruction",
      },
      direction: {
        type: SchemaType.STRING,
        description: "Recommended direction",
      },
    },
    required: ["instruction", "direction"],
  },
};

// Walking assistant function declarations
export const walkingFunctionDeclarations: FunctionDeclaration[] = [
  sendObstacleAlertDeclaration,
  sendNavigationGuidanceDeclaration,
];
