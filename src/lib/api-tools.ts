interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
  error?: string;
}

interface StockData {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: string;
  lowPrice: number;
  highPrice: number;
  openPrice: number;
  previousClose: number;
  error?: string;
}

// Note: Replace with your actual API keys
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'your_api_key_here';
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'your_api_key_here';

export async function getWeather(city: string): Promise<WeatherData> {
  try {
    // First get coordinates for the city
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
    console.log('Fetching geo data from:', geoUrl);
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) {
      throw new Error(`Geo API failed with status: ${geoResponse.status}`);
    }
    const geoData = await geoResponse.json();

    if (!geoData.length) {
      return {
        error: `Could not find location: ${city}`,
        temperature: 0,
        description: '',
        humidity: 0,
        windSpeed: 0,
        city: '',
        country: ''
      };
    }

    const { lat, lon } = geoData[0];

    // Then get weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    console.log('Fetching weather data from:', weatherUrl);
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather API failed with status: ${weatherResponse.status}`);
    }
    const weatherData = await weatherResponse.json();

    return {
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      city: weatherData.name,
      country: weatherData.sys.country
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return {
      error: `Weather service unavailable: ${(error as Error).message}`,
      temperature: 0,
      description: '',
      humidity: 0,
      windSpeed: 0,
      city: '',
      country: ''
    };
  }
}

export async function getStockPrice(symbol: string): Promise<StockData> {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log('Fetching stock data from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Stock API failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message']) {
      return {
        error: `Invalid stock symbol: ${symbol}`,
        symbol: '',
        currentPrice: 0,
        change: 0,
        percentChange: '',
        lowPrice: 0,
        highPrice: 0,
        openPrice: 0,
        previousClose: 0
      };
    }
    
    if (data['Note']) {
      return {
        error: 'API call frequency limit reached. Please try again later.',
        symbol: '',
        currentPrice: 0,
        change: 0,
        percentChange: '',
        lowPrice: 0,
        highPrice: 0,
        openPrice: 0,
        previousClose: 0
      };
    }
    
    const quote = data['Global Quote'];
    if (!quote) {
      return {
        error: `No data found for symbol: ${symbol}`,
        symbol: '',
        currentPrice: 0,
        change: 0,
        percentChange: '',
        lowPrice: 0,
        highPrice: 0,
        openPrice: 0,
        previousClose: 0
      };
    }
    
    return {
      symbol: quote['01. symbol'],
      currentPrice: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      percentChange: quote['10. change percent'],
      lowPrice: parseFloat(quote['04. low']),
      highPrice: parseFloat(quote['03. high']),
      openPrice: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close'])
    };
  } catch (error) {
    console.error('Stock API error:', error);
    return {
      error: `Stock service unavailable: ${(error as Error).message}`,
      symbol: '',
      currentPrice: 0,
      change: 0,
      percentChange: '',
      lowPrice: 0,
      highPrice: 0,
      openPrice: 0,
      previousClose: 0
    };
  }
}

// Walking Assistant API Types (based on aiprompt.ts function declarations)
interface ObstacleAlert {
  type: string;
  severity: string;
  distance: number;
  direction: string;
  description: string;
  action: string;
}

interface Landmark {
  name: string;
  direction: string;
  distance: number;
}

interface EnvironmentInfo {
  environment_type: string;
  description: string;
  landmarks?: Landmark[];
  navigation_hints?: string[];
}

interface TextContent {
  text_content: string;
  text_type: string;
  location: string;
}

interface NavigationGuidance {
  instruction: string;
  direction: string;
  confidence: number;
}

// Mock API Functions for Walking Assistant
export function sendObstacleAlert(params: ObstacleAlert): void {
  console.log('🚨 OBSTACLE ALERT:');
  console.log(`Type: ${params.type}`);
  console.log(`Severity: ${params.severity}`);
  console.log(`Distance: ${params.distance} meters`);
  console.log(`Direction: ${params.direction}`);
  console.log(`Description: ${params.description}`);
  console.log(`Action: ${params.action}`);
  console.log('-------------------');
}

export function sendEnvironmentInfo(params: EnvironmentInfo): void {
  console.log('🌍 ENVIRONMENT INFO:');
  console.log(`Environment Type: ${params.environment_type}`);
  console.log(`Description: ${params.description}`);
  
  if (params.landmarks && params.landmarks.length > 0) {
    console.log('Landmarks:');
    params.landmarks.forEach((landmark, index) => {
      console.log(`  ${index + 1}. ${landmark.name} - ${landmark.direction} (${landmark.distance}m)`);
    });
  }
  
  if (params.navigation_hints && params.navigation_hints.length > 0) {
    console.log('Navigation Hints:');
    params.navigation_hints.forEach((hint, index) => {
      console.log(`  ${index + 1}. ${hint}`);
    });
  }
  console.log('-------------------');
}

export function readTextContent(params: TextContent): void {
  console.log('📖 TEXT CONTENT:');
  console.log(`Text Type: ${params.text_type}`);
  console.log(`Location: ${params.location}`);
  console.log(`Content: "${params.text_content}"`);
  console.log('-------------------');
}

export function sendNavigationGuidance(params: NavigationGuidance): void {
  console.log('🧭 NAVIGATION GUIDANCE:');
  console.log(`Instruction: ${params.instruction}`);
  console.log(`Direction: ${params.direction}`);
  console.log(`Confidence: ${(params.confidence * 100).toFixed(1)}%`);
  console.log('-------------------');
}

// Example usage function to demonstrate all walking assistant APIs
export function demoWalkingAssistantAPIs(): void {
  console.log('=== WALKING ASSISTANT API DEMO ===\n');
  
  // Demo obstacle alert
  sendObstacleAlert({
    type: "車輛",
    severity: "high",
    distance: 3,
    direction: "前方",
    description: "一輛白色汽車正在接近",
    action: "請停下來等待車輛通過"
  });

  // Demo environment info
  sendEnvironmentInfo({
    environment_type: "市區街道",
    description: "您目前在一條繁忙的市區街道上，兩旁有商店和餐廳",
    landmarks: [
      { name: "7-Eleven便利商店", direction: "右前方", distance: 10 },
      { name: "公車站", direction: "左前方", distance: 15 }
    ],
    navigation_hints: [
      "沿著人行道直行",
      "注意前方有階梯",
      "保持靠右行走"
    ]
  });

  // Demo text content
  readTextContent({
    text_content: "台北車站 Taipei Main Station",
    text_type: "車站標示",
    location: "正前方大型招牌"
  });

  // Demo navigation guidance
  sendNavigationGuidance({
    instruction: "繼續直行約20公尺後左轉",
    direction: "直行然後左轉",
    confidence: 0.95
  });
}
