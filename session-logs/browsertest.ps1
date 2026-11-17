$ErrorActionPreference = 'Continue'
$web = 'D:\Chronica\kiroween\stitched-ledger\web'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }
'chrome exists: ' + (Test-Path $chrome)
$server = Start-Process python -ArgumentList @('-m','http.server','8931','--directory',$web) -PassThru -NoNewWindow
Start-Sleep -Seconds 2
try {
  $dom = & $chrome --headless=new --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=10000 'http://127.0.0.1:8931/index.html?verify=1' 2>$null
  $dom | Out-File -Encoding utf8 'D:\Chronica\kiroween\stitched-ledger\session-logs\browser-dom.html'
  'DOM length: ' + ($dom -join "`n").Length
} finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
