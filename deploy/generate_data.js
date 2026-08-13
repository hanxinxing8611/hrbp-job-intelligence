const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data_temp');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const companyTemplates = [
  { name: '阿里巴巴', industry: '互联网', scale: '10000人以上', stage: '上市公司', founded: '1999', headquarters: '杭州', logoColor: '#FF5A00', logoInitial: '阿' },
  { name: '腾讯', industry: '互联网', scale: '10000人以上', stage: '上市公司', founded: '1998', headquarters: '深圳', logoColor: '#00A8FF', logoInitial: '腾' },
  { name: '字节跳动', industry: '互联网', scale: '10000人以上', stage: '上市公司', founded: '2012', headquarters: '北京', logoColor: '#000000', logoInitial: '字' },
  { name: '美团', industry: 'O2O', scale: '10000人以上', stage: '上市公司', founded: '2010', headquarters: '北京', logoColor: '#FFD100', logoInitial: '美' },
  { name: '京东', industry: '电商', scale: '10000人以上', stage: '上市公司', founded: '1998', headquarters: '北京', logoColor: '#E4393C', logoInitial: '京' },
  { name: '网易', industry: '互联网', scale: '10000人以上', stage: '上市公司', founded: '1997', headquarters: '杭州', logoColor: '#1677FF', logoInitial: '网' },
  { name: '百度', industry: '互联网', scale: '10000人以上', stage: '上市公司', founded: '2000', headquarters: '北京', logoColor: '#2932E1', logoInitial: '百' },
  { name: '快手', industry: '短视频', scale: '10000人以上', stage: '上市公司', founded: '2011', headquarters: '北京', logoColor: '#FF4906', logoInitial: '快' },
  { name: '小米', industry: '智能硬件', scale: '10000人以上', stage: '上市公司', founded: '2010', headquarters: '北京', logoColor: '#FF6700', logoInitial: '小' },
  { name: '华为', industry: '通信', scale: '10000人以上', stage: '未上市', founded: '1987', headquarters: '深圳', logoColor: '#C7000B', logoInitial: '华' },
  { name: 'OPPO', industry: '消费电子', scale: '10000人以上', stage: '未上市', founded: '2004', headquarters: '东莞', logoColor: '#00B44A', logoInitial: 'O' },
  { name: 'vivo', industry: '消费电子', scale: '10000人以上', stage: '未上市', founded: '2009', headquarters: '东莞', logoColor: '#415FFF', logoInitial: 'v' },
  { name: '拼多多', industry: '电商', scale: '10000人以上', stage: '上市公司', founded: '2015', headquarters: '上海', logoColor: '#E02E24', logoInitial: '拼' },
  { name: '哔哩哔哩', industry: '视频', scale: '5000-10000人', stage: '上市公司', founded: '2009', headquarters: '上海', logoColor: '#FB7299', logoInitial: 'B' },
  { name: '小红书', industry: '社区', scale: '5000-10000人', stage: '未上市', founded: '2013', headquarters: '上海', logoColor: '#FE2C55', logoInitial: '红' },
  { name: '蚂蚁集团', industry: '金融科技', scale: '10000人以上', stage: '未上市', founded: '2014', headquarters: '杭州', logoColor: '#1677FF', logoInitial: '蚂' },
  { name: '理想汽车', industry: '新能源汽车', scale: '10000人以上', stage: '上市公司', founded: '2015', headquarters: '北京', logoColor: '#333333', logoInitial: '理' },
  { name: '蔚来汽车', industry: '新能源汽车', scale: '10000人以上', stage: '上市公司', founded: '2014', headquarters: '上海', logoColor: '#00B2FF', logoInitial: '蔚' },
  { name: '小鹏汽车', industry: '新能源汽车', scale: '5000-10000人', stage: '上市公司', founded: '2014', headquarters: '广州', logoColor: '#2D8CF0', logoInitial: '小' },
  { name: '招商银行', industry: '金融', scale: '10000人以上', stage: '上市公司', founded: '1987', headquarters: '深圳', logoColor: '#C8000A', logoInitial: '招' },
  { name: '平安集团', industry: '金融', scale: '10000人以上', stage: '上市公司', founded: '1988', headquarters: '深圳', logoColor: '#FF6600', logoInitial: '平' },
  { name: '中金公司', industry: '金融', scale: '5000-10000人', stage: '上市公司', founded: '1995', headquarters: '北京', logoColor: '#B8860B', logoInitial: '中' },
  { name: '中信证券', industry: '金融', scale: '10000人以上', stage: '上市公司', founded: '1995', headquarters: '深圳', logoColor: '#DC143C', logoInitial: '信' },
  { name: '普华永道', industry: '咨询', scale: '10000人以上', stage: '外企', founded: '1998', headquarters: '上海', logoColor: '#FFB900', logoInitial: '普' },
  { name: '德勤', industry: '咨询', scale: '10000人以上', stage: '外企', founded: '1845', headquarters: '上海', logoColor: '#000000', logoInitial: '德' },
  { name: '麦肯锡', industry: '咨询', scale: '10000人以上', stage: '外企', founded: '1926', headquarters: '上海', logoColor: '#0A1E3C', logoInitial: '麦' },
  { name: '波士顿咨询', industry: '咨询', scale: '5000-10000人', stage: '外企', founded: '1963', headquarters: '上海', logoColor: '#002D72', logoInitial: '波' },
  { name: '美世咨询', industry: '人力资源咨询', scale: '5000-10000人', stage: '外企', founded: '1937', headquarters: '上海', logoColor: '#0077C8', logoInitial: '美' },
  { name: '中智', industry: '人力资源服务', scale: '10000人以上', stage: '国企', founded: '1987', headquarters: '北京', logoColor: '#003399', logoInitial: '中' },
  { name: '北京外企', industry: '人力资源服务', scale: '10000人以上', stage: '国企', founded: '1979', headquarters: '北京', logoColor: '#0066CC', logoInitial: '外' },
];

const sources = ['BOSS直聘', '智联招聘', '前程无忧', '猎聘', '拉勾'];
const sourceWeights = { 'BOSS直聘': 1.25, '智联招聘': 1.0, '前程无忧': 0.9, '猎聘': 1.1, '拉勾': 0.85 };

const cities = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州',
  '重庆', '天津', '长沙', '青岛', '郑州', '东莞', '宁波', '佛山', '合肥', '大连',
  '沈阳', '无锡', '厦门', '福州', '哈尔滨', '济南', '石家庄', '长春', '昆明', '南宁',
  '常州', '温州', '徐州', '南通', '泉州', '绍兴', '嘉兴', '台州', '金华', '惠州',
  '珠海', '中山', '江门', '汕头', '佛山', '肇庆', '湛江', '揭阳', '清远', '阳江',
  '兰州', '太原', '贵阳', '海口', '乌鲁木齐', '呼和浩特', '银川', '西宁', '拉萨',
];

const citySalaryFactor = {
  '北京': 1.15, '上海': 1.2, '广州': 0.95, '深圳': 1.15, '杭州': 1.05, '成都': 0.8,
  '南京': 0.85, '武汉': 0.75, '西安': 0.7, '苏州': 0.85, '重庆': 0.72, '天津': 0.85,
  '长沙': 0.7, '青岛': 0.8, '郑州': 0.72, '东莞': 0.78, '宁波': 0.85, '佛山': 0.8,
  '合肥': 0.75, '大连': 0.78, '沈阳': 0.75, '无锡': 0.85, '厦门': 0.85, '福州': 0.75,
  '哈尔滨': 0.7, '济南': 0.8, '石家庄': 0.7, '长春': 0.68, '昆明': 0.72, '南宁': 0.68,
  '常州': 0.8, '温州': 0.78, '徐州': 0.7, '南通': 0.8, '泉州': 0.72, '绍兴': 0.8,
  '嘉兴': 0.8, '台州': 0.75, '金华': 0.75, '惠州': 0.78, '珠海': 0.88, '中山': 0.78,
  '江门': 0.72, '汕头': 0.7, '肇庆': 0.68, '湛江': 0.65, '揭阳': 0.62, '清远': 0.65,
  '阳江': 0.62, '兰州': 0.65, '太原': 0.7, '贵阳': 0.65, '海口': 0.7, '乌鲁木齐': 0.68,
  '呼和浩特': 0.65, '银川': 0.62, '西宁': 0.6, '拉萨': 0.58,
};

const districts = {
  '北京': ['海淀区', '朝阳区', '西城区', '东城区', '丰台区', '通州区', '昌平区', '顺义区', '大兴区', '房山区'],
  '上海': ['浦东新区', '黄浦区', '徐汇区', '静安区', '长宁区', '杨浦区', '闵行区', '宝山区', '嘉定区', '松江区'],
  '广州': ['天河区', '海珠区', '越秀区', '番禺区', '白云区', '黄埔区', '荔湾区', '花都区', '南沙区', '增城区'],
  '深圳': ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '龙华区', '光明区', '坪山区', '盐田区', '大鹏新区'],
  '杭州': ['余杭区', '西湖区', '滨江区', '上城区', '拱墅区', '萧山区', '临平区', '钱塘区', '富阳区', '临安区'],
  '成都': ['高新区', '武侯区', '锦江区', '青羊区', '成华区', '天府新区', '双流区', '郫都区', '新都区', '温江区'],
  '南京': ['雨花台区', '建邺区', '鼓楼区', '玄武区', '江宁区', '秦淮区', '栖霞区', '浦口区', '六合区', '溧水区'],
  '武汉': ['洪山区', '东湖高新区', '武昌区', '江汉区', '硚口区', '江岸区', '汉阳区', '青山区', '江夏区', '东西湖区'],
  '西安': ['雁塔区', '高新区', '未央区', '碑林区', '长安区', '莲湖区', '新城区', '灞桥区', '临潼区', '阎良区'],
  '苏州': ['工业园区', '虎丘区', '吴中区', '相城区', '姑苏区', '吴江区', '昆山市', '太仓市', '常熟市', '张家港市'],
  '重庆': ['渝中区', '江北区', '南岸区', '九龙坡区', '两江新区', '渝北区', '沙坪坝区', '巴南区', '大渡口区', '北碚区'],
  '天津': ['滨海新区', '和平区', '河西区', '南开区', '河东区', '红桥区', '东丽区', '西青区', '北辰区', '津南区'],
  '长沙': ['岳麓区', '芙蓉区', '天心区', '开福区', '雨花区', '望城区', '长沙县', '宁乡市', '浏阳市'],
  '青岛': ['市南区', '市北区', '李沧区', '崂山区', '城阳区', '黄岛区', '即墨区', '胶州市', '平度市', '莱西市'],
  '郑州': ['金水区', '中原区', '二七区', '管城回族区', '惠济区', '高新区', '经开区', '郑东新区', '航空港区'],
  '东莞': ['南城区', '东城区', '松山湖', '长安镇', '虎门镇', '厚街镇', '大朗镇', '塘厦镇', '常平镇', '石龙镇'],
  '宁波': ['海曙区', '江北区', '北仑区', '镇海区', '鄞州区', '奉化区', '余姚市', '慈溪市', '象山县', '宁海县'],
  '佛山': ['禅城区', '南海区', '顺德区', '高明区', '三水区'],
  '合肥': ['蜀山区', '高新区', '包河区', '庐阳区', '经开区', '瑶海区', '新站区', '肥西县', '肥东县', '长丰县'],
  '大连': ['中山区', '西岗区', '沙河口区', '甘井子区', '旅顺口区', '金州区', '普兰店区', '瓦房店市', '庄河市'],
  '沈阳': ['和平区', '沈河区', '大东区', '皇姑区', '铁西区', '浑南区', '于洪区', '沈北新区', '苏家屯区'],
  '无锡': ['梁溪区', '滨湖区', '新吴区', '锡山区', '惠山区', '江阴市', '宜兴市'],
  '厦门': ['思明区', '湖里区', '集美区', '海沧区', '同安区', '翔安区'],
  '福州': ['鼓楼区', '台江区', '仓山区', '晋安区', '马尾区', '长乐区', '福清市', '闽侯县'],
  '哈尔滨': ['道里区', '南岗区', '道外区', '香坊区', '平房区', '松北区', '呼兰区', '阿城区'],
  '济南': ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区', '高新区'],
  '石家庄': ['长安区', '桥西区', '新华区', '裕华区', '井陉矿区', '藁城区', '鹿泉区', '栾城区'],
  '长春': ['朝阳区', '南关区', '宽城区', '二道区', '绿园区', '双阳区', '九台区'],
  '昆明': ['五华区', '盘龙区', '官渡区', '西山区', '呈贡区', '晋宁区'],
  '南宁': ['青秀区', '兴宁区', '江南区', '西乡塘区', '良庆区', '邕宁区'],
  '常州': ['新北区', '天宁区', '钟楼区', '武进区', '金坛区', '溧阳市'],
  '温州': ['鹿城区', '龙湾区', '瓯海区', '洞头区', '乐清市', '瑞安市', '永嘉县'],
  '徐州': ['云龙区', '鼓楼区', '泉山区', '贾汪区', '铜山区', '邳州市', '新沂市'],
  '南通': ['崇川区', '通州区', '海门区', '启东市', '如皋市', '海安市', '如东县'],
  '泉州': ['丰泽区', '鲤城区', '洛江区', '泉港区', '晋江市', '石狮市', '南安市'],
  '绍兴': ['越城区', '柯桥区', '上虞区', '诸暨市', '嵊州市', '新昌县'],
  '嘉兴': ['南湖区', '秀洲区', '海宁市', '平湖市', '桐乡市', '嘉善县', '海盐县'],
  '台州': ['椒江区', '黄岩区', '路桥区', '温岭市', '临海市', '玉环市'],
  '金华': ['婺城区', '金东区', '兰溪市', '义乌市', '东阳市', '永康市'],
  '惠州': ['惠城区', '惠阳区', '博罗县', '惠东县', '龙门县', '大亚湾区'],
  '珠海': ['香洲区', '斗门区', '金湾区', '横琴新区'],
  '中山': ['石岐区', '东区', '西区', '南区', '五桂山区', '火炬开发区'],
  '江门': ['蓬江区', '江海区', '新会区', '台山市', '开平市', '鹤山市', '恩平市'],
  '汕头': ['金平区', '龙湖区', '濠江区', '潮阳区', '潮南区', '澄海区', '南澳县'],
  '肇庆': ['端州区', '鼎湖区', '高要区', '四会市', '广宁县', '德庆县', '封开县'],
  '湛江': ['赤坎区', '霞山区', '坡头区', '麻章区', '廉江市', '雷州市', '吴川市'],
  '揭阳': ['榕城区', '揭东区', '揭西县', '惠来县', '普宁市'],
  '清远': ['清城区', '清新区', '英德市', '连州市', '佛冈县', '阳山县'],
  '阳江': ['江城区', '阳东区', '阳西县', '阳春市'],
  '兰州': ['城关区', '七里河区', '西固区', '安宁区', '红古区'],
  '太原': ['杏花岭区', '迎泽区', '万柏林区', '小店区', '尖草坪区', '晋源区'],
  '贵阳': ['云岩区', '南明区', '花溪区', '乌当区', '白云区', '观山湖区'],
  '海口': ['秀英区', '龙华区', '琼山区', '美兰区'],
  '乌鲁木齐': ['天山区', '沙依巴克区', '新市区', '水磨沟区', '头屯河区', '米东区'],
  '呼和浩特': ['新城区', '回民区', '玉泉区', '赛罕区'],
  '银川': ['兴庆区', '金凤区', '西夏区'],
  '西宁': ['城东区', '城中区', '城西区', '城北区'],
  '拉萨': ['城关区'],
};

const jobTitles = [
  { title: 'HRBP', level: 1, baseSalary: 18 },
  { title: 'HRBP专员', level: 1, baseSalary: 16 },
  { title: '人力资源业务伙伴', level: 1, baseSalary: 17 },
  { title: 'HRBP主管', level: 2, baseSalary: 25 },
  { title: 'HRBP经理', level: 3, baseSalary: 35 },
  { title: '高级HRBP', level: 3, baseSalary: 38 },
  { title: 'HRBP专家', level: 3, baseSalary: 40 },
  { title: 'HRBP高级经理', level: 4, baseSalary: 50 },
  { title: 'HRBP总监', level: 5, baseSalary: 65 },
  { title: '高级HRBP专家', level: 4, baseSalary: 52 },
  { title: 'HRBP负责人', level: 5, baseSalary: 70 },
  { title: '区域HRBP', level: 2, baseSalary: 28 },
  { title: '业务HRBP', level: 2, baseSalary: 26 },
  { title: '技术HRBP', level: 3, baseSalary: 36 },
  { title: '产品HRBP', level: 3, baseSalary: 34 },
  { title: '运营HRBP', level: 2, baseSalary: 28 },
  { title: '销售HRBP', level: 2, baseSalary: 27 },
  { title: '研发HRBP', level: 3, baseSalary: 38 },
  { title: '算法HRBP', level: 4, baseSalary: 45 },
  { title: 'HRBP（管培生）', level: 0, baseSalary: 12 },
];

const departments = [
  '技术研发中心', '产品中心', '运营中心', '销售中心', '市场部', '人力资源中心',
  '财务部', '法务部', '战略发展部', '创新业务部', '金融事业部', '医疗健康事业部',
  '教育科技事业部', '智能制造事业部', '自动驾驶事业部', '算法研究院',
  '员工关系部', '薪酬绩效中心', '组织发展部', '人才发展部', '招聘中心',
  '客户成功部', '供应链中心', '物流事业部', '云计算事业部', '人工智能实验室',
  '游戏事业部', '内容生态部', '电商事业部', '本地生活事业部', '企业服务部',
];

const experiences = ['1-3年', '3-5年', '5-10年', '5-7年', '7-10年', '10年以上', '应届', '不限'];
const expMinYears = { '1-3年': 1, '3-5年': 3, '5-10年': 5, '5-7年': 5, '7-10年': 7, '10年以上': 10, '应届': 0, '不限': 0 };
const educations = ['大专', '本科', '硕士', '博士'];

const tagPools = {
  common: ['五险一金', '年终奖', '带薪年假', '节日福利', '定期体检', '员工旅游', '餐补', '交通补贴', '住房补贴', '加班补助', '弹性工作', '不加班', '双休', '扁平化管理', '晋升空间大', '氛围好', '大牛带队', '成长快', '下午茶', '零食下午茶', '健身房', '团建活动'],
  internet: ['大厂', '互联网', '高速发展', '上市背景', '独角兽', '创业公司', 'A轮', 'B轮', 'C轮', 'D轮及以上', '股票期权', '股权激励', '14薪', '15薪', '16薪', '技术氛围好'],
  finance: ['金融', '银行', '证券', '基金', '保险', '投行', '资管', '风控', '合规', '稳定', '国企', '央企'],
  consulting: ['咨询', '外企', '国际化', '快节奏', '高压力', '高成长', '专业服务', '四大背景'],
  auto: ['新能源', '智能汽车', '自动驾驶', '造车新势力', '硬科技', '制造业', '供应链'],
  hardware: ['硬件', '芯片', '半导体', '通信', '消费电子', '制造业', '供应链'],
};

const benefitPools = [
  ['五险一金', '年终奖', '带薪年假', '节日福利', '定期体检'],
  ['五险一金', '股票期权', '年终奖', '弹性工作', '健身房', '免费三餐'],
  ['五险一金', '14薪', '带薪年假', '餐补', '交通补贴', '住房补贴'],
  ['五险一金', '15薪', '不加班', '双休', '弹性工作', '节日福利'],
  ['五险一金', '股权激励', '高速发展', '大牛带队', '晋升空间大', '成长快'],
  ['五险一金', '年终奖', '员工旅游', '定期体检', '下午茶', '零食'],
];

function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }
function randRange(min, max, rand) { return Math.floor(rand() * (max - min + 1)) + min; }

function generateJobs(count = 5000, seed = Date.now()) {
  const rand = seededRandom(seed);
  const jobs = [];
  let idCounter = 1;
  for (let i = 0; i < count; i++) {
    const company = pick(companyTemplates, rand);
    const source = pick(sources, rand);
    const titleInfo = pick(jobTitles, rand);
    const city = pick(cities, rand);
    const district = pick(districts[city] || ['市中心'], rand);
    const dept = pick(departments, rand);
    const education = pick(educations, rand);
    const expPool = titleInfo.level <= 1 ? ['1-3年', '3-5年', '应届', '不限']
      : titleInfo.level <= 2 ? ['3-5年', '5-7年', '5-10年']
      : titleInfo.level <= 3 ? ['3-5年', '5-7年', '5-10年', '7-10年']
      : ['5-10年', '7-10年', '10年以上'];
    const experience = pick(expPool, rand);
    const expFactor = 1 + expMinYears[experience] * 0.08;
    const cityFactor = citySalaryFactor[city] || 1;
    const companyFactor = company.stage === '上市公司' ? 1.1 : company.stage === '外企' ? 1.15 : company.stage === '国企' ? 0.9 : 1;
    const baseMin = Math.round(titleInfo.baseSalary * 0.7 * expFactor * cityFactor * companyFactor);
    const baseMax = Math.round(titleInfo.baseSalary * 1.3 * expFactor * cityFactor * companyFactor);
    const salaryMin = Math.max(10, baseMin + randRange(-2, 3, rand));
    const salaryMax = Math.max(salaryMin + 5, baseMax + randRange(-2, 5, rand));
    const tagPool = [...tagPools.common, ...(
      company.industry === '互联网' ? tagPools.internet :
      ['金融', '银行', '证券'].includes(company.industry) ? tagPools.finance :
      company.industry === '咨询' || company.industry === '人力资源咨询' ? tagPools.consulting :
      ['新能源汽车', '智能硬件'].includes(company.industry) ? tagPools.auto :
      ['通信', '消费电子'].includes(company.industry) ? tagPools.hardware :
      tagPools.internet
    )];
    const numTags = randRange(3, 6, rand);
    const tags = [];
    while (tags.length < numTags) {
      const t = pick(tagPool, rand);
      if (!tags.includes(t)) tags.push(t);
    }
    const benefits = pick(benefitPools, rand).slice(0, randRange(3, 6, rand));
    const postedDaysAgo = randRange(0, 30, rand);
    const postedAt = new Date(Date.now() - postedDaysAgo * 86400000 - randRange(0, 86400000, rand)).toISOString();
    const baseHeat = Math.round(
      (50 + (salaryMin + salaryMax) / 2 * 2) *
      sourceWeights[source] *
      cityFactor *
      (1 + titleInfo.level * 0.3) *
      (company.stage === '上市公司' ? 1.1 : 1)
    );
    jobs.push({
      jobId: `j${idCounter++}`,
      title: `${titleInfo.title}（${dept}）`,
      companyId: `${source}_${company.name}`,
      companyName: company.name,
      city: city,
      district: district,
      experience: experience,
      education: education,
      salaryRange: `${salaryMin}-${salaryMax}K`,
      salaryMin: salaryMin,
      salaryMax: salaryMax,
      tags: tags,
      source: source,
      postedAt: postedAt,
      heat: baseHeat,
      growth: randRange(5, 50, rand),
      url: `https://example.com/job/j${idCounter}`,
      benefits: benefits,
      department: dept,
      jobType: '全职',
      description: `负责${dept}的人力资源业务伙伴工作，包括招聘、员工关系、组织发展、绩效管理等。`,
    });
  }
  return jobs;
}

function applyHeatAlgorithm(jobs) {
  const now = Date.now();
  return jobs.map(job => {
    const hoursOld = (now - new Date(job.postedAt).getTime()) / 3600000;
    const recencyFactor = Math.exp(-hoursOld / 48);
    const salaryFactor = (job.salaryMin + job.salaryMax) / 2 / 25;
    const platformFactor = sourceWeights[job.source] || 1.0;
    const cityFactor = citySalaryFactor[job.city] || 1;
    const baseHeat = Math.round(
      (job.heat * 0.6 + 100 * salaryFactor) *
      recencyFactor *
      platformFactor *
      (0.8 + cityFactor * 0.2)
    );
    const growth = Math.max(1, Math.min(100, Math.round(
      hoursOld < 6 ? 40 + Math.random() * 40 :
      hoursOld < 24 ? 20 + Math.random() * 30 :
      hoursOld < 72 ? 10 + Math.random() * 20 :
      2 + Math.random() * 10
    )));
    return {
      ...job,
      heat: Math.max(50, baseHeat),
      growth,
    };
  }).sort((a, b) => b.heat - a.heat);
}

console.log('生成5000条职位数据...');
const jobs = applyHeatAlgorithm(generateJobs(5000, Date.now()));
console.log('生成公司数据...');
const companyMap = {};
for (const job of jobs) {
  const template = companyTemplates.find(c => c.name === job.companyName);
  if (!template) continue;
  const key = job.companyId;
  if (!companyMap[key]) {
    companyMap[key] = {
      companyId: job.companyId,
      name: template.name,
      industry: template.industry,
      scale: template.scale,
      stage: template.stage,
      founded: template.founded,
      headquarters: template.headquarters,
      description: `${template.name}是一家${template.stage === '上市公司' ? '上市' : template.stage === '外企' ? '外资' : template.stage === '国企' ? '国有' : '知名'}企业，专注于${template.industry}领域。`,
      logoColor: template.logoColor,
      logoInitial: template.logoInitial,
      jobCount: 0,
      avgSalary: 0,
      totalSalary: 0,
      atmosphereScore: 0,
      competitivenessScore: 0,
      growthScore: 0,
      atmosphereReviews: [],
      tags: [],
    };
  }
  companyMap[key].jobCount++;
  companyMap[key].totalSalary += (job.salaryMin + job.salaryMax) / 2;
}
const companies = Object.values(companyMap).map(c => {
  c.avgSalary = Math.round(c.totalSalary / c.jobCount);
  c.atmosphereScore = Math.round((3.8 + Math.random() * 1.2) * 10) / 10;
  c.competitivenessScore = Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
  c.growthScore = Math.round((3.6 + Math.random() * 1.4) * 10) / 10;
  c.tags = ['成长空间大', '氛围好', '薪资高', '福利好', '晋升透明'];
  delete c.totalSalary;
  return c;
});

const data = {
  jobs,
  companies,
  lastCrawl: new Date().toISOString(),
  todayNew: Math.floor(jobs.length * 0.15),
  updatedAt: new Date().toISOString(),
};

fs.writeFileSync(path.join(DATA_DIR, 'jobs.json'), JSON.stringify(data));
console.log(`数据已保存: ${jobs.length} 条职位，${companies.length} 家公司`);