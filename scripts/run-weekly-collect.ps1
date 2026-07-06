# Osentic weekly keyword re-collection (run-job wrapper target; .ps1 required by run-job -Script)
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path -Parent $PSScriptRoot)   # 한글 리터럴 회피
node scripts/weekly-collect.mjs
