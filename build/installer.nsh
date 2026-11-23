!macro customCheckAppRunning
  !define UniqueLine ${__LINE__}

  DetailPrint "Checking for running instances of ${PRODUCT_NAME}..."

  Push $0
  Push $1
  Push $2

  ; Loop up to 4 times to check and safely close FocusToDoPro.exe
  StrCpy $1 0

  check_running_loop_${UniqueLine}:
    IntOp $1 $1 + 1

    ; Exact executable search using tasklist and findstr
    nsExec::Exec `"$CmdPath" /C tasklist /FI "IMAGENAME eq ${APP_EXECUTABLE_FILENAME}" /FO CSV /NH | "$SYSDIR\findstr.exe" /B /I /C:"\"${APP_EXECUTABLE_FILENAME}\""`
    Pop $0

    ; If tasklist/findstr returned 0, FocusToDoPro.exe is currently running
    ${if} $0 == 0
      ${if} $1 <= 3
        DetailPrint `Terminating running ${PRODUCT_NAME} process (attempt $1)...`
        ; Terminate process tree forcefully without blocking
        nsExec::Exec `"$CmdPath" /C taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
        Pop $2
        Sleep 800
        Goto check_running_loop_${UniqueLine}
      ${else}
        ; If still running after 3 automatic attempts, prompt the user
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "${PRODUCT_NAME} is still running. Please close it and click Retry to continue the update." IDRETRY check_running_loop_${UniqueLine}
        Quit
      ${endif}
    ${else}
      DetailPrint "${PRODUCT_NAME} is closed."
    ${endif}

  Pop $2
  Pop $1
  Pop $0

  !undef UniqueLine
!macroend
