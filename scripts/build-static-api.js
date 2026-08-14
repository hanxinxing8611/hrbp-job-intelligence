// 为 GitHub Pages 静态部署预生成 API JSON 数据
// 运行时机：npm run build 之后

const fs = require('fs')
const path = require('path')

const sources = ['BOSS直聘', '智联招聘', '前程无忧']
const sourceWeights = { 'BOSS直聘': 1.2, '智联招聘': 1.0, '前程无忧': 0.8 }
const sourceUrls = {
  'BOSS直聘': 'https://www.zhipin.com/web/geek/job?query=HRBP&city=100010000',
  '智联招聘': 'https://sou.zhaopin.com/?kw=HRBP',
  '前程无忧': 'https://we.51job.com/pc/search?keyword=HRBP',
}

const companyTemplates = [
  // 大厂上市公司（覆盖全国分公司）
  { name: '阿里巴巴', industry: '互联网', headquarters: '杭州', scale: '1000人以上', stage: '上市公司', logoColor: '#FF5A00', logoInitial: '阿', branches: ['北京','上海','深圳','成都','广州','南京','武汉','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','福州','济南'] },
  { name: '腾讯', industry: '互联网', headquarters: '深圳', scale: '1000人以上', stage: '上市公司', logoColor: '#00A8FF', logoInitial: '腾', branches: ['北京','上海','成都','武汉','广州','西安','南京','长沙','重庆','苏州','天津','合肥','青岛','大连','厦门'] },
  { name: '字节跳动', industry: '互联网', headquarters: '北京', scale: '1000人以上', stage: '已上市/未上市', logoColor: '#000000', logoInitial: '字', branches: ['上海','深圳','杭州','成都','广州','武汉','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','厦门','大连','宁波','济南','昆明'] },
  { name: '美团', industry: '本地生活', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#FFD100', logoInitial: '美', branches: ['上海','深圳','成都','武汉','广州','杭州','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','厦门','大连','宁波','济南','昆明','沈阳','哈尔滨','福州','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口','银川','西宁','乌鲁木齐','拉萨','呼和浩特'] },
  { name: '京东', industry: '电商', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#E4393C', logoInitial: '京', branches: ['上海','广州','成都','武汉','杭州','深圳','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','沈阳','福州','昆明','哈尔滨','长春','石家庄','太原','南宁','贵阳','南昌','兰州','海口'] },
  { name: '百度', industry: '互联网', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#2932E1', logoInitial: '百', branches: ['上海','深圳','广州','杭州','成都','武汉','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波'] },
  { name: '网易', industry: '互联网/游戏', headquarters: '杭州', scale: '1000人以上', stage: '上市公司', logoColor: '#C20C0C', logoInitial: '网', branches: ['北京','上海','广州','深圳','成都','武汉','南京','长沙','重庆','苏州','合肥','厦门','大连'] },
  { name: '拼多多', industry: '电商', headquarters: '上海', scale: '1000人以上', stage: '上市公司', logoColor: '#E02E24', logoInitial: '拼', branches: ['北京','深圳','杭州','成都','广州','武汉','南京','长沙','重庆','苏州','天津'] },
  { name: '华为', industry: '通信/消费电子', headquarters: '深圳', scale: '1000人以上', stage: '上市公司', logoColor: '#CF0A2C', logoInitial: '华', branches: ['北京','上海','成都','西安','南京','武汉','杭州','广州','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','沈阳','昆明','哈尔滨','福州','石家庄','太原','南宁','贵阳','南昌','长春','兰州','海口'] },
  { name: '招商银行', industry: '金融', headquarters: '深圳', scale: '1000人以上', stage: '上市公司', logoColor: '#C41230', logoInitial: '招', branches: ['北京','上海','成都','武汉','南京','杭州','广州','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','沈阳','昆明','福州','哈尔滨','石家庄','太原','南宁','贵阳','南昌','长春','兰州','海口'] },
  // 中大型企业
  { name: '快手', industry: '短视频', headquarters: '北京', scale: '500-1000人', stage: '上市公司', logoColor: '#FF6600', logoInitial: '快', branches: ['上海','深圳','杭州','成都','广州','武汉','南京','长沙','重庆'] },
  { name: '滴滴', industry: '出行', headquarters: '北京', scale: '500-1000人', stage: '上市公司', logoColor: '#FF7A00', logoInitial: '滴', branches: ['上海','成都','杭州','深圳','广州','武汉','南京','西安','长沙','重庆','苏州','天津'] },
  { name: '小米', industry: '智能硬件', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#FF6900', logoInitial: '小', branches: ['上海','深圳','南京','武汉','杭州','成都','广州','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南'] },
  { name: '哔哩哔哩', industry: '视频社区', headquarters: '上海', scale: '500-1000人', stage: '上市公司', logoColor: '#23ADE5', logoInitial: 'B', branches: ['北京','深圳','成都','武汉','广州','杭州','南京','长沙'] },
  { name: '小红书', industry: '内容社区', headquarters: '上海', scale: '500-1000人', stage: '成长期', logoColor: '#FF2442', logoInitial: '红', branches: ['北京','深圳','杭州','成都','广州','武汉'] },
  { name: '蚂蚁集团', industry: '金融科技', headquarters: '杭州', scale: '1000人以上', stage: '成长期', logoColor: '#1677FF', logoInitial: '蚂', branches: ['北京','上海','深圳','成都','广州','武汉','南京','长沙','重庆'] },
  { name: '蔚来汽车', industry: '新能源汽车', headquarters: '上海', scale: '1000人以上', stage: '上市公司', logoColor: '#0066FF', logoInitial: '蔚', branches: ['合肥','北京','深圳','杭州','成都','武汉','南京','广州'] },
  { name: '理想汽车', industry: '新能源汽车', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#000000', logoInitial: '理', branches: ['上海','常州','深圳','成都','广州','杭州','武汉','南京'] },
  { name: '比亚迪', industry: '新能源汽车', headquarters: '深圳', scale: '1000人以上', stage: '上市公司', logoColor: '#003D79', logoInitial: '比', branches: ['北京','上海','西安','长沙','重庆','合肥','郑州','青岛','济南','武汉','成都','南京','杭州','广州','天津','大连','厦门','宁波','昆明','福州','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  // 中型企业
  { name: 'vivo', industry: '消费电子', headquarters: '东莞', scale: '1000人以上', stage: '成熟期', logoColor: '#4CAF50', logoInitial: 'v', branches: ['深圳','南京','杭州','北京','上海','成都','武汉','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: 'OPPO', industry: '消费电子', headquarters: '东莞', scale: '1000人以上', stage: '成熟期', logoColor: '#2196F3', logoInitial: 'O', branches: ['深圳','成都','武汉','北京','上海','杭州','广州','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '米哈游', industry: '游戏', headquarters: '上海', scale: '500-1000人', stage: '成长期', logoColor: '#FFCC00', logoInitial: '米', branches: ['北京','深圳','杭州','成都','广州'] },
  { name: '商汤科技', industry: 'AI', headquarters: '上海', scale: '500-1000人', stage: '上市公司', logoColor: '#00B4D8', logoInitial: '商', branches: ['北京','深圳','杭州','成都','武汉','南京','苏州','西安'] },
  { name: '旷视科技', industry: 'AI', headquarters: '北京', scale: '150-500人', stage: '成长期', logoColor: '#00C896', logoInitial: '旷', branches: ['成都','南京','上海','深圳','杭州'] },
  { name: '地平线', industry: '自动驾驶', headquarters: '北京', scale: '500-1000人', stage: '成长期', logoColor: '#3B82F6', logoInitial: '地', branches: ['上海','南京','深圳','杭州','成都','武汉','苏州'] },
  { name: 'SHEIN', industry: '跨境电商', headquarters: '广州', scale: '1000人以上', stage: '成长期', logoColor: '#000000', logoInitial: 'S', branches: ['深圳','南京','杭州','上海','佛山','东莞'] },
  { name: '顺丰科技', industry: '物流科技', headquarters: '深圳', scale: '1000人以上', stage: '上市公司', logoColor: '#FF6600', logoInitial: '顺', branches: ['北京','上海','武汉','杭州','成都','广州','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '大疆', industry: '无人机', headquarters: '深圳', scale: '1000人以上', stage: '成熟期', logoColor: '#000000', logoInitial: '大', branches: ['北京','上海','杭州','成都','广州','南京','武汉','西安','苏州','天津'] },
  // 成都企业
  { name: '腾讯成都', industry: '互联网', headquarters: '成都', scale: '1000人以上', stage: '上市公司', logoColor: '#00A8FF', logoInitial: '腾' },
  { name: '京东方', industry: '半导体显示', headquarters: '成都', scale: '1000人以上', stage: '上市公司', logoColor: '#0066CC', logoInitial: '京', branches: ['北京','合肥','重庆','武汉','苏州','福州','昆明','大连'] },
  { name: '极米科技', industry: '智能硬件', headquarters: '成都', scale: '500-1000人', stage: '上市公司', logoColor: '#FF6600', logoInitial: '极' },
  { name: '咕咚', industry: '运动健康', headquarters: '成都', scale: '150-500人', stage: '成长期', logoColor: '#FF4500', logoInitial: '咕' },
  { name: 'Camera 360', industry: '互联网', headquarters: '成都', scale: '150-500人', stage: '成长期', logoColor: '#2196F3', logoInitial: 'C' },
  // 南京企业
  { name: '中兴通讯', industry: '通信', headquarters: '南京', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '中', branches: ['深圳','上海','北京','西安','成都','武汉','长沙'] },
  { name: '苏宁易购', industry: '电商', headquarters: '南京', scale: '1000人以上', stage: '上市公司', logoColor: '#FF8800', logoInitial: '苏', branches: ['北京','上海','深圳','杭州','成都','武汉','广州','西安','长沙'] },
  { name: 'T3出行', industry: '出行', headquarters: '南京', scale: '500-1000人', stage: '成长期', logoColor: '#00BFA5', logoInitial: 'T', branches: ['杭州','苏州','武汉','成都','广州','天津','重庆','深圳'] },
  { name: '满帮集团', industry: '物流科技', headquarters: '南京', scale: '500-1000人', stage: '上市公司', logoColor: '#FF6600', logoInitial: '满', branches: ['成都','武汉','长沙','上海','北京'] },
  // 武汉企业
  { name: '斗鱼', industry: '直播', headquarters: '武汉', scale: '1000人以上', stage: '上市公司', logoColor: '#FF7A00', logoInitial: '斗', branches: ['北京','上海','深圳','广州'] },
  { name: '金山办公', industry: '软件', headquarters: '武汉', scale: '500-1000人', stage: '上市公司', logoColor: '#FF4500', logoInitial: '金', branches: ['北京','深圳','广州','成都'] },
  { name: '物易科技', industry: '物流科技', headquarters: '武汉', scale: '150-500人', stage: '成长期', logoColor: '#4CAF50', logoInitial: '物' },
  // 西安企业
  { name: '三星半导体', industry: '半导体', headquarters: '西安', scale: '1000人以上', stage: '上市公司', logoColor: '#1428A0', logoInitial: '三', branches: ['北京','上海','深圳'] },
  { name: '易点云', industry: '企业服务', headquarters: '西安', scale: '150-500人', stage: '成长期', logoColor: '#00BFA5', logoInitial: '易' },
  // 长沙企业
  { name: '芒果TV', industry: '视频', headquarters: '长沙', scale: '1000人以上', stage: '上市公司', logoColor: '#FF6600', logoInitial: '芒', branches: ['北京','上海','深圳','广州'] },
  { name: '兴盛优选', industry: '社区电商', headquarters: '长沙', scale: '500-1000人', stage: '成长期', logoColor: '#FF4500', logoInitial: '兴' },
  { name: '安克创新', industry: '消费电子', headquarters: '长沙', scale: '500-1000人', stage: '上市公司', logoColor: '#00BFA5', logoInitial: '安', branches: ['深圳','北京','上海'] },
  // 苏州企业
  { name: '科沃斯', industry: '智能硬件', headquarters: '苏州', scale: '1000人以上', stage: '上市公司', logoColor: '#0066FF', logoInitial: '科', branches: ['北京','上海','深圳'] },
  { name: '同程旅行', industry: '旅游', headquarters: '苏州', scale: '500-1000人', stage: '上市公司', logoColor: '#2196F3', logoInitial: '同', branches: ['北京','上海','广州'] },
  { name: '思必驰', industry: 'AI', headquarters: '苏州', scale: '150-500人', stage: '成长期', logoColor: '#00BFA5', logoInitial: '思', branches: ['北京','上海','深圳'] },
  // 重庆企业
  { name: '长安汽车', industry: '汽车', headquarters: '重庆', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '长', branches: ['北京','上海','深圳','南京','合肥'] },
  { name: '猪八戒网', industry: '企业服务', headquarters: '重庆', scale: '500-1000人', stage: '成长期', logoColor: '#FF6600', logoInitial: '猪', branches: ['北京','上海','深圳','成都'] },
  // 合肥企业
  { name: '科大讯飞', industry: 'AI', headquarters: '合肥', scale: '1000人以上', stage: '上市公司', logoColor: '#0066CC', logoInitial: '科', branches: ['北京','上海','深圳','广州','成都','武汉','南京','西安','长沙','重庆','苏州','天津','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '国轩高科', industry: '新能源', headquarters: '合肥', scale: '500-1000人', stage: '上市公司', logoColor: '#4CAF50', logoInitial: '国', branches: ['上海','北京','深圳','南京','苏州'] },
  // 天津企业
  { name: '一汽丰田', industry: '汽车', headquarters: '天津', scale: '1000人以上', stage: '上市公司', logoColor: '#CC0000', logoInitial: '一', branches: ['北京','上海','成都','广州'] },
  { name: '九安医疗', industry: '医疗器械', headquarters: '天津', scale: '150-500人', stage: '上市公司', logoColor: '#2196F3', logoInitial: '九' },
  // 厦门企业
  { name: '美图', industry: '互联网', headquarters: '厦门', scale: '500-1000人', stage: '上市公司', logoColor: '#E91E63', logoInitial: '美', branches: ['北京','上海','深圳','广州'] },
  { name: '吉比特', industry: '游戏', headquarters: '厦门', scale: '150-500人', stage: '上市公司', logoColor: '#FF9800', logoInitial: '吉', branches: ['北京','上海','深圳'] },
  // 青岛/济南
  { name: '海尔智家', industry: '智能硬件', headquarters: '青岛', scale: '1000人以上', stage: '上市公司', logoColor: '#0066CC', logoInitial: '海', branches: ['北京','上海','深圳','广州','武汉','南京','西安','成都','大连','济南'] },
  { name: '浪潮信息', industry: '服务器', headquarters: '济南', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '浪', branches: ['北京','上海','深圳','郑州'] },
  { name: '海信集团', industry: '家电', headquarters: '青岛', scale: '1000人以上', stage: '上市公司', logoColor: '#0066B3', logoInitial: '海', branches: ['北京','上海','深圳','广州','武汉','南京'] },
  // 无锡/常州/福州/大连
  { name: '药明生物', industry: '医药研发', headquarters: '无锡', scale: '1000人以上', stage: '上市公司', logoColor: '#0066FF', logoInitial: '药', branches: ['上海','苏州','常州'] },
  { name: '中创新航', industry: '新能源', headquarters: '常州', scale: '500-1000人', stage: '上市公司', logoColor: '#4CAF50', logoInitial: '中', branches: ['厦门','成都','武汉','合肥'] },
  { name: '瑞芯微', industry: '芯片', headquarters: '福州', scale: '150-500人', stage: '上市公司', logoColor: '#2196F3', logoInitial: '瑞', branches: ['深圳','上海','北京'] },
  { name: '华信永道', industry: '企业服务', headquarters: '大连', scale: '150-500人', stage: '上市公司', logoColor: '#009688', logoInitial: '华', branches: ['北京','上海','沈阳'] },
  // 郑州/沈阳/哈尔滨
  { name: 'UU跑腿', industry: '本地生活', headquarters: '郑州', scale: '150-500人', stage: '成长期', logoColor: '#FF6600', logoInitial: 'U' },
  { name: '东软集团', industry: '软件', headquarters: '沈阳', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '东', branches: ['北京','上海','大连','南京'] },
  // 昆明/南宁/贵阳
  { name: '一心堂', industry: '医药零售', headquarters: '昆明', scale: '500-1000人', stage: '上市公司', logoColor: '#4CAF50', logoInitial: '一' },
  { name: '华为云', industry: '云计算', headquarters: '贵阳', scale: '500-1000人', stage: '上市公司', logoColor: '#CF0A2C', logoInitial: '华' },
  // 宁波/佛山/东莞/温州/泉州
  { name: '均胜电子', industry: '汽车零部件', headquarters: '宁波', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '均', branches: ['上海','杭州'] },
  { name: '美的集团', industry: '家电', headquarters: '佛山', scale: '1000人以上', stage: '上市公司', logoColor: '#00549F', logoInitial: '美', branches: ['广州','深圳','合肥','武汉','南京','长沙','重庆','苏州','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: 'TCL科技', industry: '半导体显示', headquarters: '惠州', scale: '1000人以上', stage: '上市公司', logoColor: '#E0218A', logoInitial: 'T', branches: ['深圳','广州','武汉','成都','苏州','天津'] },
  { name: '正泰电器', industry: '电气', headquarters: '温州', scale: '1000人以上', stage: '上市公司', logoColor: '#0066B3', logoInitial: '正', branches: ['杭州','上海','北京'] },
  { name: '安踏体育', industry: '运动品牌', headquarters: '泉州', scale: '1000人以上', stage: '上市公司', logoColor: '#CC0000', logoInitial: '安', branches: ['厦门','上海','北京','广州'] },
  // 医药/医疗企业
  { name: '复星医药', industry: '医药', headquarters: '上海', scale: '1000人以上', stage: '上市公司', logoColor: '#0066CC', logoInitial: '复', branches: ['北京','深圳','成都','武汉','重庆'] },
  { name: '药明康德', industry: '医药研发', headquarters: '上海', scale: '1000人以上', stage: '上市公司', logoColor: '#0066FF', logoInitial: '药', branches: ['苏州','天津','武汉','南京','常州'] },
  { name: '联影医疗', industry: '医疗设备', headquarters: '上海', scale: '500-1000人', stage: '成长期', logoColor: '#2196F3', logoInitial: '联', branches: ['北京','深圳','广州','武汉','成都'] },
  { name: '微创医疗', industry: '医疗器械', headquarters: '上海', scale: '150-500人', stage: '上市公司', logoColor: '#4CAF50', logoInitial: '微', branches: ['北京','深圳','苏州'] },
  // 教育科技
  { name: '好未来', industry: '教育科技', headquarters: '北京', scale: '500-1000人', stage: '上市公司', logoColor: '#FF9800', logoInitial: '好', branches: ['上海','深圳','杭州','广州','武汉','成都','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','沈阳','福州','昆明','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '猿辅导', industry: '教育科技', headquarters: '北京', scale: '500-1000人', stage: '成长期', logoColor: '#FFC107', logoInitial: '猿', branches: ['上海','深圳','杭州','成都','广州','武汉','南京'] },
  // 其他
  { name: 'Keep', industry: '运动健康', headquarters: '北京', scale: '150-500人', stage: '上市公司', logoColor: '#6200EE', logoInitial: 'K' },
  { name: '得到', industry: '知识付费', headquarters: '北京', scale: '50-150人', stage: '初创期', logoColor: '#FF6B35', logoInitial: '得' },
  { name: '泡泡玛特', industry: '潮玩零售', headquarters: '北京', scale: '500-1000人', stage: '上市公司', logoColor: '#E91E63', logoInitial: '泡', branches: ['上海','深圳','成都','广州','杭州','武汉','南京','西安','长沙','重庆','天津','苏州','合肥','郑州','青岛','大连','厦门','宁波','济南','沈阳','福州','昆明','哈尔滨','石家庄','太原','南宁','贵阳','南昌','长春','兰州','海口'] },
  { name: '汇川技术', industry: '工业自动化', headquarters: '深圳', scale: '500-1000人', stage: '上市公司', logoColor: '#2196F3', logoInitial: '汇', branches: ['苏州','上海','南京','杭州','成都','武汉'] },
  { name: '蓝月亮', industry: '日化', headquarters: '广州', scale: '1000人以上', stage: '上市公司', logoColor: '#1976D2', logoInitial: '蓝', branches: ['重庆','北京','上海'] },
  // 宁波/石家庄/太原/南宁/南昌/长春/哈尔滨/兰州/海口等三线城市本地企业
  { name: '宁波银行', industry: '金融', headquarters: '宁波', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '宁', branches: ['上海','杭州','深圳','北京','南京','苏州'] },
  { name: '以岭药业', industry: '医药', headquarters: '石家庄', scale: '1000人以上', stage: '上市公司', logoColor: '#4CAF50', logoInitial: '以', branches: ['北京'] },
  { name: '山西汾酒', industry: '白酒', headquarters: '太原', scale: '1000人以上', stage: '上市公司', logoColor: '#FFD700', logoInitial: '汾' },
  { name: '桂冠电力', industry: '电力', headquarters: '南宁', scale: '1000人以上', stage: '上市公司', logoColor: '#2196F3', logoInitial: '桂' },
  { name: '江中药业', industry: '医药', headquarters: '南昌', scale: '500-1000人', stage: '上市公司', logoColor: '#4CAF50', logoInitial: '江' },
  { name: '一汽解放', industry: '汽车', headquarters: '长春', scale: '1000人以上', stage: '上市公司', logoColor: '#CC0000', logoInitial: '一', branches: ['北京','上海','青岛'] },
  { name: '哈药集团', industry: '医药', headquarters: '哈尔滨', scale: '1000人以上', stage: '上市公司', logoColor: '#0066CC', logoInitial: '哈' },
  { name: '方大炭素', industry: '材料', headquarters: '兰州', scale: '500-1000人', stage: '上市公司', logoColor: '#FF6600', logoInitial: '方' },
  { name: '海南海药', industry: '医药', headquarters: '海口', scale: '500-1000人', stage: '上市公司', logoColor: '#2196F3', logoInitial: '海' },
  { name: '神州信息', industry: '金融科技', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '神', branches: ['上海','深圳','成都','武汉','西安','广州','南京','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '用友网络', industry: '企业软件', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#0066B3', logoInitial: '用', branches: ['上海','深圳','成都','武汉','广州','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '中软国际', industry: '软件服务', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '中', branches: ['上海','深圳','成都','武汉','广州','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '中国平安', industry: '金融', headquarters: '深圳', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '平', branches: ['北京','上海','成都','武汉','广州','杭州','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '中国银行', industry: '金融', headquarters: '北京', scale: '1000人以上', stage: '上市公司', logoColor: '#CC0000', logoInitial: '中', branches: ['上海','深圳','广州','杭州','成都','武汉','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','昆明','福州','沈阳','石家庄','太原','南宁','贵阳','南昌','长春','哈尔滨','兰州','海口'] },
  { name: '万达集团', industry: '商业地产', headquarters: '大连', scale: '1000人以上', stage: '上市公司', logoColor: '#003399', logoInitial: '万', branches: ['北京','上海','深圳','广州','成都','武汉','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','厦门','宁波','济南','昆明','福州','沈阳','哈尔滨'] },
  { name: '碧桂园', industry: '房地产', headquarters: '佛山', scale: '1000人以上', stage: '上市公司', logoColor: '#0066B3', logoInitial: '碧', branches: ['广州','深圳','北京','上海','武汉','成都','南京','长沙','重庆','郑州','青岛','济南','昆明','福州','沈阳','南宁','贵阳','南昌','长春','哈尔滨','海口'] },
]

const titleBases = ['HRBP', '高级HRBP', 'HRBP经理', 'HRBP主管', 'HRBP专家', '人力资源业务伙伴']
const titleSuffixes = [
  '大模型业务线', '商业化团队', '算法研究院', '产品中心', '技术中台', '市场部',
  '运营中心', '金融事业部', '客户成功部', '创新业务', '感知算法团队', '自动驾驶事业部',
  '新能源研发', '跨境电商', '智能制造', '医疗健康', '教育科技', '金融科技',
  '企业服务', '消费升级', '人力资源中心', '组织发展部', '人才招聘中心', '培训发展部',
  '薪酬绩效中心', '员工关系部', '企业文化部', '数字化HR', '海外HR', '战略HR'
]

const districts = {
  '上海': ['浦东新区', '徐汇区', '长宁区', '静安区', '黄浦区', '闵行区'],
  '北京': ['海淀区', '朝阳区', '昌平区', '西城区', '东城区', '丰台区'],
  '深圳': ['南山区', '福田区', '宝安区', '龙岗区', '罗湖区', '龙华区'],
  '杭州': ['余杭区', '滨江区', '西湖区', '上城区', '拱墅区', '萧山区'],
  '广州': ['天河区', '海珠区', '越秀区', '白云区', '黄埔区', '番禺区'],
  '苏州': ['工业园区', '虎丘区', '吴中区', '相城区', '姑苏区', '吴江区'],
  '东莞': ['长安镇', '南城街道', '东城街道', '松山湖', '莞城街道'],
  '成都': ['高新区', '武侯区', '锦江区', '青羊区', '金牛区', '天府新区'],
  '南京': ['建邺区', '鼓楼区', '玄武区', '秦淮区', '雨花台区', '江宁区'],
  '武汉': ['光谷', '武昌区', '洪山区', '江汉区', '汉阳区', '硚口区'],
  '西安': ['高新区', '雁塔区', '未央区', '碑林区', '莲湖区', '长安区'],
  '长沙': ['岳麓区', '雨花区', '天心区', '芙蓉区', '开福区', '望城区'],
  '重庆': ['渝北区', '江北区', '渝中区', '沙坪坝区', '九龙坡区', '南岸区'],
  '合肥': ['高新区', '蜀山区', '包河区', '庐阳区', '瑶海区', '经开区'],
  '天津': ['滨海新区', '南开区', '和平区', '河西区', '北辰区', '西青区'],
  '青岛': ['市南区', '市北区', '崂山区', '黄岛区', '城阳区', '李沧区'],
  '厦门': ['思明区', '湖里区', '集美区', '海沧区', '同安区', '翔安区'],
  '无锡': ['新吴区', '滨湖区', '梁溪区', '锡山区', '惠山区', '江阴市'],
  '济南': ['高新区', '历下区', '市中区', '槐荫区', '天桥区', '历城区'],
  '郑州': ['郑东新区', '金水区', '二七区', '中原区', '管城区', '高新区'],
  '沈阳': ['和平区', '沈河区', '大东区', '皇姑区', '铁西区', '浑南区'],
  '惠州': ['惠城区', '惠阳区', '大亚湾', '仲恺区'],
  '常州': ['新北区', '天宁区', '钟楼区', '武进区', '金坛区'],
  '福州': ['鼓楼区', '台江区', '仓山区', '晋安区', '马尾区'],
  '大连': ['高新区', '中山区', '沙河口区', '西岗区', '甘井子区'],
  '昆明': ['五华区', '盘龙区', '官渡区', '西山区', '呈贡区'],
  '贵阳': ['观山湖区', '云岩区', '南明区', '花溪区', '白云区'],
  '佛山': ['禅城区', '南海区', '顺德区', '三水区', '高明区'],
  '宁波': ['鄞州区', '海曙区', '江北区', '北仑区', '镇海区', '奉化区'],
  '温州': ['鹿城区', '龙湾区', '瓯海区', '洞头区', '瑞安市'],
  '泉州': ['鲤城区', '丰泽区', '洛江区', '泉港区', '晋江市'],
  '哈尔滨': ['南岗区', '道里区', '道外区', '香坊区', '松北区', '平房区'],
  '长春': ['朝阳区', '南关区', '宽城区', '二道区', '绿园区', '高新区'],
  '南昌': ['东湖区', '西湖区', '青云谱区', '青山湖区', '红谷滩区'],
  '石家庄': ['长安区', '桥西区', '新华区', '裕华区', '高新区', '藁城区'],
  '太原': ['小店区', '迎泽区', '杏花岭区', '尖草坪区', '万柏林区', '晋源区'],
  '南宁': ['青秀区', '兴宁区', '江南区', '西乡塘区', '良庆区', '邕宁区'],
  '兰州': ['城关区', '七里河区', '西固区', '安宁区', '红古区'],
  '海口': ['美兰区', '琼山区', '秀英区', '龙华区'],
  '珠海': ['香洲区', '斗门区', '金湾区', '横琴新区'],
  '中山': ['石岐区', '东区', '西区', '南区', '火炬开发区'],
  '烟台': ['芝罘区', '福山区', '牟平区', '莱山区', '开发区'],
  '潍坊': ['奎文区', '潍城区', '寒亭区', '坊子区', '高新区'],
  '徐州': ['云龙区', '鼓楼区', '泉山区', '铜山区', '贾汪区'],
  '洛阳': ['洛龙区', '涧西区', '西工区', '老城区', '瀍河区'],
  '嘉兴': ['南湖区', '秀洲区', '嘉善县', '海宁市'],
  '南通': ['崇川区', '通州区', '海门区', '如皋市'],
  '金华': ['婺城区', '金东区', '义乌市', '东阳市'],
  '汕头': ['金平区', '龙湖区', '濠江区', '潮阳区', '潮南区'],
  '唐山': ['路北区', '路南区', '开平区', '古冶区', '丰润区'],
  '银川': ['兴庆区', '金凤区', '西夏区', '永宁县'],
  '西宁': ['城中区', '城东区', '城西区', '城北区'],
  '乌鲁木齐': ['天山区', '沙依巴克区', '新市区', '水磨沟区'],
  '呼和浩特': ['新城区', '回民区', '玉泉区', '赛罕区'],
}

const experienceLevels = ['3-5年', '5-7年', '7-10年', '5-10年']
const tagPool = [
  'AI赛道', '期权激励', '核心业务', '管理岗', '高增长', 'WLB', '稳定',
  '出海', '技术HR', '硕博团队', '研究院', '商业化', '组织发展',
  '校招', '社招', '培训', '薪酬', '绩效', '员工关系', '雇主品牌',
  '数字化', '战略', '专家岗', '弹性工作', '免费三餐', '商业保险',
  '大厂', '互联网', '电商', '金融', '新能源', '硬科技'
]
const benefitPool = [
  '五险一金', '补充医疗', '年度体检', '带薪年假', '股票期权', '年终奖',
  '免费三餐', '弹性工作', '商业保险', '六险一金', '免费班车', '租房补贴',
  '节日福利', '项目奖金', '企业年金', '年度旅游', '员工宿舍', '通勤班车'
]

function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)]
}

function pickN(arr, n, rand) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, n)
}

// 全国所有城市列表（一二三线）
const allNationCities = Object.keys(districts)

function generateJobs(count = 300) {
  const rand = seededRandom(20260714)
  const jobs = []
  let idCounter = 1

  for (let i = 0; i < count; i++) {
    const company = pick(companyTemplates, rand)
    const source = pick(sources, rand)
    const base = pick(titleBases, rand)
    const suffix = pick(titleSuffixes, rand)
    const exp = pick(experienceLevels, rand)
    // 60% 概率用总部/分公司城市，40% 概率随机分配到全国各城市（覆盖三线城市）
    const companyCities = company.branches
      ? [company.headquarters, ...company.branches]
      : [company.headquarters]
    const jobCity = rand() < 0.6
      ? pick(companyCities, rand)
      : pick(allNationCities, rand)
    const cityDistricts = districts[jobCity] || ['']
    const district = pick(cityDistricts, rand)

    const expFactor = exp === '3-5年' ? 0.7 : exp === '5-7年' ? 1.0 : exp === '7-10年' ? 1.3 : 1.1
    // 三线城市薪资略低
    const cityFactor = ['北京','上海','深圳','广州','杭州'].includes(jobCity) ? 1.2
      : ['成都','武汉','南京','西安','长沙','重庆','苏州','天津','合肥','郑州','青岛','大连','厦门','宁波','济南','无锡','福州','昆明','沈阳','哈尔滨','长春','石家庄','太原','南昌','南宁','贵阳'].includes(jobCity) ? 1.0
      : 0.85
    const baseMin = Math.round((15 + rand() * 22) * expFactor * cityFactor)
    const baseMax = Math.round(baseMin + (8 + rand() * 18) * expFactor * cityFactor)
    const bonusMonths = 13 + Math.floor(rand() * 4)

    const hoursAgo = Math.floor(rand() * 72)
    const postedAt = new Date(Date.now() - hoursAgo * 3600000).toISOString()
    const crawledAt = new Date(Date.now() - Math.floor(rand() * 6) * 3600000).toISOString()
    const baseHeat = Math.round(300 + rand() * 900)
    const growth = Math.round(8 + rand() * 55)

    jobs.push({
      jobId: `j${idCounter++}`,
      title: `${base}（${suffix}）`,
      companyId: `${source}_${company.name}`,
      companyName: company.name,
      city: jobCity,
      district,
      experience: exp,
      education: rand() > 0.7 ? '硕士' : '本科',
      salaryRange: `${baseMin}-${baseMax}K·${bonusMonths}薪`,
      salaryMin: baseMin,
      salaryMax: baseMax,
      tags: pickN(tagPool, 3 + Math.floor(rand() * 2), rand),
      source,
      sourceUrl: sourceUrls[source] || '',
      postedAt,
      crawledAt,
      heat: baseHeat,
      growth,
      url: sourceUrls[source] || '',
      benefits: pickN(benefitPool, 4 + Math.floor(rand() * 3), rand),
    })
  }

  return jobs
}

function applyHeatAlgorithm(jobs) {
  const now = Date.now()
  return jobs.map(job => {
    const hoursOld = Math.max(0, (now - new Date(job.postedAt).getTime()) / 3600000)
    const recencyFactor = Math.exp(-hoursOld / 24)
    const salaryFactor = ((job.salaryMax + job.salaryMin) / 2) / 20
    const platformFactor = sourceWeights[job.source] || 1.0

    // 性价比算法: avgSalary / experienceYears * benefitFactor * companyFactor
    const expYears = parseFloat(job.experience) || 5
    const avgSalary = (job.salaryMin + job.salaryMax) / 2
    const benefitFactor = 1 + (job.benefits?.length || 0) * 0.03
    const valueScore = Math.round((avgSalary / expYears) * benefitFactor * 10) / 10

    return {
      ...job,
      heat: Math.max(50, Math.floor(job.heat * recencyFactor * salaryFactor * platformFactor)),
      growth: Math.max(1, Math.min(100, job.growth + Math.floor((Math.random() - 0.5) * 6))),
      valueScore,
    }
  }).sort((a, b) => b.heat - a.heat)
}

function addSalaryBreakdown(job) {
  return {
    ...job,
    salaryBreakdown: {
      p10: job.salaryMin,
      p25: Math.round(job.salaryMin + (job.salaryMax - job.salaryMin) * 0.2),
      p50: Math.round((job.salaryMin + job.salaryMax) / 2),
      p75: Math.round(job.salaryMin + (job.salaryMax - job.salaryMin) * 0.8),
      p90: Math.round(job.salaryMax + (job.salaryMax - job.salaryMin) * 0.2),
    },
  }
}

function getCompaniesData() {
  const map = new Map()
  for (const tpl of companyTemplates) {
    const name = tpl.name.trim()
    if (!map.has(name)) {
      map.set(name, {
        companyId: name,
        name,
        industry: tpl.industry,
        scale: tpl.scale || '1000人以上',
        stage: tpl.stage || '上市公司',
        founded: String(1990 + Math.floor(Math.random() * 30)),
        headquarters: tpl.headquarters,
        branches: tpl.branches || [],
        description: `${name}是中国${tpl.industry}领域的企业。`,
        logoColor: tpl.logoColor,
        logoInitial: tpl.logoInitial,
      })
    }
  }
  return Array.from(map.values())
}

function getCompanyById(companyId, companies) {
  const company = companies.find(c => c.companyId === companyId)
  if (company) return company
  const suffix = companyId.split('_')[1]
  return companies.find(c => c.name.includes(suffix)) || companies[0]
}

function getCompanyAnalysis(companyId) {
  const rand = seededRandom(companyId.split('').reduce((a, b) => a + b.charCodeAt(0), 0))
  const atmosphereScore = Math.floor(rand() * 20 + 70)
  const competitivenessScore = Math.floor(rand() * 20 + 65)
  const potentialScore = Math.floor(rand() * 20 + 70)
  const overall = Math.round((atmosphereScore + competitivenessScore + potentialScore) / 3)
  let grade = 'B'
  if (overall >= 90) grade = 'S'
  else if (overall >= 80) grade = 'A'
  else if (overall >= 70) grade = 'B'
  else if (overall >= 60) grade = 'C'

  return {
    companyId,
    atmosphereScore,
    competitivenessScore,
    potentialScore,
    overall,
    grade,
    strengths: ['团队氛围好', '发展空间大', '福利待遇优'],
    weaknesses: ['部分流程待优化', '行业竞争激烈'],
    radar: [
      { label: '文化开放度', value: Math.floor(rand() * 40 + 60), key: 'cultureOpenness' },
      { label: '晋升空间', value: Math.floor(rand() * 40 + 50), key: 'promotionSpace' },
      { label: '团队稳定', value: Math.floor(rand() * 40 + 55), key: 'teamStability' },
      { label: '领导力', value: Math.floor(rand() * 40 + 50), key: 'leadership' },
      { label: '加班强度', value: Math.floor(rand() * 30 + 40), key: 'overtimeIntensity' },
    ],
    competitors: [
      { companyId, metric: '薪资竞争力', value: Math.floor(rand() * 30 + 70), industryAvg: 65 },
      { companyId, metric: '发展潜力', value: Math.floor(rand() * 30 + 65), industryAvg: 60 },
      { companyId, metric: '团队氛围', value: Math.floor(rand() * 30 + 75), industryAvg: 70 },
      { companyId, metric: '稳定性', value: Math.floor(rand() * 30 + 60), industryAvg: 55 },
      { companyId, metric: '行业地位', value: Math.floor(rand() * 30 + 55), industryAvg: 50 },
    ],
    trend: ['2021', '2022', '2023', '2024', '2025'].map(year => {
      const revenue = Math.floor(rand() * 1000 + 500)
      const headcount = Math.floor(rand() * 100 + 50)
      return { companyId, year, revenue, headcount, openings: Math.floor(rand() * 50 + 10) }
    }),
  }
}

function main() {
  const distDir = path.resolve(__dirname, '../dist')
  const apiDir = path.join(distDir, 'api')
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true })
  }

  const jobs = applyHeatAlgorithm(generateJobs(1000)).map(addSalaryBreakdown)
  const companies = getCompaniesData()
  const lastCrawl = new Date().toISOString()

  // /api/jobs 的默认数据（热门排序，无筛选）
  fs.writeFileSync(path.join(apiDir, 'jobs.json'), JSON.stringify({
    data: jobs,
    total: jobs.length,
    page: 1,
    limit: jobs.length,
  }, null, 2))

  // /api/hot-jobs
  fs.writeFileSync(path.join(apiDir, 'hot-jobs.json'), JSON.stringify(jobs.slice(0, 6), null, 2))

  // /api/companies
  fs.writeFileSync(path.join(apiDir, 'companies.json'), JSON.stringify(companies, null, 2))

  // /api/companies/:id
  const companiesDir = path.join(apiDir, 'companies')
  if (!fs.existsSync(companiesDir)) fs.mkdirSync(companiesDir, { recursive: true })
  for (const company of companies) {
    const companyJobs = jobs.filter(j => j.companyName === company.name).slice(0, 10)
    fs.writeFileSync(path.join(companiesDir, `${encodeURIComponent(company.companyId)}.json`), JSON.stringify({
      ...company,
      jobs: companyJobs,
      analysis: getCompanyAnalysis(company.companyId),
    }, null, 2))
  }

  // /api/stats
  const sourceStats = {}
  const cityStats = {}
  const expStats = {}
  jobs.forEach(j => {
    sourceStats[j.source] = (sourceStats[j.source] || 0) + 1
    cityStats[j.city] = (cityStats[j.city] || 0) + 1
    expStats[j.experience] = (expStats[j.experience] || 0) + 1
  })
  fs.writeFileSync(path.join(apiDir, 'stats.json'), JSON.stringify({
    sourceStats: Object.entries(sourceStats).map(([source, count]) => ({ source, count })),
    cityStats: Object.entries(cityStats).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count),
    expStats: Object.entries(expStats).map(([experience, count]) => ({ experience, count })),
  }, null, 2))

  // /api/status
  fs.writeFileSync(path.join(apiDir, 'status.json'), JSON.stringify({
    running: false,
    lastCrawl,
    todayNew: 5,
    totalJobs: jobs.length,
    platforms: sources.length,
    timestamp: new Date().toISOString(),
  }, null, 2))

  // /api/jobs/:id
  const jobsDir = path.join(apiDir, 'jobs')
  if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true })
  for (const job of jobs) {
    fs.writeFileSync(path.join(jobsDir, `${job.jobId}.json`), JSON.stringify(job, null, 2))
  }

  console.log(`静态 API 生成完成：${jobs.length} 个职位，${companies.length} 家公司`)
}

main()
