$ErrorActionPreference = 'Continue'
$proj = 'D:\Chronica\kiroween\stitched-ledger'
$web = $proj + '\web'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }
'chrome exists: ' + (Test-Path $chrome)
$server = Start-Process node -ArgumentList @($proj + '\session-logs\serve.mjs','8931',$web) -PassThru -NoNewWindow
Start-Sleep -Seconds 2
try {
  $dom = & $chrome --headless=new --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=10000 'http://127.0.0.1:8931/index.html?verify=1' 2>$null
  ($dom -join "`n") | Out-File -Encoding utf8 ($proj + '\session-logs\browser-dom.html')
  'DOM length: ' + ($dom -join "`n").Length
} finally {
  if ($server) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
}
