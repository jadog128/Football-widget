; Custom NSIS script — runs before install and uninstall.
; Kills any running Football Widget instance so the new files can be written.

!macro customInstall
  DetailPrint "Closing any running Football Widget..."
  nsExec::Exec 'taskkill /F /IM "Football Widget.exe" /T'
  Sleep 800
!macroend

!macro customUnInstall
  DetailPrint "Closing Football Widget before removal..."
  nsExec::Exec 'taskkill /F /IM "Football Widget.exe" /T'
  Sleep 500
!macroend
