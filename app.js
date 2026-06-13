// ============================================================
//  Weather Desk v2 — 基于 Open-Meteo 免费 API 的真数据天气应用
//  无需 API Key，支持全球城市搜索 + 逐小时/7天预报 + 地理定位
// ============================================================

// -------------------- 配置 --------------------

/** 20+ 国内主要城市坐标（fallback + 快速入口） */
const CITY_COORDS = {
    北京:   { lat: 39.9042,  lon: 116.4074, country: '中国' },
    上海:   { lat: 31.2304,  lon: 121.4737, country: '中国' },
    广州:   { lat: 23.1291,  lon: 113.2644, country: '中国' },
    深圳:   { lat: 22.5431,  lon: 114.0579, country: '中国' },
    成都:   { lat: 30.5728,  lon: 104.0668, country: '中国' },
    杭州:   { lat: 30.2741,  lon: 120.1551, country: '中国' },
    郑州:   { lat: 34.7466,  lon: 113.6253, country: '中国' },
    武汉:   { lat: 30.5928,  lon: 114.3055, country: '中国' },
    南京:   { lat: 32.0603,  lon: 118.7969, country: '中国' },
    西安:   { lat: 34.3416,  lon: 108.9398, country: '中国' },
    重庆:   { lat: 29.4316,  lon: 106.9123, country: '中国' },
    长沙:   { lat: 28.2282,  lon: 112.9388, country: '中国' },
    青岛:   { lat: 36.0671,  lon: 120.3826, country: '中国' },
    大连:   { lat: 38.9140,  lon: 121.6147, country: '中国' },
    厦门:   { lat: 24.4798,  lon: 118.0894, country: '中国' },
    昆明:   { lat: 25.0389,  lon: 102.7183, country: '中国' },
    哈尔滨: { lat: 45.8038,  lon: 126.5350, country: '中国' },
    天津:   { lat: 39.3434,  lon: 117.3616, country: '中国' },
    苏州:   { lat: 31.2990,  lon: 120.5853, country: '中国' },
    合肥:   { lat: 31.8206,  lon: 117.2272, country: '中国' },
    东京:   { lat: 35.6762,  lon: 139.6503, country: '日本' },
    首尔:   { lat: 37.5665,  lon: 126.9780, country: '韩国' },
    纽约:   { lat: 40.7128,  lon: -74.0060, country: '美国' },
    伦敦:   { lat: 51.5074,  lon: -0.1278,  country: '英国' },
    巴黎:   { lat: 48.8566,  lon: 2.3522,   country: '法国' },
    悉尼:   { lat: -33.8688, lon: 151.2093, country: '澳大利亚' }
};

/** WMO 天气代码映射 */
const WMO_CODES = {
    0:  { desc: '晴',         symbol: '☀️' },
    1:  { desc: '大部晴朗',   symbol: '🌤️' },
    2:  { desc: '多云',       symbol: '⛅' },
    3:  { desc: '阴',         symbol: '☁️' },
    45: { desc: '雾',         symbol: '🌫️' },
    48: { desc: '冻雾',       symbol: '🌫️' },
    51: { desc: '小毛毛雨',   symbol: '🌦️' },
    53: { desc: '毛毛雨',     symbol: '🌦️' },
    55: { desc: '大毛毛雨',   symbol: '🌧️' },
    61: { desc: '小雨',       symbol: '🌧️' },
    63: { desc: '中雨',       symbol: '🌧️' },
    65: { desc: '大雨',       symbol: '🌧️' },
    71: { desc: '小雪',       symbol: '❄️' },
    73: { desc: '中雪',       symbol: '❄️' },
    75: { desc: '大雪',       symbol: '❄️' },
    77: { desc: '雪粒',       symbol: '❄️' },
    80: { desc: '阵雨',       symbol: '🌦️' },
    81: { desc: '中阵雨',     symbol: '🌧️' },
    82: { desc: '大阵雨',     symbol: '🌧️' },
    85: { desc: '小阵雪',     symbol: '🌨️' },
    86: { desc: '大阵雪',     symbol: '🌨️' },
    95: { desc: '雷暴',       symbol: '⛈️' },
    96: { desc: '雷暴伴冰雹', symbol: '⛈️' },
    99: { desc: '强雷暴',     symbol: '⛈️' }
};

const API_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const API_GEO      = 'https://geocoding-api.open-meteo.com/v1/search';
const API_AQ       = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const DEBOUNCE_MS  = 350;

// -------------------- 状态 --------------------

let currentCity   = '北京';
let currentLat    = CITY_COORDS['北京'].lat;
let currentLon    = CITY_COORDS['北京'].lon;
let currentCountry = '中国';
let unit          = 'c';
let currentTab    = 'daily';        // 'daily' | 'hourly'
let isLoading     = false;
let weatherCache  = new Map();      // 简单的内存缓存
let searchTimer   = null;
let lastWeatherData = null;         // 上一次成功获取的数据
let favorites     = readStorage('weatherDeskFavorites', ['北京', '上海', '郑州']);
let recentCities  = readStorage('weatherDeskRecent', []);

// -------------------- DOM 工具 --------------------

const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// -------------------- 存储工具 --------------------

function readStorage(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
}

function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* 静默失败 */ }
}

// -------------------- 温度转换 --------------------

function convertTemp(v) {
    if (unit === 'f') return Math.round((v * 9) / 5 + 32);
    return Math.round(v);
}

function tempText(v) {
    return convertTemp(v) + '\u00B0' + unit.toUpperCase();
}

// -------------------- 天气工具 --------------------

function getWeatherInfo(code) {
    return WMO_CODES[code] || { desc: '未知', symbol: '🌈' };
}

/** 动态生成天气摘要 */
function generateSummary(temp, humidity, code, wind) {
    const parts = [];
    // 温度
    if (temp >= 35) parts.push('当前酷热');
    else if (temp >= 30) parts.push('当前炎热');
    else if (temp >= 25) parts.push('当前温暖');
    else if (temp >= 15) parts.push('当前凉爽');
    else if (temp >= 5)  parts.push('当前偏冷');
    else parts.push('当前寒冷');

    // 天气
    const info = getWeatherInfo(code);
    if (code === 0) parts.push('天气晴好');
    else if (code >= 1 && code <= 3) parts.push('云量较多');
    else if (code >= 45 && code <= 48) parts.push('有雾');
    else if (code >= 51 && code <= 65) parts.push('有降雨');
    else if (code >= 71 && code <= 86) parts.push('有降雪');
    else if (code >= 95) parts.push('有雷暴');

    // 湿度
    if (humidity >= 80) parts.push('湿度较高，体感闷热');
    else if (humidity <= 30) parts.push('空气干燥，注意补水');

    // 风
    if (wind >= 10) parts.push('风力较大');
    else if (wind >= 5) parts.push('风力适中');

    return parts.join('，') + '。';
}

/** 舒适度计算（基于温度、湿度、风速） */
function getComfortScore(temp, humidity, wind) {
    const tempScore = Math.max(0, 100 - Math.abs(temp - 22) * 5);
    const humScore  = Math.max(0, 100 - Math.abs(humidity - 50) * 1.2);
    const windScore = Math.max(0, 100 - wind * 4);
    return Math.round(tempScore * 0.45 + humScore * 0.35 + windScore * 0.20);
}

function comfortLabel(score) {
    if (score >= 82) return '舒适';
    if (score >= 66) return '良好';
    if (score >= 50) return '一般';
    return '偏不适';
}

/** 估算能见度（基于湿度和天气码） */
function estimateVisibility(humidity, weatherCode) {
    const isFog = (weatherCode >= 45 && weatherCode <= 48);
    const isRain = (weatherCode >= 51 && weatherCode <= 65) || (weatherCode >= 80 && weatherCode <= 82);
    let vis = 20 - humidity * 0.18;
    if (isFog) vis = Math.min(vis, 2);
    if (isRain) vis = Math.min(vis, 8);
    return Math.max(0.5, Math.round(vis * 10) / 10);
}

/** 格式化时间 */
function formatTime(iso) {
    if (!iso) return '--:--';
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch { return '--:--'; }
}

function formatDate(iso) {
    if (!iso) return '--';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    } catch { return '--'; }
}

function getWeekday(iso) {
    if (!iso) return '--';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('zh-CN', { weekday: 'short' });
    } catch { return '--'; }
}

function isToday(iso) {
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d.getDate() === now.getDate();
}

// -------------------- API 调用 --------------------

/**
 * 获取天气预报数据
 * 同时请求 current / daily / hourly，一次调用覆盖所有需求
 */
async function fetchWeatherData(lat, lon) {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (weatherCache.has(cacheKey)) {
        const cached = weatherCache.get(cacheKey);
        if (Date.now() - cached.ts < 10 * 60 * 1000) return cached.data; // 10 分钟缓存
    }

    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'weather_code',
            'wind_speed_10m',
            'pressure_msl',
            'uv_index'
        ].join(','),
        daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'weather_code',
            'precipitation_probability_max',
            'sunrise',
            'sunset'
        ].join(','),
        hourly: [
            'temperature_2m',
            'weather_code',
            'precipitation_probability'
        ].join(','),
        timezone: 'auto',
        forecast_days: 7
    });

    const resp = await fetch(`${API_FORECAST}?${params}`);
    if (!resp.ok) {
        throw new Error(`API 请求失败 (${resp.status})`);
    }
    const data = await resp.json();

    weatherCache.set(cacheKey, { data, ts: Date.now() });
    return data;
}

/**
 * 获取空气质量（可选）
 */
async function fetchAQI(lat, lon) {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'european_aqi,us_aqi'
        });
        const resp = await fetch(`${API_AQ}?${params}`);
        if (!resp.ok) return null;
        const data = await resp.json();
        return data.current ? data.current.european_aqi : null;
    } catch {
        return null;
    }
}

/**
 * 地理编码 — 搜索城市
 */
async function geocodeCity(query) {
    const params = new URLSearchParams({
        name: query,
        count: 6,
        language: 'zh',
        format: 'json'
    });

    const resp = await fetch(`${API_GEO}?${params}`);
    if (!resp.ok) throw new Error('搜索服务暂时不可用');

    const data = await resp.json();
    if (!data.results || data.results.length === 0) return [];

    return data.results.map((r) => ({
        name: r.name || r.admin1 || query,
        admin1: r.admin1 || '',
        country: r.country || '',
        lat: r.latitude,
        lon: r.longitude
    }));
}

// -------------------- 骨架屏 --------------------

function showSkeleton() {
    isLoading = true;
    $('#skeleton-overlay').hidden = false;
    $('#search-btn').disabled = true;
    $('#city-input').disabled = true;
}

function hideSkeleton() {
    isLoading = false;
    $('#skeleton-overlay').hidden = true;
    $('#search-btn').disabled = false;
    $('#city-input').disabled = false;
}

// -------------------- 错误处理 --------------------

function showError(msg) {
    const el = $('#error-message');
    el.textContent = msg;
    el.hidden = false;
}

function hideError() {
    $('#error-message').hidden = true;
}

// -------------------- 搜索下拉 --------------------

function showSearchDropdown(results) {
    const dropdown = $('#search-results');
    if (!results || results.length === 0) {
        dropdown.hidden = true;
        return;
    }
    dropdown.innerHTML = results
        .map((r) => {
            const label = r.country
                ? `${r.name}${r.admin1 ? ', ' + r.admin1 : ''} — ${r.country}`
                : r.name;
            return `<button class="search-result-item" type="button"
                data-lat="${r.lat}" data-lon="${r.lon}"
                data-name="${r.name}" data-country="${r.country || ''}">
                ${label}
            </button>`;
        })
        .join('');
    dropdown.hidden = false;

    // 绑定点击事件
    dropdown.querySelectorAll('.search-result-item').forEach((btn) => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const lat = parseFloat(btn.dataset.lat);
            const lon = parseFloat(btn.dataset.lon);
            const country = btn.dataset.country;
            dropdown.hidden = true;
            $('#city-input').value = name;
            currentCity = name;
            currentLat = lat;
            currentLon = lon;
            currentCountry = country || '';
            updateRecent(name);
            loadWeather(lat, lon, name);
        });
    });
}

function hideSearchDropdown() {
    $('#search-results').hidden = true;
}

// -------------------- 数据加载 --------------------

async function loadWeather(lat, lon, cityName) {
    showSkeleton();
    hideError();

    try {
        const [weatherData, aqiValue] = await Promise.all([
            fetchWeatherData(lat, lon),
            fetchAQI(lat, lon)
        ]);

        lastWeatherData = { weatherData, aqiValue, cityName, lat, lon };
        currentCity = cityName;
        currentLat = lat;
        currentLon = lon;
        currentTab = 'daily';

        renderAll(lastWeatherData);
        $('#city-input').value = cityName;
        $('#updated-at').textContent =
            '实时数据更新于 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    } catch (err) {
        console.error('Weather fetch error:', err);
        if (lastWeatherData) {
            // 使用缓存数据
            renderAll(lastWeatherData);
            showError('获取最新数据失败，显示上次缓存数据。' + err.message);
        } else {
            showError('无法获取天气数据：' + err.message + '。请检查网络连接后重试。');
        }
        hideSkeleton();
    }
}

// -------------------- 渲染 --------------------

function renderAll(data) {
    const { weatherData, aqiValue, cityName } = data;
    const cur = weatherData.current;

    renderCurrentWeather(cur, aqiValue, cityName, weatherData);
    renderDailyForecast(weatherData.daily);
    renderHourlyForecast(weatherData.hourly);
    renderCompare(cur, cityName);
    renderQuickLists();
    switchTab(currentTab);
    hideSkeleton();
}

function renderCurrentWeather(cur, aqiValue, cityName, weatherData) {
    const info = getWeatherInfo(cur.weather_code);
    const temp = cur.temperature_2m;
    const humidity = cur.relative_humidity_2m;
    const wind = cur.wind_speed_10m;
    const visibility = estimateVisibility(humidity, cur.weather_code);

    $('#weather-symbol').textContent = info.symbol;
    $('#weather-desc').textContent = info.desc;
    $('#city-name').textContent = cityName;
    $('#temp').textContent = convertTemp(temp);
    $('#degree-label').textContent = '\u00B0' + unit.toUpperCase();

    const summary = generateSummary(temp, humidity, cur.weather_code, wind);
    $('#summary-text').textContent = summary;

    $('#feels-like').textContent = tempText(cur.apparent_temperature);
    $('#humidity').textContent = humidity + '%';
    $('#wind-speed').textContent = wind + ' m/s';

    if (aqiValue !== null) {
        const aqi = Math.round(aqiValue);
        let label = '';
        if (aqi <= 50) label = '优';
        else if (aqi <= 100) label = '良';
        else if (aqi <= 150) label = '轻度污染';
        else label = '污染';
        $('#aqi').textContent = aqi + ' ' + label;
    } else {
        $('#aqi').textContent = '--';
    }

    $('#uv-index').textContent = cur.uv_index != null ? Math.round(cur.uv_index) : '--';
    $('#pressure').textContent = Math.round(cur.pressure_msl) + ' hPa';

    // 新增详情
    const daily = weatherData.daily;
    if (daily && daily.sunrise && daily.sunrise.length > 0) {
        $('#sunrise').textContent = formatTime(daily.sunrise[0]);
        $('#sunset').textContent = formatTime(daily.sunset[0]);
    } else {
        $('#sunrise').textContent = '--:--';
        $('#sunset').textContent = '--:--';
    }

    $('#visibility').textContent = visibility + ' km';

    if (daily && daily.precipitation_probability_max && daily.precipitation_probability_max.length > 0) {
        $('#precip-probability').textContent = daily.precipitation_probability_max[0] + '%';
    } else {
        $('#precip-probability').textContent = '--';
    }

    // 舒适度
    const comfortScore = getComfortScore(temp, humidity, wind);
    $('#comfort-label').textContent = comfortScore + ' \u00B7 ' + comfortLabel(comfortScore);
    $('#comfort-bar').style.width = comfortScore + '%';
}

function renderDailyForecast(daily) {
    const days = daily.time || [];
    const container = $('#forecast-grid');
    container.innerHTML = '';

    const displayDays = days.slice(0, 7);
    displayDays.forEach((date, i) => {
        const info = getWeatherInfo(daily.weather_code[i]);
        const high = daily.temperature_2m_max[i];
        const low = daily.temperature_2m_min[i];
        const precip = daily.precipitation_probability_max
            ? daily.precipitation_probability_max[i]
            : null;

        const card = document.createElement('article');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span>${isToday(date) ? '今天' : getWeekday(date)}</span>
            <strong>${info.symbol}</strong>
            <p>${info.desc}</p>
            <b>${tempText(high)} / ${tempText(low)}</b>
            ${precip != null ? `<small>降水 ${precip}%</small>` : '<small>' + formatDate(date) + '</small>'}
        `;
        container.appendChild(card);
    });
}

function renderHourlyForecast(hourly) {
    const times = hourly.time || [];
    const container = $('#hourly-scroll');
    container.innerHTML = '';

    const now = new Date();
    const startIdx = times.findIndex((t) => new Date(t) >= now);
    const displayTimes = startIdx >= 0 ? times.slice(startIdx, startIdx + 24) : times.slice(0, 24);

    displayTimes.forEach((time, i) => {
        const idx = startIdx >= 0 ? startIdx + i : i;
        const info = getWeatherInfo(hourly.weather_code[idx]);
        const temp = hourly.temperature_2m[idx];
        const precip = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : null;

        const item = document.createElement('div');
        item.className = 'hourly-item';
        const d = new Date(time);
        const hourLabel = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const isNow = Math.abs(d - now) < 60 * 60 * 1000;

        item.innerHTML = `
            <span class="hourly-time">${isNow ? '现在' : hourLabel}</span>
            <span class="hourly-symbol">${info.symbol}</span>
            <span class="hourly-temp">${tempText(temp)}</span>
            ${precip != null ? '<span class="hourly-precip">' + precip + '%</span>' : ''}
        `;
        container.appendChild(item);
    });
}

function renderCompare(cur, cityName) {
    const cities = Array.from(new Set(
        [cityName, ...favorites, '杭州', '深圳', '上海', '广州']
    )).filter((c) => CITY_COORDS[c]).slice(0, 5);

    $('#compare-list').innerHTML = cities
        .map((city) => {
            const coords = CITY_COORDS[city];
            const isActive = city === cityName || city === currentCity;
            return `
                <button class="compare-card ${isActive ? 'active' : ''}" type="button"
                    data-city="${city}"
                    data-lat="${coords.lat}" data-lon="${coords.lon}">
                    <span>${city}</span>
                    <strong>--</strong>
                    <small>点击加载实时数据</small>
                </button>
            `;
        })
        .join('');

    // 异步加载对比城市数据
    cities.forEach((city) => {
        if (city === cityName) return;
        const coords = CITY_COORDS[city];
        fetchWeatherData(coords.lat, coords.lon).then((data) => {
            const card = document.querySelector(`.compare-card[data-city="${city}"]`);
            if (!card) return;
            const curData = data.current;
            const info = getWeatherInfo(curData.weather_code);
            card.querySelector('strong').textContent = tempText(curData.temperature_2m);
            card.querySelector('small').textContent =
                info.desc + ' \u00B7 湿度 ' + curData.relative_humidity_2m + '%';
        }).catch(() => {
            // 静默失败
        });
    });

    document.querySelectorAll('.compare-card').forEach((card) => {
        card.addEventListener('click', () => {
            const city = card.dataset.city;
            const lat = parseFloat(card.dataset.lat);
            const lon = parseFloat(card.dataset.lon);
            currentCity = city;
            currentLat = lat;
            currentLon = lon;
            currentCountry = CITY_COORDS[city]?.country || '';
            updateRecent(city);
            loadWeather(lat, lon, city);
        });
    });
}

function renderQuickLists() {
    $('#favorite-list').innerHTML = favorites.length
        ? favorites.map(cityTag).join('')
        : '<span class="empty-chip">暂无收藏城市，搜索并收藏你关注的城市</span>';

    $('#recent-list').innerHTML = recentCities.length
        ? recentCities.map(cityTag).join('')
        : '<span class="empty-chip">暂无最近查询，搜索城市后将自动记录</span>';

    $$('[data-city-tag]').forEach((tag) => {
        tag.addEventListener('click', () => {
            const city = tag.dataset.cityTag;
            const coords = CITY_COORDS[city];
            if (coords) {
                currentCity = city;
                currentLat = coords.lat;
                currentLon = coords.lon;
                currentCountry = coords.country;
                updateRecent(city);
                loadWeather(coords.lat, coords.lon, city);
            } else {
                // 非预设城市，尝试 geocode
                searchAndSelect(city);
            }
        });
    });
}

function cityTag(city) {
    return `<button class="city-tag" type="button" data-city-tag="${city}">${city}</button>`;
}

function updateRecent(city) {
    recentCities = [city, ...recentCities.filter((c) => c !== city)].slice(0, 6);
    writeStorage('weatherDeskRecent', recentCities);
}

// -------------------- Tab 切换 --------------------

function switchTab(tab) {
    currentTab = tab;
    $$('.tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    $('#forecast-grid').hidden = tab !== 'daily';
    $('#hourly-scroll').hidden = tab !== 'hourly';
}

// -------------------- 搜索逻辑 --------------------

async function searchAndSelect(query) {
    hideSearchDropdown();
    showSkeleton();
    hideError();

    try {
        const results = await geocodeCity(query);
        if (results.length === 0) {
            // 检查是否在预设城市列表
            const normalized = query.trim().replace(/市$/, '');
            const coords = CITY_COORDS[normalized];
            if (coords) {
                currentCity = normalized;
                currentLat = coords.lat;
                currentLon = coords.lon;
                currentCountry = coords.country;
                updateRecent(normalized);
                await loadWeather(coords.lat, coords.lon, normalized);
                return;
            }
            showError('未找到城市"' + query + '"，请尝试使用完整城市名或英文名。');
            hideSkeleton();
            return;
        }

        const first = results[0];
        currentCity = first.name;
        currentLat = first.lat;
        currentLon = first.lon;
        currentCountry = first.country || '';
        updateRecent(first.name);
        await loadWeather(first.lat, first.lon, first.name);
    } catch (err) {
        showError('搜索失败：' + err.message);
        hideSkeleton();
    }
}

async function handleSearchInput(value) {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) {
        hideSearchDropdown();
        return;
    }

    // 检查预设城市
    const normalized = trimmed.replace(/市$/, '');
    if (CITY_COORDS[normalized]) {
        hideSearchDropdown();
        return;
    }

    // Debounced geocoding
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
        try {
            const results = await geocodeCity(trimmed);
            showSearchDropdown(results);
        } catch {
            hideSearchDropdown();
        }
    }, DEBOUNCE_MS);
}

// -------------------- 地理定位 --------------------

async function handleGeolocation() {
    if (!navigator.geolocation) {
        showError('您的浏览器不支持地理定位功能。');
        return;
    }

    showSkeleton();
    hideError();

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });

        const { latitude, longitude } = position.coords;
        currentLat = latitude;
        currentLon = longitude;

        // 尝试反向地理编码获取城市名
        try {
            const results = await geocodeCity(`${latitude.toFixed(4)},${longitude.toFixed(4)}`);
            if (results.length > 0) {
                currentCity = results[0].name;
                currentCountry = results[0].country || '';
            } else {
                currentCity = '当前位置';
                currentCountry = '';
            }
        } catch {
            currentCity = '当前位置';
            currentCountry = '';
        }

        updateRecent(currentCity);
        await loadWeather(latitude, longitude, currentCity);
    } catch (err) {
        hideSkeleton();
        if (err.code === 1) {
            showError('定位权限被拒绝，已切换到默认城市。');
        } else if (err.code === 2) {
            showError('无法获取定位信息，已切换到默认城市。');
        } else {
            showError('定位超时，已切换到默认城市。');
        }
        // Fallback 到默认城市
        const coords = CITY_COORDS['北京'];
        currentCity = '北京';
        currentLat = coords.lat;
        currentLon = coords.lon;
        currentCountry = coords.country;
        await loadWeather(coords.lat, coords.lon, '北京');
    }
}

// -------------------- 收藏 --------------------

function addFavorite() {
    if (!favorites.includes(currentCity)) {
        favorites = [currentCity, ...favorites].slice(0, 8);
        writeStorage('weatherDeskFavorites', favorites);
        renderQuickLists();
        if (lastWeatherData) {
            renderCompare(lastWeatherData.weatherData.current, currentCity);
        }
    }
}

// -------------------- 单位切换 --------------------

function setUnit(nextUnit) {
    unit = nextUnit;
    $$('.unit-toggle button').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
    });
    if (lastWeatherData) {
        renderAll(lastWeatherData);
    }
}

// -------------------- 事件绑定 --------------------

function bindEvents() {
    // 搜索
    $('#search-btn').addEventListener('click', () => {
        const value = $('#city-input').value.trim();
        if (!value) return;
        hideSearchDropdown();

        const normalized = value.replace(/市$/, '');
        const coords = CITY_COORDS[normalized];
        if (coords) {
            currentCity = normalized;
            currentLat = coords.lat;
            currentLon = coords.lon;
            currentCountry = coords.country;
            updateRecent(normalized);
            loadWeather(coords.lat, coords.lon, normalized);
        } else {
            searchAndSelect(value);
        }
    });

    $('#city-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            $('#search-btn').click();
        }
    });

    $('#city-input').addEventListener('input', (e) => {
        handleSearchInput(e.target.value);
    });

    // 点击外部关闭搜索下拉
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#city-input') && !e.target.closest('#search-results')) {
            hideSearchDropdown();
        }
    });

    // 定位
    $('#location-btn').addEventListener('click', handleGeolocation);

    // 收藏
    $('#favorite-btn').addEventListener('click', addFavorite);

    // 单位切换
    $$('.unit-toggle button').forEach((btn) => {
        btn.addEventListener('click', () => setUnit(btn.dataset.unit));
    });

    // Tab 切换
    $$('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

// -------------------- 初始化 --------------------

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    const coords = CITY_COORDS['北京'];
    currentCity = '北京';
    currentLat = coords.lat;
    currentLon = coords.lon;
    currentCountry = coords.country;
    loadWeather(coords.lat, coords.lon, '北京');
});