!macro customUnInstall
  DetailPrint "Checking if DentreadIMApp is running..."

  ; Check if the app is running
  nsExec::ExecToStack "tasklist | findstr /I DentreadIMApp.exe"
  Pop $R0

  ; If the app is running, prompt the user
  ${If} $R0 != 0
    MessageBox MB_ICONEXCLAMATION|MB_OKCANCEL "Dentread IM App is currently running. Please close the app before uninstalling. Do you want to continue uninstalling?" IDOK continueInstall
    ${If} $IDOK == 1
      DetailPrint "User chose to continue with uninstall."

      ; Automatically close the app processes (main app, Electron, Node, and others)
      ExecWait 'taskkill /F /IM DentreadIMApp.exe /T'    ; Close main app
      ExecWait 'taskkill /F /IM electron.exe /T'          ; Close Electron process
      ExecWait 'taskkill /F /IM node.exe /T'              ; Close Node.js process
      ExecWait 'taskkill /F /IM notificationProcess.exe /T'  ; Close any background notification process (adjust if needed)

      DetailPrint "App processes terminated."
    ${EndIf}
  ${EndIf}

  ; Proceed with uninstallation
  DetailPrint "Proceeding with uninstallation..."
!macroend
