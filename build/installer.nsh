!macro customInit
  ; Replace the legacy uninstaller before the install section launches it.
  ; The normal app-running check can be skipped by the elevated inner installer.
  !ifndef BUILD_UNINSTALLER
    InitPluginsDir
    SetOutPath "$PLUGINSDIR"
    File /oname=FocusToDoPro-new-uninstaller.exe "${UNINSTALLER_OUT_FILE}"
    ClearErrors
    CopyFiles /SILENT "$PLUGINSDIR\FocusToDoPro-new-uninstaller.exe" "$INSTDIR"
    IfErrors customInit_done
    IfFileExists "$INSTDIR\FocusToDoPro-new-uninstaller.exe" 0 customInit_done

    Delete "$INSTDIR\${UNINSTALL_FILENAME}.previous"
    ClearErrors
    IfFileExists "$INSTDIR\${UNINSTALL_FILENAME}" 0 customInit_no_old
    Rename "$INSTDIR\${UNINSTALL_FILENAME}" "$INSTDIR\${UNINSTALL_FILENAME}.previous"
    IfErrors customInit_done

  customInit_no_old:
    ClearErrors
    Rename "$INSTDIR\FocusToDoPro-new-uninstaller.exe" "$INSTDIR\${UNINSTALL_FILENAME}"
    IfErrors customInit_restore_old
    Delete "$INSTDIR\${UNINSTALL_FILENAME}.previous"
    Goto customInit_done

  customInit_restore_old:
    IfFileExists "$INSTDIR\${UNINSTALL_FILENAME}.previous" 0 customInit_done
    Rename "$INSTDIR\${UNINSTALL_FILENAME}.previous" "$INSTDIR\${UNINSTALL_FILENAME}"

  customInit_done:
    SetOutPath "$INSTDIR"
  !endif
!macroend

!macro customCheckAppRunning
  !define UniqueLine ${__LINE__}

  DetailPrint "Checking for running instances of ${PRODUCT_NAME}..."

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
