!macro customCheckAppRunning
  !define UniqueLine ${__LINE__}

  DetailPrint "Preparing safe FocusToDoPro update..."

  ; For the main installer, replace the legacy uninstaller before it is launched.
  ; Older uninstallers can mistake their own process for the application process.
  !ifndef BUILD_UNINSTALLER
    SetOutPath "$PLUGINSDIR"
    File /oname=FocusToDoPro-new-uninstaller.exe "${UNINSTALLER_OUT_FILE}"
    CopyFiles /SILENT "$PLUGINSDIR\FocusToDoPro-new-uninstaller.exe" "$INSTDIR"
    Delete "$INSTDIR\${UNINSTALL_FILENAME}"
    Rename "$INSTDIR\FocusToDoPro-new-uninstaller.exe" "$INSTDIR\${UNINSTALL_FILENAME}"
    SetOutPath "$INSTDIR"
  !endif

  Push $0
  Push $1
  Push $2

  StrCpy $1 0

  check_running_loop_${UniqueLine}:
    IntOp $1 $1 + 1

    ; Search only for the exact application executable name.
    nsExec::Exec `"$CmdPath" /C tasklist /FI "IMAGENAME eq ${APP_EXECUTABLE_FILENAME}" /FO CSV /NH | "$SYSDIR\findstr.exe" /I /C:"${APP_EXECUTABLE_FILENAME}"`
    Pop $0

    ${if} $0 == 0
      DetailPrint `Closing running ${PRODUCT_NAME} process (attempt $1)...`
      nsExec::Exec `"$CmdPath" /C taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
      Pop $2
      Sleep 1500

      nsExec::Exec `"$CmdPath" /C tasklist /FI "IMAGENAME eq ${APP_EXECUTABLE_FILENAME}" /FO CSV /NH | "$SYSDIR\findstr.exe" /I /C:"${APP_EXECUTABLE_FILENAME}"`
      Pop $0

      ${if} $0 == 0
        ${if} $1 < 4
          Goto check_running_loop_${UniqueLine}
        ${else}
          MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "${PRODUCT_NAME} is still running. Close it manually, then click Retry." IDRETRY check_running_loop_${UniqueLine}
          Quit
        ${endif}
      ${endif}
    ${endif}

  DetailPrint "${PRODUCT_NAME} is closed. Continuing installation."

  Pop $2
  Pop $1
  Pop $0

  !undef UniqueLine
!macroend
