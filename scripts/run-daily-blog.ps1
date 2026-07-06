# Osentic daily blog auto-publish (scheduler entry)
# Flow: keyword-refine -> pick 3 -> Claude(headless) writes posts JSON -> publish-blog -> IndexNow -> Telegram
# Korean strings are handled inside node scripts to avoid PS 5.1 encoding issues.
$ErrorActionPreference = 'Continue'
$proj = Split-Path -Parent $PSScriptRoot   # scripts의 부모 = 프로젝트 루트 (한글 리터럴 회피)
Set-Location $proj
$date = Get-Date -Format 'yyyyMMdd'
$log  = Join-Path $proj "outputs\04-marketing\_daily_blog_$date.log"
function Log($m) { $line = "$((Get-Date).ToString('HH:mm:ss')) $m"; Add-Content -Path $log -Value $line -Encoding UTF8; Write-Host $line }

Log "=== daily blog start ($date) ==="

# 1) refresh refined keywords + pick today's 3 (exclude already-published, target diversity)
& node scripts/keyword-refine.mjs 2>&1 | Add-Content $log -Encoding UTF8
& node scripts/pick-keywords.mjs 3 --out "out\today-keywords.json" 2>&1 | Add-Content $log -Encoding UTF8
if (-not (Test-Path "out\today-keywords.json")) {
  Log "FAIL: keyword pick"; & node scripts/notify-daily.mjs $date fail; exit 1
}

# 1.5) keyword engine content plans (intent/type/priority + winning title patterns; brand_bias feedback)
try {
  $todayKw = Get-Content -Raw -Encoding UTF8 "out\today-keywords.json" | ConvertFrom-Json
  foreach ($k in $todayKw) { & node 'D:\키워드엔진\plan.js' "$($k.keyword)" authenticart 2>&1 | Add-Content $log -Encoding UTF8 }
} catch { Log "WARN: content plan generation failed ($($_.Exception.Message))" }

# 2) build prompt with engine learning digest (win/loss feedback) + Claude writes posts JSON (no publish)
& node scripts/build-prompt.mjs $date 2>&1 | Add-Content $log -Encoding UTF8
# 2.1) append content plan guidance to the prompt (engine decisions -> writing guidance)
try {
  $brief = (& node 'D:\키워드엔진\plans_brief.js' authenticart | Out-String).Trim()
  if ($brief) { Add-Content -Path "out\daily-prompt-final.txt" -Value "`n$brief" -Encoding UTF8 }
} catch { Log "WARN: plans_brief append failed" }
$posts  = "outputs\04-marketing\posts-auto-$date.json"
Log "Claude generating drafts (with learning digest)..."
$prompt = Get-Content -Raw -Encoding UTF8 "out\daily-prompt-final.txt"
$prompt | & claude --print --dangerously-skip-permissions 2>&1 | Add-Content $log -Encoding UTF8

# 2.5) quality gate: check -> if flagged, Claude reviews context & fixes once -> recheck
if (Test-Path $posts) {
  & node scripts/check-content.mjs $posts 2>&1 | Add-Content $log -Encoding UTF8
  if ($LASTEXITCODE -ne 0) {
    Log "quality gate flagged -> Claude review/fix"
    $fix = (Get-Content -Raw -Encoding UTF8 "scripts\daily-blog-fix-prompt.txt").Replace('{{DATE}}', $date)
    $fix | & claude --print --dangerously-skip-permissions 2>&1 | Add-Content $log -Encoding UTF8
    & node scripts/check-content.mjs $posts 2>&1 | Add-Content $log -Encoding UTF8
  }
}

# 3) publish (deterministic) + featured rotation + index + notify
if (Test-Path $posts) {
  & node scripts/publish-blog.mjs $posts 2>&1 | Add-Content $log -Encoding UTF8
  & node scripts/rotate-featured.mjs 3 2>&1 | Add-Content $log -Encoding UTF8
  & node scripts/indexnow-submit-all.mjs 2>&1 | Add-Content $log -Encoding UTF8
  & node scripts/notify-daily.mjs $date ok
  Log "=== done ==="
} else {
  Log "FAIL: draft JSON not created"
  & node scripts/notify-daily.mjs $date fail
}
