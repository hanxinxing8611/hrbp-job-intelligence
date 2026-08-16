// 从真实抓取的 HRBP 职位数据生成静态 JSON API 文件
// 运行：node scripts/build-real-api.js
// 数据来源：BOSS直聘、智联招聘、前程无忧、猎聘

const fs = require('fs')
const path = require('path')

// ============================================================
// 平台权重与来源映射
// ============================================================
const sourceWeights = {
  'BOSS直聘': 1.2,
  '智联招聘': 1.0,
  '前程无忧': 0.8,
  '猎聘': 1.1,
}

// ============================================================
// 公司所属行业映射
// ============================================================
const companyIndustryMap = {
  // BOSS直聘
  '徐州煜之伟电子科技': '电子',
  '好未来': '教育科技',
  '辛米尔': '互联网',
  '行云集团': '互联网',
  '加和科技': '互联网',
  '瑞声科技': '消费电子',
  '领慧立芯': '半导体',
  '东莞领益精密制造': '精密制造',
  '道通科技': '智能硬件',
  '腾讯互娱': '互联网/游戏',
  '腾讯': '互联网',
  '北京易森动力': '企业服务',
  '阿里巴巴': '互联网',
  '盒马鲜生': '新零售',
  '优矩互动': '互联网',
  '赛轮集团': '轮胎制造',
  '海信视像': '家电',
  '乾程科技': '智能硬件',
  '迈金科技': '智能硬件',
  '优度集团': '综合服务',
  '英科医疗': '医疗器械',
  '海微科技': '科技',
  // 智联招聘
  '万宝盛华': '人力资源服务',
  '河南嗨雅企业管理': '企业管理',
  '爱谱华顿': '线缆/科技',
  '天成自控': '汽车零部件',
  '山东纽扣家和教育': '教育',
  '广州森大贸易': '国际贸易',
  '广州凯钥国际贸易': '国际贸易',
  '新东方': '教育科技',
  '鑫荣懋集团': '食品/农业',
  '北京伊顿国际': '教育',
  '甘李药业': '医药',
  '北京华联商厦': '零售',
  '明济生物制药': '医药',
  '上海任仕达': '人力资源服务',
  '极苏清火': '互联网',
  '安徽英贝健贸易': '贸易',
  '中安元生': '科技',
  '新毅东': '互联网',
  '苏州安美润滑': '化工',
  '金宇生物': '医药',
  '天津源优学教育': '教育',
  '中创天津': '科技',
  '天津鼎维固': '建筑工程',
  '正荣物业': '物业管理',
  '北京华德创业': '科技',
  '牧原食品': '食品/农业',
  '浙江爱旭太阳能': '新能源',
  // 前程无忧
  '天逸财金': '金融科技',
  '雅科贝思精密机电': '精密制造',
  '上海港汇房地产': '房地产',
  '上海博恩登特科技': '医疗科技',
  '北方华创': '半导体设备',
  '成都卡诺普机器人': '机器人',
  // 猎聘
  '维信诺': '半导体显示',
  '云南宇泽新能源': '新能源',
  '法雷奥': '汽车零部件',
  '新安集团': '化工',
  '神州数码': 'IT服务',
  '海柔创新': '物流科技',
  '远景科技集团': '新能源',
  '小鹏集团': '新能源汽车',
  '大丰实业': '舞台设备',
  '造物时代': '互联网',
  '美世留学': '教育',
  '公牛集团': '电气',
  '济南': '企业服务',
  '赛力斯集团': '新能源汽车',
  '东风汽车': '汽车',
  '云绎智创': '科技',
  '海思科医药': '医药',
  '茶百道': '餐饮',
  '浙江柚香谷': '食品',
  '康诺亚生物医药': '医药',
  '万声信息': '服务外包',
  '美团': '本地生活',
  '佰维存储': '半导体',
  '一智科技': '科技',
  '苏州睿新微系统': '半导体',
  '字节跳动': '互联网',
  '大族激光': '激光设备',
  '立联信天津': '电子',
  '中海商业': '商业地产',
  '丽滋卡尔医院': '医疗',
  '鑫斛药房': '医药零售',
  '百利天恒': '医药',
  '特斯拉中国': '新能源汽车',
}

// ============================================================
// 真实抓取的 HRBP 职位数据
// 字段：title, company, city, district, salary, experience, education, source, sourceUrl
// ============================================================
const realJobs = [
  // ===== BOSS直聘 (32条) =====
  { title: 'vivo管培生（HRBP方向）', company: '徐州煜之伟电子科技', city: '潍坊', district: '潍城区', salary: '4-6K', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/6322f24bb98b79e20nV-2Nm0FlRX.html' },
  { title: '青藤计划-人力资源管培生（COE/HRBP方向）', company: '好未来', city: '北京', district: '昌平区', salary: '10-13K·14薪', experience: '在校/应届', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/b9aa1e810a3ae46c0nJ729m_FFVU.html' },
  { title: 'HRBP（研发方向）', company: '辛米尔', city: '上海', district: '闵行区', salary: '15-25K', experience: '5-10年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/b27c5aa154dd5a410nBy29m9E1RT.html' },
  { title: 'HRBP（AI方向）', company: '行云集团', city: '深圳', district: '南山区', salary: '15-30K', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/464e5687322cff8f0nJ63Ny8GVVZ.html' },
  { title: 'HRBP（AI方向）', company: '加和科技', city: '北京', district: '朝阳区', salary: '15-20K', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/60a2cc4ffaddcaa00nd83tS1ElpQ.html' },
  { title: 'HRBP（OD方向）', company: '瑞声科技', city: '常州', district: '武进区', salary: '18-25K', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/76be1b738517a7c00nBz2ty9GFZT.html' },
  { title: 'HRBP（SSC方向）', company: '领慧立芯', city: '苏州', district: '', salary: '12-20K·13薪', experience: '5-10年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/a6272ec81af22f6d0ndz2t-6EFdW.html' },
  { title: 'HRBP（OD方向）', company: '东莞领益精密制造', city: '盐城', district: '', salary: '14-18K', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/4b9b5f6c5451cc5003J429S7GFNX.html' },
  { title: 'HRBP管理（AI方向）', company: '道通科技', city: '深圳', district: '南山区', salary: '50-70K', experience: '5-10年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/ad629ce3be16110e03Fz2Ni7E1JQ.html' },
  { title: 'HRBP（腾讯全资子公司）', company: '腾讯互娱', city: '上海', district: '徐汇区', salary: '14-20K·14薪', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/d2b1c620e5995e7b03183dy8EFVY.html' },
  { title: 'HRBP-云智', company: '腾讯', city: '西安', district: '雁塔区', salary: '10-15K·14薪', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/996f403ecccbc3350nd63tq8FlNT.html' },
  { title: 'HRBP-职能线(深圳)', company: '腾讯', city: '深圳', district: '南山区', salary: '25-50K·15薪', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/c492f137d6dcec2e0ndy2Ni8EFJS.html' },
  { title: 'HRBP', company: '腾讯', city: '北京', district: '海淀区', salary: '15-25K·16薪', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/3a39c5c67f17f2c10nR_2t-1GFpU.html' },
  { title: '腾讯元宝HRBP', company: '腾讯', city: '深圳', district: '', salary: '18-35K·15薪', experience: '5-10年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/5807ade9710753da0nV40t68FFtV.html' },
  { title: '助理HRBP——深圳', company: '腾讯', city: '深圳', district: '南山区', salary: '12-18K·15薪', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/a30d73bc1527b1b903172ti9FFBS.html' },
  { title: '腾讯营销HRBP-客户方向', company: '腾讯', city: '上海', district: '徐汇区', salary: '20-40K·15薪', experience: '5-10年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/073ca667b5ae6e930nB53NW9EVpT.html' },
  { title: 'HRBP-腾娱互动', company: '腾讯互娱', city: '成都', district: '武侯区', salary: '14-18K·14薪', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/64c3375046fcce7f03Z_3NS4GFFZ.html' },
  { title: 'CSIG HRBP', company: '腾讯', city: '深圳', district: '', salary: '18-35K·15薪', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/87250d5415b5d5f703N539S4FFNT.html' },
  { title: 'HRBP for 销售团队', company: '北京易森动力', city: '北京', district: '海淀区', salary: '20-30K·15薪', experience: '5-10年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/08a0d431455cbb3c1nV83d64Eg~~.html' },
  { title: '阿里国际-HRBP(技术)', company: '阿里巴巴', city: '杭州', district: '余杭区', salary: '30-45K·13薪', experience: '5-10年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/3b74eba8ea08f2f40nd40t27FVVT.html' },
  { title: '1688-HRBP Leader', company: '阿里巴巴', city: '杭州', district: '滨江区', salary: '80-110K·16薪', experience: '10年以上', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/ae6c6429444aca1f0nB82dS_EFpY.html' },
  { title: '盒马鲜生HRBP', company: '盒马鲜生', city: '泰州', district: '兴化市', salary: '9-12K·16薪', experience: '5-10年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/9fefa3e7d187dcf00nV93Ny0FVJR.html' },
  { title: '人事主管HRBP', company: '盒马鲜生', city: '上海', district: '青浦区', salary: '9-10K·13薪', experience: '1-3年', education: '大专', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/11e3daed825fd8191Xx_09m7GFNQ.html' },
  { title: 'HRBP（BASE六安）', company: '盒马鲜生', city: '六安', district: '金安区', salary: '10-14K·13薪', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/760dd8ec3cd580450nB93ti6ElJQ.html' },
  { title: 'HRBP(base安徽)', company: '盒马鲜生', city: '南昌', district: '青云谱区', salary: '7-12K·16薪', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/4e999472eb18e7380nB63NS-GVVZ.html' },
  { title: 'HRBP【阿里中心&百捷大厦】', company: '优矩互动', city: '武汉', district: '江夏区', salary: '6-10K', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/7dc2da997d34733e0nJ43Nq1GVpQ.html' },
  { title: 'HRBP', company: '赛轮集团', city: '青岛', district: '市北区', salary: '8-10K', experience: '在校/应届', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/3d9b738626098f410nB50tS5FVJU.html' },
  { title: 'HRBP', company: '海信视像', city: '青岛', district: '黄岛区', salary: '12-13K·13薪', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/0cf116e2123ae2010nd-3tm7ElFX.html' },
  { title: 'HRBP', company: '乾程科技', city: '青岛', district: '', salary: '12-20K', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/b3de7b9f397b79510nV609W1F1NS.html' },
  { title: 'HRBP', company: '迈金科技', city: '青岛', district: '', salary: '9-14K·14薪', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/fdbfab484ad6fff60nBz39-9EVBW.html' },
  { title: 'HRBP', company: '优度集团', city: '青岛', district: '崂山区', salary: '9-14K', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/30509046d64724470nV63tW-F1tU.html' },
  { title: 'hrbp', company: '英科医疗', city: '青岛', district: '崂山区', salary: '14-20K·13薪', experience: '1-3年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/7f82a9f8a7d5de8a0nB839m0FVtY.html' },

  // ===== 智联招聘 (28条) =====
  { title: 'HRBP(偏招聘）', company: '万宝盛华', city: '大连', district: '甘井子区', salary: '5-6K', experience: '1-3年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC880319660J40962517515.htm' },
  { title: '高级电商HRBP/主管', company: '河南嗨雅企业管理', city: '郑州', district: '金水区', salary: '9-12K', experience: '3-5年', education: '大专', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1491064850J40957470608.htm' },
  { title: 'HRBP', company: '爱谱华顿', city: '上海', district: '浦东新区', salary: '10-18K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC131100140J40918870912.htm' },
  { title: 'HRBP', company: '天成自控', city: '滁州', district: '南谯区', salary: '8-16K·13薪', experience: '5-10年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC450524010J40924835212.htm' },
  { title: 'hrbp经理', company: '山东纽扣家和教育', city: '济南', district: '市中区', salary: '8-10K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1482940770J40928861912.htm' },
  { title: '供应链海外HRBP', company: '广州森大贸易', city: '广州', district: '天河区', salary: '20-40K·13薪', experience: '5-10年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC132723350J40876395203.htm' },
  { title: 'HRBP(销售招聘+培训)', company: '广州凯钥国际贸易', city: '广州', district: '番禺区', salary: '18-28K', experience: '3-5年', education: '大专', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1527379320J40916318703.htm' },
  { title: 'HRBP(J40556)', company: '新东方', city: '北京', district: '', salary: '13-16K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC120002360J40946589002.htm' },
  { title: 'HRBP', company: '鑫荣懋集团', city: '北京', district: '大兴区', salary: '10-15K', experience: '5-10年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC136398060J40860965414.htm' },
  { title: '幼儿园HRBP', company: '北京伊顿国际', city: '北京', district: '朝阳区', salary: '10-15K', experience: '5-10年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC120166460J40772659906.htm' },
  { title: '研发方向HRBP', company: '甘李药业', city: '北京', district: '通州区', salary: '15-25K·13薪', experience: '经验不限', education: '硕士', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC146666250J40656549910.htm' },
  { title: 'HRBP(J10016)', company: '北京华联商厦', city: '北京', district: '西城区', salary: '8-15K·13薪', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC120741210J40567681605.htm' },
  { title: 'HRBP', company: '明济生物制药', city: '北京', district: '大兴区', salary: '15-20K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1276328090J40934886208.htm' },
  { title: '游戏发行线HRBP/TA专家', company: '上海任仕达', city: '北京', district: '朝阳区', salary: '25-45K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC255880510J40933911008.htm' },
  { title: 'HRBP', company: '极苏清火', city: '杭州', district: '余杭区', salary: '12-18K', experience: '1-3年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1524166820J40781129306.htm' },
  { title: 'HRBP（快销品行业）', company: '安徽英贝健贸易', city: '杭州', district: '滨江区', salary: '10-15K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1511229700J40854309013.htm' },
  { title: '人事专员/HRBP', company: '中安元生', city: '杭州', district: '余杭区', salary: '10-13K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1510477680J40860630813.htm' },
  { title: 'HRBP经理(J10271)', company: '新毅东', city: '上海', district: '浦东新区', salary: '25-35K', experience: '5-10年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1518756060J41023584204.htm' },
  { title: '招聘HRBP', company: '苏州安美润滑', city: '东莞', district: '寮步镇', salary: '7-8K·13薪', experience: '1-3年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1513646540J40879533514.htm' },
  { title: 'HRBP专员', company: '金宇生物', city: '呼和浩特', district: '土左旗', salary: '7-12K', experience: '1-3年', education: '本科', source: '智联招聘', sourceUrl: 'https://www.zhaopin.com/sou/jl489/kw01400KG088050' },
  { title: '人事专员/HRBP', company: '天津源优学教育', city: '天津', district: '河西区', salary: '5-8K', experience: '1-3年', education: '大专', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1526817950J40871669001.htm' },
  { title: 'HRBP/人事主管', company: '中创天津', city: '天津', district: '滨海新区', salary: '8-10K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CCL1486393170J40835786509.htm' },
  { title: '区域HRBP总监', company: '爱谱华顿', city: '天津', district: '西青区', salary: '12-20K', experience: '5-10年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC131100140J40927871712.htm' },
  { title: '人力资源/HRBP', company: '天津鼎维固', city: '天津', district: '滨海新区', salary: '6-9K', experience: '1-3年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC531226620J40880534110.htm' },
  { title: 'HRBP经理/人力行政', company: '正荣物业', city: '天津', district: '北辰区', salary: '8-10K·13薪', experience: '5-10年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC264550830J40785210206.htm' },
  { title: 'HRBP', company: '北京华德创业', city: '天津', district: '西青区', salary: '7-10K', experience: '3-5年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC132945680J40871041801.htm' },
  { title: 'HRBP', company: '牧原食品', city: '天津', district: '西青区', salary: '8-15K', experience: '1-3年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC495147320J40862927411.htm' },
  { title: 'HRBP', company: '浙江爱旭太阳能', city: '天津', district: '北辰区', salary: '10-15K', experience: '5-10年', education: '本科', source: '智联招聘', sourceUrl: 'http://www.zhaopin.com/jobdetail/CC504891230J40862400611.htm' },

  // ===== 前程无忧 (7条) =====
  { title: 'HRBP负责人', company: '天逸财金', city: '上海', district: '浦东新区', salary: '18-35K', experience: '8年及以上', education: '本科', source: '前程无忧', sourceUrl: 'https://msearch.51job.com/jobs/shanghai-pdxq/173261149.html' },
  { title: 'HRBP', company: '雅科贝思精密机电', city: '上海', district: '浦东新区', salary: '15-30K', experience: '5年及以上', education: '本科', source: '前程无忧', sourceUrl: 'https://msearch.51job.com/jobs/shanghai-pdxq/172329307.html' },
  { title: '人力资源伙伴（HRBP）', company: '上海港汇房地产', city: '上海', district: '静安区', salary: '15-25K', experience: '10年及以上', education: '本科', source: '前程无忧', sourceUrl: 'https://msearch.51job.com/jobs/shanghai-jaq/172139322.html' },
  { title: 'HRBP', company: '上海博恩登特科技', city: '上海', district: '嘉定区', salary: '15-20K', experience: '5年及以上', education: '本科', source: '前程无忧', sourceUrl: 'https://msearch.51job.com/jobs/shanghai-jdq/170953438.html' },
  { title: 'HRBP经理(J15041)', company: '北方华创', city: '北京', district: '', salary: '15-25K', experience: '5年及以上', education: '本科', source: '前程无忧', sourceUrl: 'https://msearch.51job.com/jobs/beijing/173177019.html' },
  { title: 'HRBP专员(J16446)', company: '北方华创', city: '北京', district: '', salary: '10-15K', experience: '1-3年', education: '本科', source: '前程无忧', sourceUrl: 'https://msearch.51job.com/jobs/beijing/173176902.html' },
  { title: 'HRBP', company: '成都卡诺普机器人', city: '成都', district: '成华区', salary: '7-10K·13薪', experience: '3年及以上', education: '本科', source: '前程无忧', sourceUrl: 'https://msearch.51job.com/jobs/chengdu-chq/173256902.html' },

  // ===== 猎聘 (34条) =====
  { title: 'HRBP经理', company: '维信诺', city: '合肥', district: '新站区', salary: '20-40K·14薪', experience: '8年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984833915.shtml' },
  { title: 'HRBP负责人', company: '云南宇泽新能源', city: '昆明', district: '官渡区', salary: '15-22K·14薪', experience: '2年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984833899.shtml' },
  { title: 'HRBP/人力资源业务伙伴', company: '法雷奥', city: '南京', district: '东善桥', salary: '15-25K·15薪', experience: '8年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984833667.shtml' },
  { title: 'HRBP', company: '新安集团', city: '杭州', district: '建德', salary: '15-25K', experience: '5年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984831751.shtml' },
  { title: 'HRBP(J22694)', company: '神州数码', city: '北京', district: '西二旗', salary: '15-18K', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984831157.shtml' },
  { title: 'HRBP（外派韩国）', company: '海柔创新', city: '韩国', district: '', salary: '18-25K·15薪', experience: '2年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984830893.shtml' },
  { title: 'HRBP', company: '远景科技集团', city: '上海', district: '新城区', salary: '15-35K·18薪', experience: '5-10年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984835169.shtml' },
  { title: 'HRBP主管（硬件研发）', company: '小鹏集团', city: '上海', district: '浦东新区', salary: '13-18K·13薪', experience: '1年以上', education: '硕士', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984834955.shtml' },
  { title: 'HRBP主管（余姚）', company: '大丰实业', city: '宁波', district: '兰江', salary: '15-20K', experience: '5年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984837915.shtml' },
  { title: 'HRBP', company: '造物时代', city: '深圳', district: '南油', salary: '18-25K·14薪', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984837667.shtml' },
  { title: '区域HRBP', company: '美世留学', city: '深圳', district: '车公庙', salary: '10-18K', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984837613.shtml' },
  { title: 'HRBP', company: '公牛集团', city: '宁波', district: '浒山', salary: '8-13K·14薪', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984837379.shtml' },
  { title: 'HRBP主管', company: '济南', city: '济南', district: '姚家', salary: '10-15K', experience: '3-5年', education: '大专', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984837223.shtml' },
  { title: '研发HRBP（成都）', company: '赛力斯集团', city: '成都', district: '高新区', salary: '20-35K·14薪', experience: '5年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984816813.shtml' },
  { title: '猛士汽车区域HRBP', company: '东风汽车', city: '成都', district: '神仙树', salary: '15-25K', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984779845.shtml' },
  { title: '高级HRBP(招聘)', company: '云绎智创', city: '成都', district: '新兴', salary: '10-15K·13薪', experience: '5年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984774625.shtml' },
  { title: '医药研发HRBP', company: '海思科医药', city: '成都', district: '天府', salary: '8-12K', experience: '5年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984696329.shtml' },
  { title: 'HRBP（招聘&绩效）', company: '成都卡诺普机器人', city: '成都', district: '龙潭寺', salary: '7-10K·13薪', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984677999.shtml' },
  { title: '营运中心HRBP总监', company: '茶百道', city: '成都', district: '武侯区', salary: '30-50K', experience: '10年以上', education: '本科', source: '猎聘', sourceUrl: 'https://m.liepin.com/city-cd/zpyyhrbpe62y/' },
  { title: '川渝大区HRBP', company: '浙江柚香谷', city: '成都', district: '双楠', salary: '12-20K·13薪', experience: '5-10年', education: '大专', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984734119.shtml' },
  { title: 'HRBP', company: '康诺亚生物医药', city: '成都', district: '双流区', salary: '15-28K·14薪', experience: '5-10年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984720989.shtml' },
  { title: 'HRBP（西南大区）', company: '万声信息', city: '成都', district: '二仙桥', salary: '15-20K', experience: '5-10年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984633151.shtml' },
  { title: '门店HRBP', company: '美团', city: '成都', district: '五桂桥', salary: '10-16K·15薪', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984586069.shtml' },
  { title: 'HRBP', company: '佰维存储', city: '成都', district: '犀浦', salary: '15-25K·15薪', experience: '3年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984336485.shtml' },
  { title: 'HRBP leader', company: '一智科技', city: '成都', district: '', salary: '20-40K·13薪', experience: '5-10年', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984127863.shtml' },
  { title: '资深HRBP（汽车方向）', company: '苏州睿新微系统', city: '苏州', district: '工业园区', salary: '20-30K·14薪', experience: '5年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984476281.shtml' },
  { title: 'HRBP（日本市场）-TikTok直播', company: '字节跳动', city: '北京', district: '', salary: '30-60K·15薪', experience: '3年以上', education: '本科', source: '猎聘', sourceUrl: 'https://www.liepin.com/job/1984472167.shtml' },
  { title: 'HRBP', company: '大族激光', city: '天津', district: '北辰区', salary: '9-14K·13薪', experience: '3年以上', education: '本科', source: '猎聘', sourceUrl: 'https://m.liepin.com/job/1984656657.shtml' },
  { title: 'HRBP', company: '立联信天津', city: '天津', district: '滨海新区', salary: '10-15K·13薪', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://m.liepin.com/job/1983639925.shtml' },
  { title: '人力资源经理/HRBP', company: '中海商业', city: '天津', district: '河西区', salary: '12-15K·16薪', experience: '3-5年', education: '本科', source: '猎聘', sourceUrl: 'https://m.liepin.com/job/1984099095.shtml' },
  { title: 'HRBP经理', company: '丽滋卡尔医院', city: '天津', district: '中山门', salary: '15-30K', experience: '5-10年', education: '本科', source: '猎聘', sourceUrl: 'https://m.liepin.com/job/1980332407.shtml' },
  { title: '人事HRBP', company: '鑫斛药房', city: '重庆', district: '两江新区', salary: '6-8K', experience: '1-3年', education: '本科', source: '汇博网', sourceUrl: 'https://m.huibo.com/cq/job/jobi83nrc1/' },
  { title: '总部职能HRBP', company: '百利天恒', city: '成都', district: '桐梓林', salary: '15-25K', experience: '5年以上', education: '大专', source: '猎聘', sourceUrl: 'https://m.liepin.com/job/1983358503.shtml' },
  { title: 'HRBP Manager', company: '特斯拉中国', city: '成都', district: '', salary: '40-55K·17薪', experience: '5-10年', education: '本科', source: '猎聘', sourceUrl: 'https://m.liepin.com/job/1984674853.shtml' },

  // ===== 补充数据 (1条) =====
  { title: '高级HRBP（研发团队）', company: '海微科技', city: '武汉', district: '江夏区', salary: '15-25K·13薪', experience: '3-5年', education: '本科', source: 'BOSS直聘', sourceUrl: 'https://m.zhipin.com/job_detail/b133cfe5f6f780570nFy39y-F1tT.html' },
]

// ============================================================
// 标签与福利池
// ============================================================
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

// 大厂名单（福利更多）
const bigTechCompanies = ['腾讯', '腾讯互娱', '阿里巴巴', '字节跳动', '美团', '盒马鲜生', '好未来', '新东方']

// ============================================================
// 工具函数
// ============================================================
function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function pickN(arr, n, rand) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, n)
}

// 解析薪资字符串：提取 salaryMin, salaryMax, bonusMonths
// "4-6K"       → { salaryMin: 4,  salaryMax: 6,  bonusMonths: 13 }
// "15-25K"     → { salaryMin: 15, salaryMax: 25, bonusMonths: 13 }
// "10-13K·14薪" → { salaryMin: 10, salaryMax: 13, bonusMonths: 14 }
// "80-110K·16薪" → { salaryMin: 80, salaryMax: 110, bonusMonths: 16 }
function parseSalary(salaryStr) {
  if (!salaryStr) {
    return { salaryMin: 0, salaryMax: 0, bonusMonths: 13 }
  }
  const match = salaryStr.match(/(\d+)-(\d+)K(?:·(\d+)薪)?/)
  if (match) {
    return {
      salaryMin: parseInt(match[1], 10),
      salaryMax: parseInt(match[2], 10),
      bonusMonths: match[3] ? parseInt(match[3], 10) : 13,
    }
  }
  return { salaryMin: 0, salaryMax: 0, bonusMonths: 13 }
}

// 根据职位标题生成标签
function generateTags(job, rand) {
  const tags = []
  const title = job.title
  if (title.includes('AI') || title.includes('人工智能')) tags.push('AI赛道')
  if (title.includes('研发') || title.includes('技术')) tags.push('技术HR')
  if (title.includes('管理') || title.includes('经理') || title.includes('Leader') || title.includes('总监') || title.includes('主管')) tags.push('管理岗')
  if (title.includes('招聘')) tags.push('社招')
  if (title.includes('管培') || title.includes('青藤')) tags.push('校招')
  if (title.includes('OD') || title.includes('组织')) tags.push('组织发展')
  if (title.includes('出海') || title.includes('海外') || title.includes('外派') || title.includes('日本')) tags.push('出海')
  if (title.includes('绩效')) tags.push('绩效')
  if (title.includes('培训')) tags.push('培训')
  if (bigTechCompanies.includes(job.company)) tags.push('大厂')
  const industry = companyIndustryMap[job.company] || ''
  if (industry.includes('互联网')) tags.push('互联网')
  if (industry.includes('新能源') || industry.includes('汽车')) tags.push('新能源')
  if (industry.includes('医药') || industry.includes('医疗')) tags.push('硬科技')
  if (industry.includes('半导体') || industry.includes('芯片')) tags.push('硬科技')
  // 补充到3-5个标签
  const extraPool = tagPool.filter(t => !tags.includes(t))
  while (tags.length < 3) {
    tags.push(extraPool[Math.floor(rand() * extraPool.length)])
  }
  if (tags.length < 5 && rand() > 0.5) {
    tags.push(extraPool[Math.floor(rand() * extraPool.length)])
  }
  return tags.slice(0, 5)
}

// 根据公司生成福利
function generateBenefits(job, rand) {
  const isBigTech = bigTechCompanies.includes(job.company)
  const count = isBigTech ? 6 + Math.floor(rand() * 2) : 4 + Math.floor(rand() * 2)
  return pickN(benefitPool, Math.min(count, benefitPool.length), rand)
}

// ============================================================
// 将 realJobs 转换为完整的职位对象
// ============================================================
function buildJobs() {
  const now = Date.now()
  return realJobs.map((raw, index) => {
    const { salaryMin, salaryMax, bonusMonths } = parseSalary(raw.salary)
    const rand = seededRandom(index * 31 + 17)

    // 发布时间：最近72小时内分散分布
    const hoursAgo = Math.floor(rand() * 72) + index % 12
    const postedAt = new Date(now - hoursAgo * 3600000).toISOString()
    // 抓取时间：最近6小时内
    const crawledAt = new Date(now - Math.floor(rand() * 6) * 3600000).toISOString()

    // 基础热度与增长
    const baseHeat = Math.round(300 + rand() * 900)
    const growth = Math.round(8 + rand() * 55)

    const jobId = `real_${String(index + 1).padStart(3, '0')}`
    const companyIndustry = companyIndustryMap[raw.company] || '其他'

    return {
      jobId,
      title: raw.title,
      companyId: `${raw.source}_${raw.company}`,
      companyName: raw.company,
      companyIndustry,
      city: raw.city,
      district: raw.district || '',
      experience: raw.experience,
      education: raw.education,
      salaryRange: raw.salary || '面议',
      salaryMin,
      salaryMax,
      bonusMonths,
      tags: generateTags(raw, rand),
      source: raw.source,
      sourceUrl: raw.sourceUrl,
      postedAt,
      crawledAt,
      heat: baseHeat,
      growth,
      url: raw.sourceUrl,
      benefits: generateBenefits(raw, rand),
    }
  })
}

// ============================================================
// 热度算法与性价比评分（与 build-static-api.js 保持一致）
// ============================================================
function applyHeatAlgorithm(jobs) {
  const now = Date.now()
  return jobs.map(job => {
    const hoursOld = Math.max(0, (now - new Date(job.postedAt).getTime()) / 3600000)
    const recencyFactor = Math.exp(-hoursOld / 24)
    const salaryFactor = ((job.salaryMax + job.salaryMin) / 2) / 20
    const platformFactor = sourceWeights[job.source] || 1.0

    // 性价比算法：avgSalary / experienceYears * benefitFactor
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

// ============================================================
// 薪资分布明细
// ============================================================
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

// ============================================================
// 从真实职位数据生成公司信息
// ============================================================
function getCompaniesData(jobs) {
  const map = new Map()
  for (const job of jobs) {
    const name = job.companyName
    if (!map.has(name)) {
      const industry = job.companyIndustry || '其他'
      const rand = seededRandom(name.split('').reduce((a, b) => a + b.charCodeAt(0), 0))
      map.set(name, {
        companyId: name,
        name,
        industry,
        scale: bigTechCompanies.includes(name) ? '1000人以上' : (rand() > 0.5 ? '500-1000人' : '150-500人'),
        stage: bigTechCompanies.includes(name) ? '上市公司' : (rand() > 0.5 ? '成长期' : '成熟期'),
        founded: String(1990 + Math.floor(rand() * 30)),
        headquarters: job.city,
        branches: [],
        description: `${name}是${industry}领域的企业。`,
        logoColor: '#' + Math.floor(rand() * 16777215).toString(16).padStart(6, '0'),
        logoInitial: name.charAt(0),
      })
    }
  }
  return Array.from(map.values())
}

// ============================================================
// 公司分析数据（与 build-static-api.js 保持一致）
// ============================================================
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

// ============================================================
// 主函数：生成所有静态 API 文件
// ============================================================
function main() {
  const apiDir = path.resolve(__dirname, '../api')
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true })
  }

  const jobs = applyHeatAlgorithm(buildJobs()).map(addSalaryBreakdown)
  const companies = getCompaniesData(jobs)
  const lastCrawl = new Date().toISOString()

  // /api/jobs —— 全部职位（按热度排序）
  fs.writeFileSync(path.join(apiDir, 'jobs.json'), JSON.stringify({
    data: jobs,
    total: jobs.length,
    page: 1,
    limit: jobs.length,
  }, null, 2))

  // /api/hot-jobs —— 热门职位 Top 6
  fs.writeFileSync(path.join(apiDir, 'hot-jobs.json'), JSON.stringify(jobs.slice(0, 6), null, 2))

  // /api/companies —— 公司列表
  fs.writeFileSync(path.join(apiDir, 'companies.json'), JSON.stringify(companies, null, 2))

  // /api/companies/:id —— 公司详情（含职位与分析）
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

  // /api/stats —— 统计数据
  const sourceStats = {}
  const cityStats = {}
  const expStats = {}
  const industryStats = {}
  jobs.forEach(j => {
    sourceStats[j.source] = (sourceStats[j.source] || 0) + 1
    cityStats[j.city] = (cityStats[j.city] || 0) + 1
    expStats[j.experience] = (expStats[j.experience] || 0) + 1
    if (j.companyIndustry) {
      industryStats[j.companyIndustry] = (industryStats[j.companyIndustry] || 0) + 1
    }
  })
  fs.writeFileSync(path.join(apiDir, 'stats.json'), JSON.stringify({
    sourceStats: Object.entries(sourceStats).map(([source, count]) => ({ source, count })),
    cityStats: Object.entries(cityStats).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count),
    expStats: Object.entries(expStats).map(([experience, count]) => ({ experience, count })),
    industryStats: Object.entries(industryStats).map(([industry, count]) => ({ industry, count })).sort((a, b) => b.count - a.count),
  }, null, 2))

  // /api/status —— 抓取状态
  fs.writeFileSync(path.join(apiDir, 'status.json'), JSON.stringify({
    running: false,
    lastCrawl,
    todayNew: jobs.length,
    totalJobs: jobs.length,
    platforms: Object.keys(sourceWeights).length,
    timestamp: new Date().toISOString(),
  }, null, 2))

  // /api/jobs/:id —— 单个职位详情
  const jobsDir = path.join(apiDir, 'jobs')
  if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true })
  for (const job of jobs) {
    fs.writeFileSync(path.join(jobsDir, `${job.jobId}.json`), JSON.stringify(job, null, 2))
  }

  console.log(`真实数据 API 生成完成：${jobs.length} 个职位，${companies.length} 家公司`)
  console.log(`输出目录：${apiDir}`)
}

module.exports = { realJobs, parseSalary, buildJobs, applyHeatAlgorithm }

main()
