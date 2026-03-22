// Weather App - 增强版 JavaScript

// 模拟天气数据
const demoWeatherData = {
    '北京': { temp: 25, feels_like: 27, humidity: 65, wind_speed: 3.5, weather: '晴朗', icon: '01d', sunrise: '05:45' },
    '上海': { temp: 28, feels_like: 31, humidity: 75, wind_speed: 4.2, weather: '多云', icon: '02d', sunrise: '05:30' },
    '广州': { temp: 32, feels_like: 36, humidity: 80, wind_speed: 2.8, weather: '小雨', icon: '10d', sunrise: '05:50' },
    '深圳': { temp: 31, feels_like: 35, humidity: 78, wind_speed: 3.1, weather: '雷阵雨', icon: '11d', sunrise: '05:55' },
    '成都': { temp: 26, feels_like: 28, humidity: 70, wind_speed: 2.5, weather: '雾', icon: '50d', sunrise: '06:10' }
};

let currentCity = '';
let favoriteCities = JSON.parse(localStorage.getItem('favoriteCities')) || ['北京', '上海', '广州'];
let isDarkTheme = true;

// 获取天气数据
async function getWeather(city) {
    showLoading();
    
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const data = demoWeatherData[city] || demoWeatherData['北京'];
            if (data) {
                resolve({ city, ...data });
            } else {
                reject(new Error('未找到该城市'));
            }
        }, 800);
    });
}

// 显示天气数据
function displayWeather(data) {
    document.getElementById('city-name').textContent = data.city;
    document.getElementById('temp').textContent = data.temp;
    document.getElementById('weather-desc').textContent = data.weather;
    document.getElementById('feels-like').textContent = `${data.feels_like}°C`;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('wind-speed').textContent = `${data.wind_speed} m/s`;
    document.getElementById('sunrise').textContent = data.sunrise;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    
    // 显示 5 天预报
    displayForecast(data.city);
    
    // 显示内容
    document.getElementById('weather-content').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
}

// 显示 5 天预报
function displayForecast(city) {
    const forecastGrid = document.getElementById('forecast-grid');
    const weathers = ['晴朗', '多云', '小雨', '雷阵雨', '雾'];
    const icons = ['01d', '02d', '10d', '11d', '50d'];
    
    forecastGrid.innerHTML = Array.from({ length: 5 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        const weatherIndex = (i + Object.keys(demoWeatherData).indexOf(city)) % weathers.length;
        
        return `
            <div class="forecast-card">
                <div class="forecast-date">${date.toLocaleDateString('zh-CN', { weekday: 'short' })}</div>
                <div class="forecast-icon">
                    <img src="https://openweathermap.org/img/wn/${icons[weatherIndex]}.png" alt="Weather" />
                </div>
                <div class="forecast-temp">${Math.round(20 + Math.random() * 15)}°C</div>
                <div class="forecast-desc">${weathers[weatherIndex]}</div>
            </div>
        `;
    }).join('');
}

// 显示加载
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('weather-content').style.display = 'none';
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
    if (!city.trim()) return;
    
    try {
        const data = await getWeather(city);
        currentCity = city;
        displayWeather(data);
    } catch (error) {
        showError(error.message);
    }
}

// 添加收藏城市
function addFavoriteCity(city) {
    if (!favoriteCities.includes(city)) {
        favoriteCities.push(city);
        localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities));
        renderFavoriteCities();
    }
}

// 删除收藏城市
function removeFavoriteCity(city) {
    favoriteCities = favoriteCities.filter(c => c !== city);
    localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities));
    renderFavoriteCities();
}

// 渲染收藏城市
function renderFavoriteCities() {
    const container = document.getElementById('favorite-cities-list');
    container.innerHTML = favoriteCities.map(city => `
        <div class="city-tag" onclick="searchWeather('${city}')">
            ${city}
            <span onclick="event.stopPropagation(); removeFavoriteCity('${city}')" style="margin-left: 5px; cursor: pointer;">×</span>
        </div>
    `).join('');
}

// 自动定位
function autoLocate() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            position => {
                // 模拟根据定位获取城市
                searchWeather('北京');
            },
            error => {
                showError('无法获取位置信息，请手动搜索城市');
            }
        );
    } else {
        showError('浏览器不支持定位功能');
    }
}

// 主题切换
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    const icon = document.getElementById('theme-toggle').querySelector('.icon');
    
    if (isDarkTheme) {
        document.body.style.setProperty('--bg-dark', '#0f172a');
        document.body.style.setProperty('--text-primary', '#f1f5f9');
        icon.textContent = '🌙';
    } else {
        document.body.style.setProperty('--bg-dark', '#f8fafc');
        document.body.style.setProperty('--text-primary', '#1e293b');
        icon.textContent = '☀️';
    }
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    renderFavoriteCities();
    
    // 搜索按钮
    document.getElementById('search-btn').addEventListener('click', () => {
        searchWeather(document.getElementById('city-input').value);
    });
    
    // 回车搜索
    document.getElementById('city-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWeather(document.getElementById('city-input').value);
        }
    });
    
    // 定位按钮
    document.getElementById('location-btn').addEventListener('click', autoLocate);
    
    // 主题切换
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // 添加收藏
    document.getElementById('add-favorite-btn').addEventListener('click', () => {
        if (currentCity) {
            addFavoriteCity(currentCity);
        } else {
            alert('请先搜索一个城市');
        }
    });
    
    // 默认搜索北京
    searchWeather('北京');
});
