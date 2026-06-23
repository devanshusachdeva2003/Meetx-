$targetDir = "C:\Users\sunil\OneDrive\Desktop\Meetx-\frontend\src"

$replacements = @(
    @{ regex = 'text-white'; replace = 'text-foreground' },
    @{ regex = 'text-gray-200'; replace = 'text-foreground' },
    @{ regex = 'text-gray-300'; replace = 'text-muted-foreground' },
    @{ regex = 'text-gray-400'; replace = 'text-muted-foreground' },
    @{ regex = 'text-gray-500'; replace = 'text-muted-foreground' },
    @{ regex = 'bg-\[#0a0a0b\]'; replace = 'bg-background' },
    @{ regex = 'bg-\[#13131A\]'; replace = 'bg-card' },
    @{ regex = 'bg-gray-800'; replace = 'bg-muted' },
    @{ regex = 'bg-gray-900'; replace = 'bg-muted' },
    @{ regex = 'border-border\/50'; replace = 'border-border' },
    @{ regex = 'border-white\/10'; replace = 'border-border hover:border-primary/50' }
)

$files = Get-ChildItem -Path $targetDir -Recurse | Where-Object { $_.Extension -match '\.(jsx|tsx|js)$' }

foreach ($file in $files) {
    $content = Get-Content -Raw $file.FullName
    $originalContent = $content

    foreach ($rep in $replacements) {
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, $rep.regex, $rep.replace)
    }

    if ($content -cne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Theme replacement complete."
