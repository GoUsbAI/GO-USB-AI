"$env:USERPROFILE\Desktop" | Out-Null

# 打开百度页面
Start-Process https://www.baidu.com -Verb Open

# 等待页面加载（5秒）
Start-Sleep -Seconds 5

# 捕获全屏截图并保存到桌面
Add-Type -AssemblyName System.Windows.Forms
$form = New-Object Windows.Forms.Form
$form.Width = 1920
$form.Height = 1080
$form.Visible = $true
$bitmap = New-Object Windows.Graphics.Imaging.BitmapImage
$bitmap.SetSource($form)
[System.IO.File]::WriteAllBytes("$env:USERPROFILE\Desktop\Baidu_Screenshot.png", $bitmap.Bytes)