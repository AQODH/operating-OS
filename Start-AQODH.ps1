$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeExecutable=(Get-Command node -ErrorAction Stop).Source
$npmEntry=Join-Path (Split-Path -Parent $nodeExecutable) 'node_modules\npm\bin\npm-cli.js'
if(-not(Test-Path -LiteralPath $npmEntry)){throw 'Install the official Node.js 24 runtime before starting AQODH.'}
if(-not(Test-Path -LiteralPath 'node_modules\vinext\package.json')){& $nodeExecutable $npmEntry ci;if($LASTEXITCODE -ne 0){throw 'Package installation did not complete.'}}
Write-Host 'AQODH local trial opens at http://127.0.0.1:5173/'
& $nodeExecutable $npmEntry run dev
