# 天气查询应用 (Weather App)

一个美观实用的天气查询应用，支持实时天气和未来 5 天预报，展示 API 集成和异步编程能力。

## ✨ 功能特性

- 🌍 **城市搜索** - 支持全球城市天气查询
- 📊 **实时天气** - 温度、湿度、风速、体感温度等详细数据
- 📅 **5 天预报** - 未来 5 天天气趋势预测
- 🎨 **动态图标** - 根据天气状况显示对应图标
- 🏷️ **快速选择** - 热门城市一键查询
- 📱 **响应式设计** - 完美适配各种设备
- 🔄 **加载动画** - 优雅的加载状态提示
- ⚠️ **错误处理** - 友好的错误提示

## 🚀 技术栈

- **HTML5** - 语义化结构
- **CSS3** - Grid 布局、动画、渐变
- **JavaScript (ES6+)** - Async/Await、Promise、Fetch API
- **OpenWeatherMap API** - 真实天气数据（演示模式使用模拟数据）
- **响应式设计** - 移动优先

## 📦 安装和使用

1. 克隆项目
```bash
git clone <your-repo-url>
cd weather-app
```

2. 配置 API 密钥（可选）
```javascript
// 在 app.js 中设置你的 API 密钥
const API_KEY = 'your-api-key-here';
const USE_DEMO_MODE = false; // 设置为 false 使用真实 API
```

3. 直接在浏览器打开
```bash
open index.html
```

## 🎯 核心技术展示

### Fetch API 和 Async/Await
```javascript
async function getWeather(city) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    return parseWeatherData(data);
}
```

### 错误处理
```javascript
try {
    const weatherData = await getWeather(city);
    updateUI(weatherData);
} catch (error) {
    showError(error.message);
}
```

### 数据解析和转换
```javascript
function parseWeatherData(data) {
    return {
        city: data.name,
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        // ... 更多字段
    };
}
```

## 🌟 API 集成说明

### OpenWeatherMap API
1. 访问 [OpenWeatherMap](https://openweathermap.org/api) 注册账号
2. 获取免费 API 密钥（每月 60 次调用）
3. 在 `app.js` 中配置密钥

### API 端点
- 当前天气：`/data/2.5/weather`
- 参数：城市名、API 密钥、单位、语言

## 📱 项目亮点

1. **演示模式** - 无需 API 密钥即可体验完整功能
2. **优雅降级** - API 不可用时自动切换到模拟数据
3. **用户体验** - 加载动画、错误提示、快速选择
4. **代码质量** - 模块化、可维护、注释清晰

## 🔧 功能扩展建议

- [ ] 添加自动定位功能（Geolocation API）
- [ ] 添加多城市对比功能
- [ ] 添加天气预警通知
- [ ] 添加历史天气数据图表
- [ ] 添加空气质量指数（AQI）
- [ ] 添加深色模式
- [ ] 添加多语言支持

## 📄 License

MIT

## 👤 作者

你的姓名 - [GitHub 链接]

---

**适合简历的技能点：**
- ✅ RESTful API 集成
- ✅ Fetch API 和 Axios
- ✅ Async/Await 异步编程
- ✅ Promise 错误处理
- ✅ JSON 数据解析
- ✅ 响应式 Web 设计
- ✅ CSS Grid 和 Flexbox
- ✅ 用户体验优化
