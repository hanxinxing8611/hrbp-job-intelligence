const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const db = require('../data/database')

const sources = [
  { name: 'BOSS直聘', url: 'https://www.zhipin.com', keyword: 'HRBP' },
  { name: '智联招聘', url: 'https://www.zhaopin.com', keyword: 'HRBP' },
  { name: '前程无忧', url: 'https://www.51job.com', keyword: 'HRBP' },
]

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function crawlBossZhipin(keyword = 'HRBP', city = '') {
  console.log(`[BOSS直聘] 开始爬取: ${keyword}`)
  const startTime = new Date()
  
  let browser = null
  let count = 0
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,800',
      ],
      timeout: 60000,
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
    
    let url = `https://www.zhipin.com/search/job/?query=${encodeURIComponent(keyword)}&city=101010100`
    if (city) {
      const cityMap = {
        '北京': '101010100', '上海': '101020100', '深圳': '101280600',
        '杭州': '101210100', '广州': '101280100', '成都': '101270100',
      }
      url = `https://www.zhipin.com/search/job/?query=${encodeURIComponent(keyword)}&city=${cityMap[city] || '101010100'}`
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    await sleep(3000)

    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      await sleep(2000)
      const html = await page.content()
      const $ = cheerio.load(html)

      const jobCards = $('.job-card-wrapper')
      console.log(`[BOSS直聘] 第${pageNum}页: ${jobCards.length}条`)

      for (const card of jobCards) {
        const $card = $(card)
        
        try {
          const title = $card.find('.job-name').text().trim()
          const companyName = $card.find('.company-name').text().trim()
          const salary = $card.find('.salary').text().trim()
          const location = $card.find('.job-area').text().trim()
          const experience = $card.find('.job-info span').eq(0).text().trim()
          const education = $card.find('.job-info span').eq(1).text().trim()
          const tags = $card.find('.tag-list span').map((_, el) => $(el).text().trim()).get().slice(0, 5)
          const url = $card.find('.job-name').attr('href')
          
          const salaryMatch = salary.match(/(\d+)-(\d+)K/)
          const salaryMin = salaryMatch ? parseInt(salaryMatch[1]) : 0
          const salaryMax = salaryMatch ? parseInt(salaryMatch[2]) : 0

          const [city, district] = location.includes('·') ? location.split('·') : [location, '']

          const companyId = `boss_${companyName.replace(/\s/g, '_')}`
          const jobId = `boss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          db.run(
            'INSERT OR REPLACE INTO companies (companyId, name, industry, scale, stage, founded, headquarters, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [companyId, companyName, '未知', '未知', '未知', '未知', city, `${companyName}招聘信息`]
          )

          db.run(
            'INSERT OR REPLACE INTO jobs (jobId, title, companyId, city, district, experience, education, salaryRange, salaryMin, salaryMax, tags, source, postedAt, heat, growth, url, responsibilities, requirements, benefits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              jobId, title, companyId, city, district, experience, education,
              salary, salaryMin, salaryMax, JSON.stringify(tags), 'BOSS直聘',
              new Date().toISOString(), Math.floor(Math.random() * 1000) + 200,
              Math.random() * 50 + 10, `https://www.zhipin.com${url}`,
              '', '', JSON.stringify(['五险一金', '带薪年假', '年底双薪'])
            ]
          )

          count++
        } catch (e) {
          console.error(`[BOSS直聘] 解析失败: ${e.message}`)
        }
      }

      const nextBtn = await page.$('.next')
      if (nextBtn && pageNum < 3) {
        await Promise.all([
          page.click('.next'),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
        ])
      } else {
        break
      }
    }

    await browser.close()
    
    db.run(
      'INSERT INTO crawl_logs (source, count, status, startTime, endTime) VALUES (?, ?, ?, ?, ?)',
      ['BOSS直聘', count, 'success', startTime.toISOString(), new Date().toISOString()]
    )
    
    console.log(`[BOSS直聘] 爬取完成: ${count}条`)
    return count
  } catch (e) {
    console.error(`[BOSS直聘] 爬取失败: ${e.message}`)
    
    db.run(
      'INSERT INTO crawl_logs (source, count, status, startTime, endTime, error) VALUES (?, ?, ?, ?, ?, ?)',
      ['BOSS直聘', 0, 'error', startTime.toISOString(), new Date().toISOString(), e.message]
    )

    if (browser) {
      await browser.close()
    }
    
    return 0
  }
}

async function crawlZhaopin(keyword = 'HRBP') {
  console.log(`[智联招聘] 开始爬取: ${keyword}`)
  const startTime = new Date()
  
  let browser = null
  let count = 0
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      timeout: 60000,
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')

    const url = `https://sou.zhaopin.com/?jl=530&kw=${encodeURIComponent(keyword)}&p=1`
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    await sleep(3000)

    const html = await page.content()
    const $ = cheerio.load(html)

    const jobCards = $('.contentpile__content__wrapper')
    console.log(`[智联招聘] 第1页: ${jobCards.length}条`)

    for (const card of jobCards) {
      const $card = $(card)
      
      try {
        const title = $card.find('.contentpile__content__wrapper__item__info__box__jobname').text().trim()
        const companyName = $card.find('.contentpile__content__wrapper__item__info__box__cname').text().trim()
        const salary = $card.find('.contentpile__content__wrapper__item__info__box__job__saray').text().trim()
        const location = $card.find('.contentpile__content__wrapper__item__info__box__job__location').text().trim()
        const experience = $card.find('.contentpile__content__wrapper__item__info__box__job__comdec').text().trim().split('|')[0] || ''
        const education = $card.find('.contentpile__content__wrapper__item__info__box__job__comdec').text().trim().split('|')[1] || ''
        const url = $card.find('a').attr('href')

        const salaryMatch = salary.match(/(\d+)-(\d+)K/)
        const salaryMin = salaryMatch ? parseInt(salaryMatch[1]) : 0
        const salaryMax = salaryMatch ? parseInt(salaryMatch[2]) : 0

        const [city, district] = location.includes('-') ? location.split('-') : [location, '']

        const companyId = `zhaopin_${companyName.replace(/\s/g, '_')}`
        const jobId = `zhaopin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        db.run(
          'INSERT OR REPLACE INTO companies (companyId, name, industry, scale, stage, founded, headquarters, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [companyId, companyName, '未知', '未知', '未知', '未知', city, `${companyName}招聘信息`]
        )

        db.run(
          'INSERT OR REPLACE INTO jobs (jobId, title, companyId, city, district, experience, education, salaryRange, salaryMin, salaryMax, tags, source, postedAt, heat, growth, url, responsibilities, requirements, benefits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            jobId, title, companyId, city, district, experience.trim(), education.trim(),
            salary, salaryMin, salaryMax, JSON.stringify([]), '智联招聘',
            new Date().toISOString(), Math.floor(Math.random() * 800) + 100,
            Math.random() * 40 + 5, url,
            '', '', JSON.stringify(['五险一金', '年终奖'])
          ]
        )

        count++
      } catch (e) {
        console.error(`[智联招聘] 解析失败: ${e.message}`)
      }
    }

    await browser.close()
    
    db.run(
      'INSERT INTO crawl_logs (source, count, status, startTime, endTime) VALUES (?, ?, ?, ?, ?)',
      ['智联招聘', count, 'success', startTime.toISOString(), new Date().toISOString()]
    )
    
    console.log(`[智联招聘] 爬取完成: ${count}条`)
    return count
  } catch (e) {
    console.error(`[智联招聘] 爬取失败: ${e.message}`)
    
    db.run(
      'INSERT INTO crawl_logs (source, count, status, startTime, endTime, error) VALUES (?, ?, ?, ?, ?, ?)',
      ['智联招聘', 0, 'error', startTime.toISOString(), new Date().toISOString(), e.message]
    )

    if (browser) {
      await browser.close()
    }
    
    return 0
  }
}

async function crawl51Job(keyword = 'HRBP') {
  console.log(`[前程无忧] 开始爬取: ${keyword}`)
  const startTime = new Date()
  
  let browser = null
  let count = 0
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      timeout: 60000,
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')

    const url = `https://search.51job.com/list/000000,000000,0000,00,9,99,${encodeURIComponent(keyword)},2,1.html`
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    await sleep(3000)

    const html = await page.content()
    const $ = cheerio.load(html)

    const jobCards = $('.j_joblist .e')
    console.log(`[前程无忧] 第1页: ${jobCards.length}条`)

    for (const card of jobCards) {
      const $card = $(card)
      
      try {
        const title = $card.find('.jname').text().trim()
        const companyName = $card.find('.cname').text().trim()
        const salary = $card.find('.sal').text().trim()
        const location = $card.find('.workaddr').text().trim()
        const info = $card.find('.info').text().trim().split('|')
        const experience = info[0] || ''
        const education = info[1] || ''
        const url = $card.find('.jname').attr('href')

        const salaryMatch = salary.match(/(\d+)-(\d+)K/)
        const salaryMin = salaryMatch ? parseInt(salaryMatch[1]) : 0
        const salaryMax = salaryMatch ? parseInt(salaryMatch[2]) : 0

        const [city, district] = location.includes('-') ? location.split('-').slice(0, 2) : [location, '']

        const companyId = `51job_${companyName.replace(/\s/g, '_')}`
        const jobId = `51job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        db.run(
          'INSERT OR REPLACE INTO companies (companyId, name, industry, scale, stage, founded, headquarters, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [companyId, companyName, '未知', '未知', '未知', '未知', city, `${companyName}招聘信息`]
        )

        db.run(
          'INSERT OR REPLACE INTO jobs (jobId, title, companyId, city, district, experience, education, salaryRange, salaryMin, salaryMax, tags, source, postedAt, heat, growth, url, responsibilities, requirements, benefits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            jobId, title, companyId, city, district, experience.trim(), education.trim(),
            salary, salaryMin, salaryMax, JSON.stringify([]), '前程无忧',
            new Date().toISOString(), Math.floor(Math.random() * 700) + 50,
            Math.random() * 35 + 3, url,
            '', '', JSON.stringify(['五险一金', '双休'])
          ]
        )

        count++
      } catch (e) {
        console.error(`[前程无忧] 解析失败: ${e.message}`)
      }
    }

    await browser.close()
    
    db.run(
      'INSERT INTO crawl_logs (source, count, status, startTime, endTime) VALUES (?, ?, ?, ?, ?)',
      ['前程无忧', count, 'success', startTime.toISOString(), new Date().toISOString()]
    )
    
    console.log(`[前程无忧] 爬取完成: ${count}条`)
    return count
  } catch (e) {
    console.error(`[前程无忧] 爬取失败: ${e.message}`)
    
    db.run(
      'INSERT INTO crawl_logs (source, count, status, startTime, endTime, error) VALUES (?, ?, ?, ?, ?, ?)',
      ['前程无忧', 0, 'error', startTime.toISOString(), new Date().toISOString(), e.message]
    )

    if (browser) {
      await browser.close()
    }
    
    return 0
  }
}

async function crawlAll() {
  console.log('==================== 开始全平台爬取 ====================')
  
  let totalCount = 0
  
  const bossCount = await crawlBossZhipin('HRBP')
  totalCount += bossCount
  
  await sleep(5000)
  
  const zhaopinCount = await crawlZhaopin('HRBP')
  totalCount += zhaopinCount
  
  await sleep(5000)
  
  const jobCount = await crawl51Job('HRBP')
  totalCount += jobCount
  
  console.log(`==================== 爬取完成 ====================`)
  console.log(`总抓取: ${totalCount}条`)
  
  return totalCount
}

module.exports = {
  crawlBossZhipin,
  crawlZhaopin,
  crawl51Job,
  crawlAll,
}
