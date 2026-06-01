# 城市天气观察台 Weather Desk

一个静态天气数据展示项目，用本地模拟数据实现城市查询、舒适度计算、空气质量展示、五日趋势和城市对比。

## 在线演示

[访问项目](https://aur0ra333.github.io/weather-app/)

## 功能

- 城市查询：支持北京、上海、广州、深圳、成都、杭州、郑州、武汉等演示城市
- 单位切换：摄氏度 / 华氏度即时切换
- 天气详情：温度、体感、湿度、风速、AQI、紫外线和气压
- 舒适度计算：综合体感温度、湿度和空气质量生成分数
- 五日趋势：根据城市稳定生成未来 5 天预报，方便演示和测试
- 城市对比：快速比较多个城市的核心指标
- 本地记录：收藏城市和最近查询保存在 LocalStorage

## 技术点

- 原生 JavaScript 数据渲染
- LocalStorage 本地状态保存
- CSS Grid / Flexbox 响应式布局
- 表单交互、错误提示和单位换算
- 可替换为真实天气 API 的数据结构

## 本地运行

```bash
git clone https://github.com/aur0ra333/weather-app.git
cd weather-app
python -m http.server 8080
```

然后访问 `http://localhost:8080`。
