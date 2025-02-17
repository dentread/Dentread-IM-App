!macro customUnInstall
  DetailPrint "Checking if DentreadIMApp is running..."

  ; Check if the app is running (DentreadIMApp.exe)
  nsExec::ExecToStack "tasklist | findstr /I 'DentreadIMApp.exe'"
  Pop $R0

  ; If the app is running, prompt the user
  ${If} $R0 != 0
    MessageBox MB_ICONEXCLAMATION|MB_OKCANCEL "Dentread IM App is currently running. Please close the app before uninstalling. Do you want to continue uninstalling?" IDOK continueInstall
  ${Else}
    ; If the app isn't running, proceed with uninstallation immediately
    DetailPrint "Dentread IM App is not running. Proceeding with uninstallation."
    Goto continueInstall
  ${EndIf}

  ; Get user response from the stack (only needed if the app was running)
  Pop $R2  

  ${If} $R2 == "IDOK"  ; User chose to continue
    DetailPrint "User chose to continue with uninstall."

    ; Automatically close the app processes
    ExecWait 'taskkill /F /IM DentreadIMApp.exe /T'     ; Close main app
    ExecWait 'taskkill /F /IM electron.exe /T'          ; Close Electron process
    ExecWait 'taskkill /F /IM node.exe /T'              ; Close Node.js process
    ExecWait 'taskkill /F /IM notificationProcess.exe /T'  ; Close notification process (adjust if needed)

    DetailPrint "App processes terminated."
  ${Else}
    DetailPrint "User canceled the uninstallation."
    Abort
  ${EndIf}

  ; Proceed with uninstallation
  continueInstall:
  DetailPrint "Proceeding with uninstallation..."
  ; Your uninstallation logic here (e.g., delete files, remove registry entries, etc.)
!macroend
