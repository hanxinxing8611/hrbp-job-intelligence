import type { Job, CrawlerSource, SalaryBreakdown } from './types'
import { companies } from './mockData'

const sources: CrawlerSource[] = ['BOSS直聘', '智联招聘', '猎聘', '前程无忧', '拉勾招聘']

const titleTemplates = [
  { base: 'HRBP', suffixes: ['-大模型业务线', '-商业化团队', '-算法研究院', '-产品中心', '-技术中台', '-市场部', '-运营中心', '-金融事业部', '-客户成功部', '-创新业务'] },
  { base: '高级HRBP', suffixes: ['-感知算法团队', '-自动驾驶事业部', '-新能源研发', '-跨境电商', '-智能制造', '-医疗健康', '-教育科技', '-金融科技', '-企业服务', '-消费升级'] },
  { base: 'HRBP经理', suffixes: ['-人力资源中心', '-组织发展部', '-人才招聘中心', '-培训发展部', '-薪酬绩效中心', '-员工关系部', '-企业文化部', '-数字化HR', '-海外HR', '-战略HR'] },
  { base: 'HRBP主管', suffixes: ['-研发一支', '-研二支', '-销售部', '-产品部', '-运营部', '-设计部', '-数据部', '-测试部', '-运维部', '-安全部'] },
  { base: 'HRBP专家', suffixes: ['-组织发展', '-人才盘点', '-绩效体系', '-薪酬设计', '-雇主品牌', '-校招体系', '-社招体系', '-培训体系', '-员工体验', '-HR数字化'] },
]

const experienceLevels = ['3-5年', '5-7年', '7-10年']
const educationLevels = ['本科', '硕士', '本科', '本科', '硕士', '本科']

const districtMap: Record<string, string[]> = {
  上海: ['浦东新区', '嘉定区', '徐汇区', '杨浦区', '长宁区', '静安区', '黄浦区', '闵行区'],
  北京: ['海淀区', '朝阳区', '昌平区', '西城区', '东城区', '丰台区', '石景山区', '通州区'],
  深圳: ['南山区', '福田区', '宝安区', '龙岗区', '罗湖区', '龙华区', '坪山区', '光明区'],
  杭州: ['余杭区', '滨江区', '西湖区', '上城区', '拱墅区', '萧山区', '钱塘区', '临平区'],
  苏州: ['工业园区', '虎丘区', '吴中区', '相城区', '姑苏区', '吴江区', '昆山市', '常熟市'],
  广州: ['番禺区', '天河区', '海珠区', '越秀区', '白云区', '黄埔区', '花都区', '南沙区'],
}

const tagPool = [
  'AI赛道', '期权激励', '核心业务', '管理岗', '高增长', 'WLB', '稳定',
  '出海', '海外', '技术HR', '硕博团队', '研究院', '商业化', '组织发展',
  '校招', '社招', '培训', '薪酬', '绩效', '员工关系', '雇主品牌',
  '数字化', '战略', '专家岗', '弹性工作', '免费三餐', '商业保险',
  '上市', 'D轮', 'C轮', 'B轮', '独角兽', '硬科技', '新能源',
  '医疗健康', '跨境电商', '智能制造', '金融科技', '教育科技', '互联网',
]

const benefitPool = [
  '期权', '免费三餐', '弹性工作', '商业保险', '六险一金', '六险二金',
  '补充医疗', '年度体检', '带薪年假15天', '免费班车', '员工宿舍',
  '年度旅游', '节日福利', '项目奖金', '股票期权', '企业年金',
  '子女教育优惠', '海外交流', '科研补贴', '会议经费', '语言补贴',
  '探亲假', '海外轮岗', '年度团建', '通勤班车', '免费食堂',
]

const baseResp = [
  '深入业务单元，作为业务负责人的HR战略伙伴，参与业务目标制定与拆解',
  '主导所辖业务线的人才盘点、绩效体系优化与组织诊断，输出组织效能提升方案',
  '推动招聘、培养、激励等HR政策在业务侧落地，保障核心人才供给与梯队健康',
  '搭建业务数据看板，用数据驱动人效分析与决策，定期向管理层汇报HR运营指标',
]

const baseReq = [
  '本科及以上学历，人力资源、管理学、心理学等相关专业优先',
  '5年以上HR综合经验，其中2年以上HRBP或业务侧HR经验',
  '熟悉至少一个行业的人才市场与薪酬体系，具备组织诊断与数据分析能力',
  '出色的跨部门沟通与影响力，能在业务与HR之间建立信任型协作',
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, n)
}

function formatSalary(min: number, max: number, bonus: number): string {
  return `${min}-${max}K·${bonus}薪`
}

function generateSalaryBreakdown(min: number, max: number): SalaryBreakdown {
  const range = max - min
  return {
    p10: min,
    p25: Math.round(min + range * 0.2),
    p50: Math.round(min + range * 0.5),
    p75: Math.round(min + range * 0.8),
    p90: max + Math.round(range * 0.2),
  }
}

function generatePostedDate(daysAgo: number, rand: () => number): string {
  const now = new Date('2026-07-13T15:00:00+08:00')
  const hoursAgo = Math.floor(rand() * daysAgo * 24)
  const date = new Date(now.getTime() - hoursAgo * 3600000)
  return date.toISOString().slice(0, 19) + '+08:00'
}

export function generateJobs(count: number = 200): Job[] {
  const rand = seededRandom(42)
  const result: Job[] = []

  for (let i = 0; i < count; i++) {
    const company = pick(companies, rand)
    const titleTpl = pick(titleTemplates, rand)
    const suffix = pick(titleTpl.suffixes, rand)
    const exp = pick(experienceLevels, rand)
    const edu = pick(educationLevels, rand)
    const source = pick(sources, rand)
    const districts = districtMap[company.headquarters.split('·')[0]] || districtMap['上海']
    const district = pick(districts, rand)
    const city = company.headquarters.split('·')[0]

    const expFactor = exp === '3-5年' ? 0.7 : exp === '5-7年' ? 1.0 : 1.4
    const baseMin = Math.round((15 + rand() * 20) * expFactor)
    const baseMax = Math.round(baseMin + (8 + rand() * 15) * expFactor)
    const bonusMonths = 13 + Math.floor(rand() * 4)

    const heat = Math.round(300 + rand() * 900)
    const growth = Math.round(8 + rand() * 60)
    const daysAgo = Math.floor(rand() * 14)

    result.push({
      jobId: `j${i + 1}`,
      title: `${titleTpl.base}${suffix}`,
      companyId: company.companyId,
      city,
      district,
      experience: exp,
      education: edu,
      salaryRange: formatSalary(baseMin, baseMax, bonusMonths),
      salaryMin: baseMin,
      salaryMax: baseMax,
      tags: pickN(tagPool, 3 + Math.floor(rand() * 2), rand),
      source,
      postedAt: generatePostedDate(daysAgo + 1, rand),
      heat,
      growth,
      responsibilities: [...baseResp.slice(0, 3 + Math.floor(rand() * 2)), `负责${city}地区${company.industry.split(' / ')[0]}行业的HRBP工作`],
      requirements: [...baseReq.slice(0, 3 + Math.floor(rand() * 2)), `${exp}工作经验优先`],
      benefits: pickN(benefitPool, 4 + Math.floor(rand() * 3), rand),
      salaryBreakdown: generateSalaryBreakdown(baseMin, baseMax),
    })
  }

  result.sort((a, b) => b.heat - a.heat)
  for (let i = 0; i < result.length; i++) {
    result[i].jobId = `j${i + 1}`
  }

  return result
}

export const generatedJobs = generateJobs(200)
