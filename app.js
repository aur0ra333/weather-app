// API 配置（演示模式使用模拟数据）
const API_KEY = ''; // 替换为你的 OpenWeatherMap API 密钥
const USE_DEMO_MODE = true; // 设置为 false 使用真实 API

// 模拟天气数据
const demoWeatherData = {
    '北京': {
        temp: 25,
        feels_like: 27,
        humidity: 65,
        wind_speed: 3.5,
        weather: 'Clear',
        weather_cn: '晴朗',
        icon: '01d',
        sunrise: '05:45',
        sunset: '19:30'
    },
    '上海': {
        temp: 28,
        feels_like: 31,
        humidity: 75,
        wind_speed: 4.2,
        weather: 'Clouds',
        weather_cn: '多云',
        icon: '02d',
        sunrise: '05:30',
        sunset: '18:50'
    },
    '广州': {
        temp: 32,
        feels_like: 36,
        humidity: 80,
        wind_speed: 2.8,
        weather: 'Rain',
        weather_cn: '小雨',
        icon: '10d',
        sunrise: '05:50',
        sunset: '19:10'
    },
    '深圳': {
        temp: 31,
        feels_like: 35,
        humidity: 78,
        wind_speed: 3.1,
        weather: 'Thunderstorm',
        weather_cn: '雷阵雨',
        icon: '11d',
        sunrise: '05:55',
        sunset: '19:15'
    },
    '成都': {
        temp: 26,
        feels_like: 28,
        humidity: 70,
        wind_speed: 2.5,
        weather: 'Mist',
        weather_cn: '雾',
        icon: '50d',
        sunrise: '06:10',
        sunset: '19:40'
    }
};

// 获取天气数据
async function getWeather(city) {
    if (USE_DEMO_MODE) {
        return getDemoWeather(city);
    }
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=zh_cn`
        );
        
        if (!response.ok) {
            throw new Error('城市不存在或 API 密钥无效');
        }
        
        const data = await response.json();
        return parseWeatherData(data);
    } catch (error) {
        throw error;
    }
}

// 获取模拟天气数据
function getDemoWeather(city) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const demoData = demoWeatherData[city] || demoWeatherData['北京'];
            if (demoData) {
                resolve({
                    city: city,
                    ...demoData
                });
            } else {
                reject(new Error('未找到该城市'));
            }
        }, 500);
    });
}

// 解析 API 数据
function parseWeatherData(data) {
    return {
        city: data.name,
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        weather: data.weather[0].main,
        weather_cn: data.weather[0].description,
        icon: data.weather[0].icon,
        sunrise: formatSunrise(data.sys.sunrise),
        sunset: formatSunset(data.sys.sunset)
    };
}

// 格式化日出时间
function formatSunrise(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 格式化日落时间
function formatSunset(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 获取天气预报（模拟）
function getForecast(city) {
    const weathers = ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm'];
    const weatherIcons = ['01d', '02d', '03d', '10d', '11d'];
    const forecast = [];
    
    for (let i = 1; i <= 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const randomIndex = Math.floor(Math.random() * weathers.length);
        forecast.push({
            date: date.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' }),
            temp: Math.round(20 + Math.random() * 15),
            weather: weathers[randomIndex],
            icon: weatherIcons[randomIndex]
        });
    }
    
    return forecast;
}

// 更新 UI
function updateUI(weatherData, forecast) {
    // 当前天气
    document.getElementById('city-name').textContent = weatherData.city;
    document.getElementById('temp').textContent = weatherData.temp;
    document.getElementById('weather-desc').textContent = weatherData.weather_cn;
    document.getElementById('feels-like').textContent = `${weatherData.feels_like}°C`;
    document.getElementById('humidity').textContent = `${weatherData.humidity}%`;
    document.getElementById('wind-speed').textContent = `${weatherData.wind_speed} m/s`;
    document.getElementById('sunrise').textContent = weatherData.sunrise;
    
    // 天气图标
    const iconUrl = `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;
    document.getElementById('weather-icon').src = iconUrl;
    
    // 天气预报
    const forecastGrid = document.getElementById('forecast-grid');
    forecastGrid.innerHTML = forecast.map(day => `
        <div class="forecast-card">
            <div class="forecast-date">${day.date}</div>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.weather}" />
            </div>
            <div class="forecast-temp">${day.temp}°C</div>
            <div class="forecast-desc">${translateWeather(day.weather)}</div>
        </div>
    `).join('');
    
    // 显示内容
    document.getElementById('weather-content').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
}

// 翻译天气描述
function translateWeather(weather) {
    const translations = {
        'Clear': '晴朗',
        'Clouds': '多云',
        'Rain': '雨',
        'Drizzle': '小雨',
        'Thunderstorm': '雷雨',
        'Mist': '雾',
        'Snow': '雪'
    };
    return translations[weather] || weather;
}

// 显示错误
function showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('weather-content').style.display = 'none';
}

// 搜索天气
async function searchWeather(city) {
    if (!city.trim()) {
        showError('请输入城市名称');
        return;
    }
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('weather-content').style.display = 'none';
    
    try {
        const weatherData = await getWeather(city);
        const forecast = getForecast(city);
        updateUI(weatherData, forecast);
    } catch (error) {
        showError(error.message);
    }
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    
    // 搜索按钮点击
    searchBtn.addEventListener('click', () => {
        searchWeather(cityInput.value);
    });
    
    // 回车搜索
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWeather(cityInput.value);
        }
    });
    
    // 快速城市选择
    document.querySelectorAll('.city-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const city = tag.dataset.city;
            cityInput.value = city;
            searchWeather(city);
        });
    });
    
    // 默认搜索北京
    searchWeather('北京');
});
