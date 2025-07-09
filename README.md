# Gemini Multimodal Chat với Next.js

Một ứng dụng chat đa phương tiện hiện đại được xây dựng với Next.js, TailwindCSS và shadcn/ui, tích hợp với Gemini API để hỗ trợ voice chat, webcam, screen sharing và function calls.

## Tính năng

- **Voice Chat**: Giao tiếp bằng giọng nói thời gian thực với Gemini AI
- **Webcam Support**: Chia sẻ video từ webcam để AI có thể "nhìn thấy" bạn
- **Screen Sharing**: Chia sẻ màn hình để AI hỗ trợ các công việc trên máy tính
- **Function Calls**: 
  - Lấy thông tin thời tiết theo thành phố
  - Kiểm tra giá cổ phiếu theo mã cổ phiếu
  - Tìm kiếm Google (tích hợp sẵn)
  - Thực thi code (tích hợp sẵn)
- **Modern UI**: Giao diện đẹp và responsive với shadcn/ui components
- **Real-time Connection**: WebSocket connection với trạng thái hiển thị rõ ràng

## Công nghệ sử dụng

- **Next.js 15** - React framework với App Router
- **TypeScript** - Type safety
- **TailwindCSS** - CSS framework
- **shadcn/ui** - UI components library
- **Gemini API** - Google's multimodal AI
- **Web APIs**: WebRTC, WebSocket, AudioContext

## Yêu cầu hệ thống

- Node.js 18+ hoặc Bun
- Trình duyệt hiện đại hỗ trợ WebRTC và Web Audio API
- API Keys:
  - **Gemini API Key** (bắt buộc) - từ [Google AI Studio](https://makersuite.google.com/app/apikey)
  - **OpenWeather API Key** (tùy chọn) - từ [OpenWeatherMap](https://openweathermap.org/api)
  - **Alpha Vantage API Key** (tùy chọn) - từ [Alpha Vantage](https://www.alphavantage.co/support/#api-key)

## Cài đặt

1. **Clone project**:
```bash
cd /Users/vinhng/Documents/code/gemini-chat-nextjs
```

2. **Cài đặt dependencies**:
```bash
bun install
# hoặc
npm install
```

3. **Cấu hình environment variables**:
```bash
cp .env.example .env.local
```

Sau đó sửa file `.env.local` và thêm các API keys:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key  
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alphavantage_api_key
```

4. **Chạy development server**:
```bash
bun dev
# hoặc  
npm run dev
```

5. **Mở trình duyệt**: Truy cập [http://localhost:3000](http://localhost:3000)

## Cách sử dụng

1. **Kết nối**: Click nút "Connect" để thiết lập WebSocket connection với Gemini API
2. **Bắt đầu recording**: Click "Start Recording" để bắt đầu ghi âm và nói chuyện với AI
3. **Bật webcam/screen**: Sử dụng các nút để chia sẻ webcam hoặc màn hình
4. **Function calls**: Thử các câu lệnh như:
   - "What's the weather in Ho Chi Minh City?"
   - "What's the current price of AAPL stock?"
   - "Search for the latest news about AI"
   - "Calculate the factorial of 10"

## Cấu trúc project

```
src/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── gemini-chat.tsx      # Main chat component
└── lib/
    ├── api-tools.ts         # Weather & stock API functions
    ├── audio-recorder.ts    # Audio recording handler
    ├── audio-streamer.ts    # Audio playback handler
    ├── gemini-live-api.ts   # Gemini WebSocket API wrapper
    ├── media-handler.ts     # Webcam & screen sharing handler
    └── utils.ts             # Utility functions

public/
└── audio-recording-worklet.js  # Audio worklet for processing
```

## Lưu ý

- **HTTPS required**: Các tính năng microphone, webcam và screen sharing yêu cầu HTTPS. Trong development, Next.js tự động hỗ trợ trên localhost.
- **API Limits**: Các API bên thứ 3 có giới hạn calls, hãy kiểm tra các gói miễn phí.
- **Browser Support**: Yêu cầu trình duyệt hiện đại hỗ trợ WebRTC, Web Audio API và ES2020+.

## Troubleshooting

### Connection Issues
- Kiểm tra API key Gemini có đúng không
- Đảm bảo có kết nối internet ổn định
- Kiểm tra console để xem lỗi WebSocket

### Audio Issues  
- Cho phép trình duyệt truy cập microphone
- Kiểm tra thiết bị audio hoạt động bình thường
- Thử refresh page nếu audio bị stuck

### Video Issues
- Cho phép trình duyệt truy cập camera/màn hình
- Kiểm tra camera có đang được sử dụng bởi app khác không

## License

MIT License - xem file LICENSE để biết chi tiết.

## Contributing

Chào mừng các contributions! Hãy tạo issue hoặc pull request.

---

Dự án được phát triển dựa trên [Gemini Multimodal Live Dev Guide](https://github.com/google-gemini/multimodal-live-api-web-console) với giao diện hiện đại và trải nghiệm người dùng được cải thiện.
