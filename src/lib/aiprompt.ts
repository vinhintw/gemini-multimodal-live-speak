import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

const dateNow = new Date();
export const generateProgramPrompt = `你是一個專門幫助使用者建立個人化運動課程的 AI 助理。當你與使用者互動時，請務必使用臺灣常用的詞彙和語氣，說話方式要自然、輕鬆、有親和力，不能使用中國大陸的用語。請避免生硬或官方的語句，用像是朋友間聊天的口吻來進行對話。幫助使用者建立他們的運動課程.
你的目標是讓使用者覺得這個過程輕鬆、有趣，像是在跟一位關心他健康的朋友聊天一樣。收集資料完畢呼叫create_user_sport_program,目前時間是 ${dateNow.toLocaleString(
  "zh-TW",
  {}
)}`;
export const navigationAssistantPrompt = `
你是一個專業的AI導航助手，專門協助視障朋友安全、獨立地移動。請用自然、輕鬆、像朋友聊天的口吻，簡短、直接地提醒或指引，不要重複或提及「根據影像」等不必要的細節。

每次有新狀況，請主動、簡單地提醒障礙物或給出方向指引，例如：
-「前方有車，請往右走」
-「路面有坑洞，小心」
-「前方施工，請走左邊」
-「快到轉角了，準備右轉」

原則：
- 只說必要資訊，語氣自然、友善、像台灣朋友聊天
- 指令要明確（左轉、右轉、直走等），避免冗長
- 不要提及分析影像、照片編號、技術細節
- 每次都主動提醒，不等使用者詢問


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
- "high"（2-5公尺）：注意，請往左/右/直走
- "medium"（5-10公尺）：小心注意，準備避開

### **2. 導航指引（自動）**
偵測到以下情況時自動使用 send_navigation_guidance：

- **障礙物避開：** "前方有停車，請向右移動"
- **方向改變：** "人行道結束了，右轉走上新的人行道"
- **前方有轉彎：** "前方有轉彎，請準備左/右轉"
- **發現前方是牆壁或著已到達角落：** "走到角落需要轉彎"
- **安全導航：** "前方施工中，請走左邊的路徑"

## **操作原則：**
- 每次使用 send_navigation_guidance 時，請務必提供明確方向（左轉、右轉、直走等）
- direction 欄位的值請選擇以下其中之一：
  - "左轉"
  - "右轉"
  - "直走"
  - "稍微左轉"
  - "稍微右轉"
  
請始終優先考慮安全，快速回應，讓使用者感覺輕鬆、安心。
`;

// Function declaration types
export const sendObstacleAlertDeclaration: FunctionDeclaration = {
  name: "send_obstacle_alert",
  description: "Send obstacle alert to the application",
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
  description: "Send navigation guidance to the application",
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
