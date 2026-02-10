# StockView - A股分析平台

基于 React + Node.js 的 A 股实时行情分析平台，支持 K 线图表、技术指标、AI 技术分析、板块分类和财经资讯。

## 技术栈

- **前端**: React 19 + Vite 7 + ECharts 6 + React Router 7
- **后端**: Node.js + Express
- **数据源**: 新浪财经 API（实时行情、K 线、板块、新闻）
- **部署**: 单服务器模式，Express 同时提供 API 和静态文件服务

## 功能模块

### 行情首页 (`/`)
- 大盘指数实时展示（上证指数、深证成指、创业板指）
- 12 只热门股票网格展示，30 秒自动刷新
- 涨跌颜色标识（红涨绿跌）

### 个股详情 (`/stock/:symbol`)
- 实时报价（价格、涨跌幅、开盘、最高、最低、成交量、成交额）
- K 线图表，支持多周期切换：日线、周线、60分钟、30分钟、15分钟、5分钟
- 技术指标叠加：MA（5/10/20/60）、MACD、RSI、KDJ、BOLL
- 收藏/取消收藏功能
- AI 技术分析面板：
  - 综合评分（5-95 分），基于 7 项技术指标加权计算
  - 评级：强烈看多 / 偏多 / 中性 / 偏空 / 强烈看空
  - 逐项信号分析（均线、MACD、RSI、KDJ、成交量、趋势、支撑/压力位）
  - 投资建议摘要

### 板块分类 (`/sectors`)
- 行业板块 / 概念板块切换
- 板块列表：名称、股票数、涨跌幅、领涨股
- 板块详情下钻：成分股列表、上涨/下跌统计、平均涨幅、总成交额
- 点击成分股跳转个股详情

### 自选股 (`/favorites`)
- 基于 localStorage 的收藏管理
- 实时拉取自选股行情
- 一键添加/删除

### 财经资讯 (`/news`)
- 新浪财经新闻源
- 分页加载，带标题、摘要、来源、缩略图
- 时间相对显示（刚刚、X 分钟前、X 小时前）

### 股票搜索
- 顶部搜索栏，支持代码/名称模糊搜索
- 300ms 防抖，实时联想

## API 接口

| 接口 | 说明 |
|------|------|
| `GET /api/stock/quote/:symbol` | 单股实时行情 |
| `GET /api/stock/kline/:symbol?period=daily&count=200` | K 线数据 |
| `GET /api/stock/multi?symbols=600519,000858` | 批量行情 |
| `GET /api/stock/search?keyword=茅台` | 股票搜索 |
| `GET /api/stock/hot` | 热门股票 |
| `GET /api/stock/indices` | 大盘指数 |
| `GET /api/stock/news?page=1&count=20` | 财经新闻 |
| `GET /api/stock/analyze/:symbol` | AI 技术分析 |
| `GET /api/stock/sectors?type=industry` | 板块列表 |
| `GET /api/stock/sector/:code` | 板块详情 |

## 项目结构

```
stock-analyzer/
├── client/
│   └── src/
│       ├── components/Layout.jsx    # 布局（导航、搜索）
│       ├── pages/
│       │   ├── HomePage.jsx         # 行情首页
│       │   ├── StockDetail.jsx      # 个股详情 + K 线 + AI 分析
│       │   ├── SectorPage.jsx       # 板块分类
│       │   ├── FavoritesPage.jsx    # 自选股
│       │   ├── NewsPage.jsx         # 财经资讯
│       │   └── SearchPage.jsx       # 搜索页
│       ├── utils/
│       │   ├── api.js               # API 客户端
│       │   ├── indicators.js        # 技术指标计算
│       │   └── favorites.js         # 收藏管理
│       ├── App.jsx                  # 路由配置
│       └── index.css                # 全局样式（暗色主题）
├── server/
│   ├── index.js                     # Express 入口
│   ├── routes/stock.js              # 路由处理
│   └── services/
│       ├── stockService.js          # 新浪 API 对接
│       └── analysisService.js       # AI 分析引擎
└── package.json
```

## 运行

```bash
# 开发模式（前后端分离）
npm run dev

# 生产构建
npm run build

# 生产运行
PORT=51233 npm start
```

## 设计特点

- 暗色主题，GitHub 风格配色
- 移动端适配：底部导航栏、响应式布局
- 中国 A 股特色：红涨绿跌、GBK 编码处理
- AI 分析采用本地技术指标计算，无外部 AI API 依赖
