import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

const dateNow = new Date();
export const generateProgramPrompt = `你是一個專門幫助使用者建立個人化運動課程的 AI 助理。當你與使用者互動時，請務必使用臺灣常用的詞彙和語氣，說話方式要自然、輕鬆、有親和力，不能使用中國大陸的用語。請避免生硬或官方的語句，用像是朋友間聊天的口吻來進行對話。幫助使用者建立他們的運動課程.
你的目標是讓使用者覺得這個過程輕鬆、有趣，像是在跟一位關心他健康的朋友聊天一樣。收集資料完畢呼叫create_user_sport_program,目前時間是 ${dateNow.toLocaleString('zh-TW', {})}`;

export const cameraWalkingPrompt = `你是一位專門協助視障人士安全行走的AI助理，具備多模態能力。

你有以下工具可以使用：
- send_obstacle_alert: 發送障礙物警報
- send_environment_info: 發送環境資訊描述
- read_text_content: 讀取文字內容
- send_navigation_guidance: 發送導航指引

規則：
- 當偵測到任何障礙物或危險時，你必須立即使用 send_obstacle_alert 工具，不要等待使用者詢問
- 當用戶詢問環境時，你必須使用 send_environment_info 工具提供詳細資訊
- 當偵測到文字內容（招牌、標示牌等）時，你必須使用 read_text_content 工具
- 當需要提供方向指引時，你必須使用 send_navigation_guidance 工具
- 你必須主動使用這些工具來協助使用者，這是你的核心責任
- 每次分析新的影像時，都應該評估是否需要呼叫相關工具

你的主要任務包括：
1. 環境分析與描述：識別人物、車輛、建築物、門口、樓梯等，讀取文字內容、招牌、標示牌，描述道路狀況、方向指引，估計距離和相對位置
2. 自動障礙物偵測：持續監控前方障礙物（車輛、行人、物體等）、地面危險（坑洞、階梯、濕滑區域等）、頭部高度障礙物（樹枝、招牌、建築物等）、交通狀況變化
3. 即時安全警報：根據危險程度發送不同級別的警報（critical: 立即危險、high: 高度注意、medium: 中度提醒、low: 輕微提醒）

使用繁體中文進行溝通，語氣要親切、清晰、簡潔。在描述環境時要具體明確，包含方向（前方、左邊、右邊）和大概距離。優先考慮使用者的安全！`;

// Walking assistant function declarations
export const walkingFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: "send_obstacle_alert",
    description: "Send obstacle alert to mobile application",
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
          description: "Distance (meters)"
        },
        direction: {
          type: SchemaType.STRING,
          description: "Relative direction",
        },
        description: {
          type: SchemaType.STRING,
          description: "Detailed obstacle description"
        },
        action: {
          type: SchemaType.STRING, 
          description: "Recommended action to take"
        }
      },
      required: ["type", "severity", "distance", "direction", "description", "action"]
    }
  },
  {
    name: "send_environment_info",
    description: "Send environment information description to mobile application", 
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        environment_type: {
          type: SchemaType.STRING,
          description: "Environment type",
        },
        description: {
          type: SchemaType.STRING,
          description: "Detailed environment description"
        },
        landmarks: {
          type: SchemaType.ARRAY,
          description: "Important landmarks list",
          items: {
            type: SchemaType.OBJECT, 
            properties: {
              name: { type: SchemaType.STRING, description: "Landmark name" },
              direction: { type: SchemaType.STRING, description: "Relative direction" },
              distance: { type: SchemaType.NUMBER, description: "Distance (meters)" }
            }
          }
        },
        navigation_hints: {
          type: SchemaType.ARRAY,
          description: "Navigation hints",
          items: { type: SchemaType.STRING }
        }
      },
      required: ["environment_type", "description"]
    }
  },
  {
    name: "read_text_content", 
    description: "Read and send text content to mobile application",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        text_content: {
          type: SchemaType.STRING,
          description: "Detected text content"
        },
        text_type: {
          type: SchemaType.STRING,
          description: "Text type",
        },
        location: {
          type: SchemaType.STRING, 
          description: "Text location description"
        }
      },
      required: ["text_content", "text_type", "location"]
    }
  },
  {
    name: "send_navigation_guidance",
    description: "Send navigation guidance to mobile application",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        instruction: {
          type: SchemaType.STRING,
          description: "Navigation instruction"
        },
        direction: {
          type: SchemaType.STRING,
          description: "Recommended direction",
        },
        confidence: {
          type: SchemaType.NUMBER,
          description: "Confidence level (0-1)"
        }
      },
      required: ["instruction", "direction", "confidence"]
    }
  }
];

