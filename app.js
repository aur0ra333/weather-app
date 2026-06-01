const WEATHER_DATA = {
    北京: { temp: 25, feels: 27, humidity: 42, wind: 3.4, aqi: 58, uv: 6, pressure: 1011, weather: '晴', symbol: '☀️', summary: '白天日照充足，适合通勤和短途外出。' },
    上海: { temp: 28, feels: 31, humidity: 71, wind: 4.1, aqi: 46, uv: 5, pressure: 1008, weather: '多云', symbol: '⛅', summary: '湿度偏高，午后体感会比实际温度更热。' },
    广州: { temp: 31, feels: 36, humidity: 79, wind: 2.7, aqi: 62, uv: 8, pressure: 1005, weather: '阵雨', symbol: '🌦️', summary: '午后有短时阵雨，出门建议带伞。' },
    深圳: { temp: 30, feels: 34, humidity: 76, wind: 3.2, aqi: 39, uv: 7, pressure: 1006, weather: '雷阵雨', symbol: '⛈️', summary: '沿海风力适中，傍晚可能出现雷雨。' },
    成都: { temp: 24, feels: 26, humidity: 68, wind: 2.1, aqi: 74, uv: 4, pressure: 1009, weather: '阴', symbol: '☁️', summary: '云量较多，早晚温差不大。' },
    杭州: { temp: 27, feels: 30, humidity: 66, wind: 3.0, aqi: 50, uv: 6, pressure: 1007, weather: '小雨', symbol: '🌧️', summary: '间歇性小雨，湿度较高。' },
    郑州: { temp: 29, feels: 31, humidity: 48, wind: 3.8, aqi: 69, uv: 7, pressure: 1004, weather: '晴间多云', symbol: '🌤️', summary: '体感偏热，午后注意补水。' },
    武汉: { temp: 30, feels: 35, humidity: 73, wind: 2.9, aqi: 55, uv: 7, pressure: 1003, weather: '多云', symbol: '⛅', summary: '闷热感明显，室外活动建议避开正午。' }
};

const STORAGE_KEYS = {
    favorites: 'weatherDeskFavorites',
    recent: 'weatherDeskRecent'
};

let currentCity = '北京';
let unit = 'c';
let favorites = readStorage(STORAGE_KEYS.favorites, ['北京', '上海', '郑州']);
let recentCities = readStorage(STORAGE_KEYS.recent, []);

const $ = (selector) => document.querySelector(selector);

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCity(input) {
    return input.trim().replace(/市$/, '');
}

function convertTemp(value) {
    if (unit === 'f') return Math.round((value * 9) / 5 + 32);
    return Math.round(value);
}

function tempText(value) {
    return `${convertTemp(value)}°${unit.toUpperCase()}`;
}

function getComfortScore(data) {
    const tempScore = Math.max(0, 100 - Math.abs(data.feels - 24) * 6);
    const humidityScore = Math.max(0, 100 - Math.abs(data.humidity - 55) * 1.4);
    const airScore = Math.max(0, 100 - data.aqi * 0.8);
    return Math.round(tempScore * 0.42 + humidityScore * 0.33 + airScore * 0.25);
}

function comfortLabel(score) {
    if (score >= 82) return '舒适';
    if (score >= 66) return '良好';
    if (score >= 50) return '一般';
    return '偏不适';
}

function aqiText(aqi) {
    if (aqi <= 50) return `${aqi} 优`;
    if (aqi <= 100) return `${aqi} 良`;
    return `${aqi} 注意`;
}

function forecastFor(city) {
    const base = WEATHER_DATA[city];
    const citySeed = city.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const symbols = ['☀️', '🌤️', '⛅', '🌦️', '🌧️'];
    const states = ['晴', '晴间多云', '多云', '阵雨', '小雨'];

    return Array.from({ length: 5 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index + 1);
        const shift = ((citySeed + index * 7) % 7) - 3;
        const symbolIndex = (citySeed + index) % symbols.length;

        return {
            day: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
            date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
            high: base.temp + Math.max(1, shift + 3),
            low: base.temp + Math.min(-2, shift - 2),
            symbol: symbols[symbolIndex],
            weather: states[symbolIndex]
        };
    });
}

function renderWeather(city) {
    const data = WEATHER_DATA[city];
    currentCity = city;

    $('#city-name').textContent = city;
    $('#weather-symbol').textContent = data.symbol;
    $('#weather-desc').textContent = data.weather;
    $('#temp').textContent = convertTemp(data.temp);
    $('#degree-label').textContent = `°${unit.toUpperCase()}`;
    $('#summary-text').textContent = data.summary;
    $('#feels-like').textContent = tempText(data.feels);
    $('#humidity').textContent = `${data.humidity}%`;
    $('#wind-speed').textContent = `${data.wind} m/s`;
    $('#aqi').textContent = aqiText(data.aqi);
    $('#uv-index').textContent = data.uv;
    $('#pressure').textContent = `${data.pressure} hPa`;

    const comfortScore = getComfortScore(data);
    $('#comfort-label').textContent = `${comfortScore} · ${comfortLabel(comfortScore)}`;
    $('#comfort-bar').style.width = `${comfortScore}%`;

    renderForecast(city);
    renderCompare();
    renderQuickLists();
}

function renderForecast(city) {
    $('#forecast-grid').innerHTML = forecastFor(city)
        .map((day) => `
            <article class="forecast-card">
                <span>${day.day}</span>
                <strong>${day.symbol}</strong>
                <p>${day.weather}</p>
                <b>${tempText(day.high)} / ${tempText(day.low)}</b>
                <small>${day.date}</small>
            </article>
        `)
        .join('');
}

function renderCompare() {
    const cities = Array.from(new Set([currentCity, ...favorites, '杭州', '深圳'])).slice(0, 5);
    $('#compare-list').innerHTML = cities
        .map((city) => {
            const data = WEATHER_DATA[city];
            return `
                <button class="compare-card ${city === currentCity ? 'active' : ''}" type="button" data-city="${city}">
                    <span>${city}</span>
                    <strong>${tempText(data.temp)}</strong>
                    <small>${data.weather} · 湿度 ${data.humidity}% · AQI ${data.aqi}</small>
                </button>
            `;
        })
        .join('');

    document.querySelectorAll('.compare-card').forEach((card) => {
        card.addEventListener('click', () => searchWeather(card.dataset.city));
    });
}

function renderQuickLists() {
    $('#favorite-list').innerHTML = favorites.length
        ? favorites.map(cityTag).join('')
        : '<span class="empty-chip">暂无收藏</span>';

    $('#recent-list').innerHTML = recentCities.length
        ? recentCities.map(cityTag).join('')
        : '<span class="empty-chip">暂无查询</span>';

    document.querySelectorAll('[data-city-tag]').forEach((tag) => {
        tag.addEventListener('click', () => searchWeather(tag.dataset.cityTag));
    });
}

function cityTag(city) {
    return `<button class="city-tag" type="button" data-city-tag="${city}">${city}</button>`;
}

function updateRecent(city) {
    recentCities = [city, ...recentCities.filter((item) => item !== city)].slice(0, 6);
    writeStorage(STORAGE_KEYS.recent, recentCities);
}

function showError(message) {
    const element = $('#error-message');
    element.textContent = message;
    element.hidden = false;
}

function hideError() {
    $('#error-message').hidden = true;
}

function searchWeather(input) {
    const city = normalizeCity(input);
    if (!city) return;

    if (!WEATHER_DATA[city]) {
        showError(`暂未收录“${city}”的演示数据，可试试：${Object.keys(WEATHER_DATA).join('、')}`);
        return;
    }

    hideError();
    $('#city-input').value = city;
    updateRecent(city);
    renderWeather(city);
}

function addFavorite() {
    if (!favorites.includes(currentCity)) {
        favorites = [currentCity, ...favorites].slice(0, 8);
        writeStorage(STORAGE_KEYS.favorites, favorites);
        renderQuickLists();
        renderCompare();
    }
}

function setUnit(nextUnit) {
    unit = nextUnit;
    document.querySelectorAll('.unit-toggle button').forEach((button) => {
        button.classList.toggle('active', button.dataset.unit === unit);
    });
    renderWeather(currentCity);
}

function bindEvents() {
    $('#search-btn').addEventListener('click', () => searchWeather($('#city-input').value));
    $('#city-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') searchWeather(event.currentTarget.value);
    });
    $('#location-btn').addEventListener('click', () => searchWeather('郑州'));
    $('#favorite-btn').addEventListener('click', addFavorite);

    document.querySelectorAll('.unit-toggle button').forEach((button) => {
        button.addEventListener('click', () => setUnit(button.dataset.unit));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    searchWeather(currentCity);
});
