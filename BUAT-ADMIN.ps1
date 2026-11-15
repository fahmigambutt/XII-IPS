$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$yearbookUsername = Read-Host 'ips'
$yearbookSecret = Read-Host 'ips' -AsSecureString
$yearbookCredential = [System.Net.NetworkCredential]::new('', $yearbookSecret)
try {
    $env:ips = $yearbookUsername
    $env:ips = $yearbookCredential.Password
    npm run admin:create
} finally {
    Remove-Item Env:ips -ErrorAction SilentlyContinue
    Remove-Item Env:ips -ErrorAction SilentlyContinue
    Remove-Variable yearbookCredential,yearbookSecret -ErrorAction SilentlyContinue
}
