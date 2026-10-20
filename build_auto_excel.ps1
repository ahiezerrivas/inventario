$src = "C:\Users\admin-c606415\Documents\inventario\Prueba de Inventario avance.xlsx"
$out = "C:\Users\admin-c606415\Documents\inventario\Prueba de Inventario avance_auto.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.DisplayAlerts = $false
$excel.Visible = $false

$wb = $excel.Workbooks.Open($src)
$wsSede = $wb.Worksheets.Item("Inventario Sede")
$wsOficina = $wb.Worksheets.Item("Inventario Oficina")

$formulaSede = '=IFERROR(INDEX(''Inventario Global''!A:A,AGGREGATE(15,6,ROW(''Inventario Global''!$A$4:$A$20000)/(''Inventario Global''!$B$4:$B$20000=""Sede""),ROWS($A$10:A10))),"""")'
$formulaOficina = '=IFERROR(INDEX(''Inventario Global''!A:A,AGGREGATE(15,6,ROW(''Inventario Global''!$A$4:$A$20000)/(''Inventario Global''!$B$4:$B$20000=""Oficina""),ROWS($A$4:A4))),"""")'

$wsSede.Range("A10").Formula = $formulaSede
$wsSede.Range("A10").AutoFill($wsSede.Range("A10:Z10"))
$wsSede.Range("A10:Z10").AutoFill($wsSede.Range("A10:Z15000"))

$wsOficina.Range("A4").Formula = $formulaOficina
$wsOficina.Range("A4").AutoFill($wsOficina.Range("A4:Z4"))
$wsOficina.Range("A4:Z4").AutoFill($wsOficina.Range("A4:Z15000"))

$wb.SaveAs($out, 51)
$wb.Close($true)
$excel.Quit()

[System.Runtime.Interopservices.Marshal]::ReleaseComObject($wsOficina) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($wsSede) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
