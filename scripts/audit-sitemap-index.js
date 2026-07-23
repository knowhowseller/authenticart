// sitemap 전수 색인 감사 — publish_log에 없는 글까지 포함해 진짜 색인률을 낸다.
// 왜: index_audit.js는 publish_log 기반이라 엔진 밖에서 만든 글(절반)이 통계에서 빠진다.
const https = require('https');
const fs = require('fs');
const path = require('path');
const ENGINE = 'D:\\키워드엔진';
const { load } = require(ENGINE + '/lib/env');
const { getAccessToken } = require(ENGINE + '/providers/search_console');
const env = load();
const creds = { clientId: env.SC_CLIENT_ID, clientSecret: env.SC_CLIENT_SECRET, refreshToken: env.SC_REFRESH_TOKEN };

const SITE = 'https://www.authenticart.co.kr/';
const SITEMAP = 'https://www.authenticart.co.kr/sitemap.xml';

const get = (url) => new Promise((res, rej) => {
  https.get(url, (r) => {
    if (r.statusCode >= 300 && r.headers.location) return res(get(r.headers.location));
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
  }).on('error', rej);
});

function post(host, p, token, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const r = https.request({ host, path: p, method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      let d = ''; res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, json: JSON.parse(d || '{}') }); } catch { resolve({ status: res.statusCode, json: {} }); } });
    });
    r.on('error', reject); r.write(data); r.end();
  });
}

(async () => {
  const xml = await get(SITEMAP);
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lm = (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || '';
    return { url: loc, lastmod: lm };
  }).filter((e) => e.url && e.url.includes('/blog/'));

  console.log(`블로그 URL ${entries.length}건 전수 감사 시작`);
  const token = await getAccessToken(creds);
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const r = await post('searchconsole.googleapis.com', '/v1/urlInspection/index:inspect', token, { inspectionUrl: e.url, siteUrl: SITE, languageCode: 'ko' });
    const idx = (r.json.inspectionResult || {}).indexStatusResult || {};
    out.push({
      url: decodeURI(e.url).replace('https://www.authenticart.co.kr', ''),
      lastmod: e.lastmod.slice(0, 10),
      coverage: idx.coverageState || `ERR ${r.status}`,
      lastCrawl: (idx.lastCrawlTime || '').slice(0, 10),
      robots: idx.robotsTxtState || '',
      canonicalMismatch: idx.googleCanonical && idx.userCanonical && idx.googleCanonical !== idx.userCanonical ? 'Y' : '',
    });
    process.stdout.write(`\r  ${i + 1}/${entries.length}`);
    await new Promise((s) => setTimeout(s, 120));
  }
  console.log('');
  // link-boost-unindexed.mjs가 이 파일을 색인 상태의 원천으로 읽는다. 경로를 바꾸면 그쪽도 함께 고칠 것.
  const outFile = path.join(__dirname, '_tmp', 'sitemap-audit.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1), 'utf8');

  const byCov = {};
  out.forEach((o) => { byCov[o.coverage] = (byCov[o.coverage] || 0) + 1; });
  const indexed = out.filter((o) => /색인이 생성되었습니다|Submitted and indexed|Indexed/i.test(o.coverage)).length;
  console.log('\n== 전수 색인 상태 ==');
  Object.entries(byCov).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
  console.log(`\n전수 색인률: ${indexed}/${out.length} (${Math.round((indexed / out.length) * 100)}%)`);
  const mism = out.filter((o) => o.canonicalMismatch).length;
  if (mism) console.log(`⚠ canonical 불일치: ${mism}건`);
  console.log(`저장: ${outFile}`);
})();
