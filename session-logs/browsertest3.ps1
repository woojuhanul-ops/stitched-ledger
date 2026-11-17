$ErrorActionPreference = 'Continue'
$proj = 'D:\Chronica\kiroween\stitched-ledger'
$web = $proj + '\web'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$server = Start-Process node -ArgumentList @($proj + '\session-logs\serve.mjs','8931',$web) -PassThru -NoNewWindow
Start-Sleep -Seconds 2
try {
  $dom = & $chrome --headless=new --disable-gpu --no-sandbox --user-data-dir=($proj + '\session-logs\chrome-profile') --dump-dom --virtual-time-budget=10000 'http://127.0.0.1:8931/index.html?verify=1' 2>($proj + '\session-logs\chrome-stderr.log')
  ($dom -join "`n") | Out-File -Encoding utf8 ($proj + '\session-logs\browser-dom.html')
  'DOM length: ' + ($dom -join "`n").Length
} finally {
  if ($server) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
}
