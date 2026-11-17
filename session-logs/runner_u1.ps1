Set-Location 'D:\Chronica\kiroween\stitched-ledger'
$prompt = @'
Read .kiro/steering/principles.md, .kiro/specs/ui-design.md (section: Web build), and .kiro/specs/ui-tasks.md. Then execute session U1 exactly as specified: create tsconfig.web.json, web/package.json, and tools/gen-data.mjs; run node tools/gen-data.mjs to generate src/ui/ledger-data.ts and src/ui/exam-data.ts; then run npx tsc -p tsconfig.web.json --noEmit and report the results. Modify no other files. Do not run npm install.
'@
& 'C:\Users\aurel\AppData\Local\Kiro-Cli\kiro-cli.exe' chat --no-interactive --trust-all-tools --trust-workspace $prompt *>&1 | Out-File -Encoding utf8 'session-logs\u1-webdata.log'
