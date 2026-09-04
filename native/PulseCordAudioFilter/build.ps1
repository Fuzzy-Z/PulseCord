$cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$outDir = "$PSScriptRoot\..\bin"
$outFile = "$outDir\PulseCordAudioFilter.exe"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

Write-Host "Compilando PulseCord Audio Filter (C# Microservice)..." -ForegroundColor Cyan

$sources = "$PSScriptRoot\Program.cs", "$PSScriptRoot\WasapiLoopback.cs"

& $cscPath /target:exe /platform:x64 /optimize+ /out:$outFile $sources

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilação concluída com sucesso: $outFile" -ForegroundColor Green
} else {
    Write-Host "Erro na compilação!" -ForegroundColor Red
}
