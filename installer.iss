; Inno Setup 6 Script for Orbit Launcher
#define MyAppName "Orbit Launcher"
#define MyAppVersion "1.0.7"
#define MyAppPublisher "Orbit Team"
#define MyAppExeName "OrbitLauncher.exe"
#define MyOutputDir "C:\Users\Atuka\Desktop\Idk"

[Setup]
AppId={{D37E5528-66A1-460A-8F32-23C13978A9DE}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Orbit Launcher
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
AllowNoIcons=yes

SetupIconFile=icon.ico
UninstallDisplayIcon={app}\icon.ico
WizardStyle=modern

Compression=lzma2/ultra64
SolidCompression=yes

OutputDir={#MyOutputDir}
OutputBaseFilename=OrbitLauncher-Setup

PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
UsedUserAreasWarning=no

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\dist\OrbitLauncher-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"; IconFilename: "{app}\icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
