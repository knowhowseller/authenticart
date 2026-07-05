# Osentic weekly keyword re-collection (run-job wrapper target; .ps1 required by run-job -Script)
$ErrorActionPreference = 'Continue'
Set-Location 'C:\Users\노하우셀러\authenticart'
node scripts/weekly-collect.mjs
