/**
 * Generates a complete, single-file HTML Invoice Generator web application
 * using HTML, Tailwind CSS, FontAwesome icons, and Vanilla JavaScript with browser localStorage.
 * Includes PIN & Biometric (Fingerprint/WebAuthn) security lock system.
 */
export const downloadStandaloneHtmlApp = () => {
  const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>InvoiceFlow - Single-File Invoice Generator</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- FontAwesome 6 CDN -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Firebase Web SDK App, Auth & Firestore -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    @media print {
      body * { visibility: hidden; }
      #printModal, #printModal * { visibility: visible; }
      #printModal { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased selection:bg-slate-900 selection:text-white">

  <!-- FULLSCREEN SECURITY LOCK SCREEN OVERLAY -->
  <div id="securityLockScreen" class="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-4 transition-all duration-300">
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-5">
      <div class="space-y-1.5">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center text-2xl shadow-lg mx-auto border border-emerald-300/30">
          <i class="fa-solid fa-lock"></i>
        </div>
        <h1 id="lockScreenStoreName" class="text-xl font-black tracking-tight text-white">Al-Madina Trading</h1>
        <p class="text-xs text-emerald-400 font-medium tracking-wide">
          <i class="fa-solid fa-shield-halved mr-1"></i> Security Lock Screen
        </p>
        <p class="text-xs text-slate-400">Enter 4-digit Passcode PIN or use Fingerprint unlock</p>
      </div>

      <!-- 4 PIN Dots -->
      <div id="pinDotsContainer" class="flex items-center justify-center gap-4 py-2">
        <div id="pinDot0" class="w-4 h-4 rounded-full border-2 bg-slate-800 border-slate-600 transition-all duration-200"></div>
        <div id="pinDot1" class="w-4 h-4 rounded-full border-2 bg-slate-800 border-slate-600 transition-all duration-200"></div>
        <div id="pinDot2" class="w-4 h-4 rounded-full border-2 bg-slate-800 border-slate-600 transition-all duration-200"></div>
        <div id="pinDot3" class="w-4 h-4 rounded-full border-2 bg-slate-800 border-slate-600 transition-all duration-200"></div>
      </div>

      <!-- Error / Status message -->
      <div id="lockScreenError" class="min-h-[24px] text-xs font-semibold text-rose-400"></div>

      <!-- Keypad -->
      <div class="grid grid-cols-3 gap-3 w-full max-w-[270px]">
        <button type="button" onclick="handleNumpadDigit('1')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">1</button>
        <button type="button" onclick="handleNumpadDigit('2')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">2</button>
        <button type="button" onclick="handleNumpadDigit('3')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">3</button>
        <button type="button" onclick="handleNumpadDigit('4')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">4</button>
        <button type="button" onclick="handleNumpadDigit('5')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">5</button>
        <button type="button" onclick="handleNumpadDigit('6')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">6</button>
        <button type="button" onclick="handleNumpadDigit('7')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">7</button>
        <button type="button" onclick="handleNumpadDigit('8')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">8</button>
        <button type="button" onclick="handleNumpadDigit('9')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">9</button>
        
        <button type="button" id="btnBiometricOrClear" onclick="handleBiometricOrClearClick()" class="h-13 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/50 flex flex-col items-center justify-center py-2 text-xs font-bold">
          <i class="fa-solid fa-fingerprint text-base"></i>
          <span class="text-[9px]">Biometric</span>
        </button>
        <button type="button" onclick="handleNumpadDigit('0')" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 py-3">0</button>
        <button type="button" onclick="handleNumpadBackspace()" class="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-slate-800 flex items-center justify-center py-3 text-lg">
          <i class="fa-solid fa-delete-left"></i>
        </button>
      </div>

      <!-- Quick Fingerprint Action -->
      <div id="quickBioContainer" class="w-full max-w-[270px]">
        <button type="button" onclick="triggerWebAuthnBiometric()" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow flex items-center justify-center gap-2">
          <i class="fa-solid fa-fingerprint text-base"></i>
          <span>Unlock with Fingerprint / Face ID</span>
        </button>
      </div>

      <div class="pt-2">
        <button type="button" onclick="resetPinSecurityModal()" class="text-[11px] text-slate-500 hover:text-slate-400 underline">
          Forgot Passcode PIN?
        </button>
      </div>
    </div>
  </div>

  <!-- Desktop Header -->
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 no-print">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          <i class="fa-solid fa-receipt"></i>
        </div>
        <div>
          <span class="text-lg font-bold tracking-tight text-slate-900 block leading-tight">InvoiceFlow</span>
          <span class="text-[11px] text-slate-500 font-medium leading-none">Rupees (Rs.) Ledger & Billing</span>
        </div>
      </div>

      <!-- Navigation Bar Tabs: Store Info & Security | Create Invoice | Customers | History | Monthly | Yearly -->
      <nav class="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button onclick="switchTab('store')" id="tab-btn-store" class="tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 min-h-[36px]">
          <i class="fa-solid fa-store text-xs"></i> Store Info & Security
        </button>
        <button onclick="switchTab('create')" id="tab-btn-create" class="tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-slate-900 shadow-sm flex items-center gap-1.5 min-h-[36px]">
          <i class="fa-solid fa-plus text-xs"></i> Create Invoice
        </button>
        <button onclick="switchTab('customers')" id="tab-btn-customers" class="tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 min-h-[36px]">
          <i class="fa-solid fa-users text-xs"></i> Customers
        </button>
        <button onclick="switchTab('history')" id="tab-btn-history" class="tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 min-h-[36px]">
          <i class="fa-solid fa-clock-rotate-left text-xs"></i> History
        </button>
        <button onclick="switchTab('monthly')" id="tab-btn-monthly" class="tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 min-h-[36px]">
          <i class="fa-solid fa-calendar-days text-xs"></i> Monthly
        </button>
        <button onclick="switchTab('yearly')" id="tab-btn-yearly" class="tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 min-h-[36px]">
          <i class="fa-solid fa-chart-line text-xs"></i> Yearly
        </button>
      </nav>

      <div class="flex items-center gap-2">
        <button type="button" id="btnHeaderLock" onclick="lockAppNow()" class="px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg min-h-[36px] flex items-center gap-1.5" title="Lock App Screen">
          <i class="fa-solid fa-lock text-xs"></i> <span class="hidden sm:inline">Lock</span>
        </button>
        <button onclick="switchTab('create'); resetFormToEmpty();" class="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm min-h-[36px] flex items-center gap-1.5">
          <i class="fa-solid fa-file-circle-plus text-xs"></i> New Invoice
        </button>
      </div>
    </div>
  </header>

  <!-- Quick Info Ribbon -->
  <div class="bg-emerald-800 text-emerald-50 text-xs px-4 py-2 border-b border-emerald-900/40 no-print">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 truncate">
        <span id="ribbonStoreName" class="font-bold tracking-wide truncate">Al-Madina Trading & Wholesale</span>
        <span class="opacity-60 hidden sm:inline">·</span>
        <span id="ribbonStorePhone" class="opacity-90 hidden sm:inline">+92 300 8889900</span>
        <span id="ribbonSecurityBadge" class="hidden lg:inline-flex items-center gap-1 text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-200 border border-emerald-700/50">
          <i class="fa-solid fa-lock text-[9px]"></i> PIN Protected
        </span>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button onclick="lockAppNow()" class="text-[11px] font-semibold bg-rose-900/80 hover:bg-rose-800 px-2 py-0.5 rounded text-rose-100 shadow-xs flex items-center gap-1">
          <i class="fa-solid fa-lock text-[10px]"></i> Lock
        </button>
        <span class="opacity-60">·</span>
        <button onclick="switchTab('store')" class="text-[11px] underline opacity-90 hover:opacity-100 font-medium">
          Store & Security
        </button>
      </div>
    </div>
  </div>

  <!-- Notification Toast -->
  <div id="toast" class="fixed top-4 right-4 z-50 transform transition-all duration-300 translate-y-[-100px] opacity-0 pointer-events-none bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2">
    <i id="toastIcon" class="fa-solid fa-circle-check text-emerald-400"></i>
    <span id="toastMsg" class="font-medium">Message</span>
  </div>

  <!-- Main Viewport -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">

    <!-- 1. STORE INFO & SECURITY VIEW -->
    <div id="view-store" class="tab-view hidden space-y-6">
      <div class="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold text-slate-900">Store Info & Security Settings</h2>
            <span id="secStatusBadge" class="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-200">
              PIN Protection Active
            </span>
          </div>
          <p class="text-xs text-slate-600 mt-0.5">
            Configure shop branding for invoice headers and protect ledger access with a 4-digit PIN and Biometrics.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="lockAppNow()" class="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg">
            <i class="fa-solid fa-lock text-xs mr-1"></i> Lock App
          </button>
          <button onclick="switchTab('create')" class="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-1.5 min-h-[36px]">
            <i class="fa-solid fa-file-invoice text-xs"></i> Create Invoice
          </button>
        </div>
      </div>

      <!-- 2 Tabs: Store Info vs PIN Security -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Store Info Form (6 Cols) -->
        <div class="lg:col-span-6 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-store text-emerald-700"></i> Edit Store Details
            </h3>
            <span class="text-[11px] text-slate-500">Saved in localStorage</span>
          </div>

          <form onsubmit="saveStoreInfoFromForm(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Shop / Business Name *</label>
              <div class="relative">
                <i class="fa-solid fa-building absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="text" id="storeFormName" required class="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-300">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp Number *</label>
                <div class="relative">
                  <i class="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input type="text" id="storeFormPhone" required class="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300">
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Tagline / Header Note</label>
                <div class="relative">
                  <i class="fa-solid fa-tag absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input type="text" id="storeFormTagline" placeholder="e.g. Quality Rice, Oil & Wholesale Grains" class="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300">
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Business / Shop Address *</label>
              <textarea id="storeFormAddress" rows="3" required class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 resize-none"></textarea>
            </div>

            <div class="pt-3 border-t flex items-center justify-between gap-3">
              <button type="button" onclick="resetStoreInfoDefault()" class="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg">
                <i class="fa-solid fa-rotate-left mr-1"></i> Reset Sample Data
              </button>
              <button type="submit" class="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm">
                <i class="fa-solid fa-floppy-disk mr-1"></i> Save Store Info
              </button>
            </div>
          </form>
        </div>

        <!-- Security & PIN Lock Settings (6 Cols) -->
        <div class="lg:col-span-6 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-shield-halved text-emerald-700"></i> App PIN & Biometric Lock
            </h3>
            <span id="secTabStatusText" class="text-[11px] font-bold text-emerald-700">Active</span>
          </div>

          <!-- Section A: When PIN is NOT set -->
          <div id="secSetupFormContainer" class="space-y-4">
            <div class="p-3 bg-slate-50 border rounded-lg text-xs text-slate-600 space-y-1">
              <p class="font-bold text-slate-800">Set a 4-Digit Passcode PIN</p>
              <p>Locks your billing ledger on every page reload or app restart.</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold mb-1">4-Digit PIN *</label>
                <input type="password" id="secNewPin" maxlength="4" placeholder="••••" class="w-full text-center text-lg font-mono font-bold tracking-widest py-1.5 border rounded-lg">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1">Confirm PIN *</label>
                <input type="password" id="secConfirmPin" maxlength="4" placeholder="••••" class="w-full text-center text-lg font-mono font-bold tracking-widest py-1.5 border rounded-lg">
              </div>
            </div>
            <button type="button" onclick="saveNewPinFromSettings()" class="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow flex items-center justify-center gap-2">
              <i class="fa-solid fa-lock text-xs"></i> Enable PIN Lock
            </button>
          </div>

          <!-- Section B: When PIN IS already set -->
          <div id="secActiveFormContainer" class="space-y-4 hidden">
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span class="font-bold block">4-Digit PIN Protection is Active</span>
                <span class="text-[11px] text-emerald-700">App locks on startup and refresh.</span>
              </div>
              <button type="button" onclick="disablePinLock()" class="text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded">
                Disable PIN
              </button>
            </div>

            <!-- Change PIN -->
            <div class="border-t pt-3 space-y-3">
              <h4 class="text-xs font-bold text-slate-800 uppercase">Change Passcode PIN</h4>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[11px] font-semibold mb-1">Current PIN</label>
                  <input type="password" id="secChangeCurrent" maxlength="4" placeholder="••••" class="w-full text-center font-mono font-bold py-1 border rounded text-xs">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold mb-1">New PIN</label>
                  <input type="password" id="secChangeNew" maxlength="4" placeholder="••••" class="w-full text-center font-mono font-bold py-1 border rounded text-xs">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold mb-1">Confirm New</label>
                  <input type="password" id="secChangeConfirm" maxlength="4" placeholder="••••" class="w-full text-center font-mono font-bold py-1 border rounded text-xs">
                </div>
              </div>
              <button type="button" onclick="changePinFromSettings()" class="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold">
                Update 4-Digit PIN
              </button>
            </div>

            <!-- Biometric Toggle -->
            <div class="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-fingerprint text-emerald-700"></i>
                  <span class="text-xs font-bold text-slate-800">Biometric / Fingerprint Unlock</span>
                </div>
                <p class="text-[11px] text-slate-500">Unlock using mobile fingerprint sensor / Face ID</p>
              </div>
              <button type="button" id="btnToggleBiometrics" onclick="toggleBiometricsFromSettings()" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700">
                OFF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. CREATE INVOICE VIEW -->
    <div id="view-create" class="tab-view space-y-6">
      <!-- Top Store Info Banner -->
      <div class="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/40 via-white to-slate-50/50">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 mt-0.5">
            <i class="fa-solid fa-store"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 id="createHeaderStoreName" class="text-base font-extrabold text-slate-900 tracking-tight">Al-Madina Trading & Wholesale</h2>
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">Active Store</span>
            </div>
            <p id="createHeaderStoreTagline" class="text-xs text-slate-600 font-medium italic mt-0.5">Dealers in Quality Rice, Oil, Grains & Wholesale Grocery</p>
            <div class="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              <span class="flex items-center gap-1">
                <i class="fa-solid fa-phone text-[10px] text-slate-400"></i>
                <strong id="createHeaderStorePhone" class="text-slate-700 font-semibold">+92 300 8889900</strong>
              </span>
              <span class="hidden sm:inline opacity-40">·</span>
              <span class="flex items-center gap-1 truncate max-w-md">
                <i class="fa-solid fa-location-dot text-[10px] text-slate-400"></i>
                <span id="createHeaderStoreAddress">Shop #14, Main Commercial Market, City Center</span>
              </span>
            </div>
          </div>
        </div>
        <button type="button" onclick="switchTab('store')" class="self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 min-h-[34px]">
          <i class="fa-solid fa-pen-to-square text-xs"></i> Edit Store Info
        </button>
      </div>

      <!-- Edit Mode Banner -->
      <div id="editingBanner" class="hidden bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between border border-amber-500/50 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
            <i class="fa-solid fa-pen-to-square"></i>
            <span>Edit Mode</span>
          </span>
          <span id="editingInvNum" class="text-sm font-mono font-bold text-white">#INV-001</span>
        </div>
        <button type="button" onclick="cancelEdit()" class="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1">
          <i class="fa-solid fa-xmark text-xs"></i>
          <span>Cancel Edit</span>
        </button>
      </div>

      <div class="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900">Create New Invoice</h2>
          <p class="text-xs text-slate-600 mt-0.5">Select customer · Enter items · Enter payment · Auto-resets on save.</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="resetFormToEmpty()" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
            <i class="fa-solid fa-arrows-rotate mr-1"></i> Clear Form
          </button>
          <button type="button" onclick="handleFormShareWhatsApp()" class="px-3 py-1.5 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-lg">
            <i class="fa-brands fa-whatsapp mr-1"></i> WhatsApp
          </button>
          <button type="button" onclick="saveInvoiceFromForm(true)" class="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg">
            <i class="fa-solid fa-print mr-1 text-rose-600"></i> Generate PDF
          </button>
          <button type="button" onclick="saveInvoiceFromForm(false)" class="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm">
            <i class="fa-solid fa-floppy-disk mr-1"></i> Save Invoice
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Selection Card -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <i class="fa-solid fa-user-tag text-emerald-700"></i> Customer Selection
            </h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Select Customer</label>
                <select id="invCustomerSelect" onchange="onCustomerSelectChange()" class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white">
                  <option value="custom">+ Type New Customer Manually</option>
                </select>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                  <input type="text" id="invCustomerName" placeholder="e.g. Ahmed Ali & Sons" class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input type="tel" id="invCustomerPhone" placeholder="e.g. +92 300 1234567" class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300">
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Details -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-2">
              <i class="fa-solid fa-hashtag text-slate-500"></i> Invoice Meta
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Invoice Number *</label>
                <input type="text" id="invNumber" class="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Invoice Date *</label>
                <input type="date" id="invDate" class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300">
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div class="flex items-center justify-between border-b pb-2">
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                <i class="fa-solid fa-boxes-stacked text-emerald-700"></i> Items List
              </h3>
              <button type="button" onclick="addItemRow()" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg">
                + Add Item
              </button>
            </div>
            <div id="itemsContainer" class="space-y-2"></div>
          </div>
        </div>

        <!-- Ledger & Calculations Card -->
        <div class="space-y-4">
          <div class="bg-slate-900 text-white p-5 rounded-xl space-y-3.5 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="text-xs uppercase font-bold text-slate-400">Calculation Ledger</span>
              <span class="text-xs font-mono text-emerald-400 font-semibold">Rupees (Rs.)</span>
            </div>
            <div class="space-y-3 text-xs text-slate-300">
              <div class="flex justify-between items-center">
                <span>1. Items Subtotal:</span>
                <span id="dispSubtotal" class="font-mono text-white font-bold text-sm">Rs. 0.00</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-slate-800">
                <span>2. Previous Balance:</span>
                <input type="number" id="invPrevBalance" oninput="recalculate()" value="0" step="0.01" class="w-24 px-2 py-0.5 text-xs font-mono text-right bg-slate-800 border border-slate-700 rounded text-amber-300">
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-slate-800">
                <span class="font-bold text-white">3. Total Bill:</span>
                <span id="dispTotalBill" class="font-mono text-emerald-400 font-bold text-base">Rs. 0.00</span>
              </div>
              <div class="bg-slate-800/60 p-2.5 rounded-lg space-y-1">
                <div class="flex justify-between items-center text-xs font-semibold text-sky-300">
                  <span>Payment Received (Rs.):</span>
                  <button type="button" onclick="setFullPayment()" class="text-[10px] text-sky-400 underline">Full Pay</button>
                </div>
                <input type="number" id="invPaymentReceived" oninput="recalculate()" placeholder="0.00" step="0.01" class="w-full px-2 py-1 text-sm font-mono font-bold text-right bg-slate-900 border border-sky-600 rounded text-sky-200">
              </div>
              <div class="pt-2 border-t-2 border-slate-700 flex justify-between items-baseline">
                <span class="font-bold text-white uppercase text-xs">Remaining Balance:</span>
                <span id="dispRemaining" class="text-xl font-mono font-bold text-amber-400">Rs. 0.00</span>
              </div>
            </div>
            <div class="pt-2 flex flex-col gap-2">
              <button type="button" onclick="saveInvoiceFromForm(false)" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow">
                Save Invoice & Auto-Reset
              </button>
              <button type="button" onclick="saveInvoiceFromForm(true)" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700">
                Generate PDF & Auto-Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. CUSTOMERS VIEW -->
    <div id="view-customers" class="tab-view hidden space-y-6">
      <div class="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Customer Management</h2>
          <p class="text-xs text-slate-600 mt-0.5">Manage customer directory and their Current Balance (Rs.).</p>
        </div>
        <button onclick="openCustomerModal()" class="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm">
          + Add Customer
        </button>
      </div>
      <div id="customersList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </div>

    <!-- 4. INVOICE HISTORY VIEW -->
    <div id="view-history" class="tab-view hidden space-y-6">
      <div class="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Invoice History</h2>
          <p class="text-xs text-slate-600 mt-0.5">Cards list with Search, Delete, Print PDF, Edit Invoice, and WhatsApp Share.</p>
        </div>
        <input type="text" id="historySearch" oninput="renderHistory()" placeholder="Search history..." class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 w-full sm:w-64">
      </div>
      <div id="historyList" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
    </div>

    <!-- 5. MONTHLY STATEMENT VIEW -->
    <div id="view-monthly" class="tab-view hidden space-y-6">
      <div class="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-base font-bold text-slate-900">Monthly Statement</h2>
            <span id="monthlyCustomerBadge" class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              All Customers
            </span>
          </div>
          <p id="monthlySubtext" class="text-xs text-slate-600 mt-0.5">
            Total Monthly Sales (Excluding Old Previous Balance), Payments Received & Remaining Balance (Baqaya).
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 min-h-[38px]">
            <i class="fa-solid fa-user-tag text-emerald-700 text-xs"></i>
            <select id="monthlySelectCustomer" onchange="renderMonthlyStatement()" class="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-1 py-1 cursor-pointer max-w-[160px] sm:max-w-[200px]">
              <option value="all">👥 All Customers (Store Total)</option>
            </select>
          </div>
          <div class="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 min-h-[38px]">
            <i class="fa-solid fa-calendar text-slate-500 text-xs"></i>
            <select id="monthlySelectMonth" onchange="renderMonthlyStatement()" class="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-1 py-1 cursor-pointer"></select>
            <span class="text-slate-400">/</span>
            <select id="monthlySelectYear" onchange="renderMonthlyStatement()" class="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-1 py-1 cursor-pointer"></select>
          </div>
          <button onclick="window.print()" id="monthlyPrintBtn" class="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 min-h-[38px]">
            <i class="fa-solid fa-print"></i> <span id="monthlyPrintBtnText">Print Statement</span>
          </button>
        </div>
      </div>

      <!-- 4 KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span class="truncate">Monthly Sales</span>
            <span class="text-[9px] sm:text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">Total Bill</span>
          </div>
          <span id="monthlyRevenue" class="text-base sm:text-lg lg:text-2xl font-black font-mono text-emerald-800 tabular-nums truncate tracking-tight py-0.5 block">Rs. 0.00</span>
          <span class="text-[10px] sm:text-[11px] text-slate-500 truncate block">Excl. old previous bal</span>
        </div>
        <div class="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span class="truncate">Payment Received</span>
            <span class="text-[9px] sm:text-[10px] text-sky-800 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 shrink-0">Cash / Online</span>
          </div>
          <span id="monthlyCash" class="text-base sm:text-lg lg:text-2xl font-black font-mono text-sky-800 tabular-nums truncate tracking-tight py-0.5 block">Rs. 0.00</span>
          <span class="text-[10px] sm:text-[11px] text-slate-500 truncate block">Collected in month</span>
        </div>
        <div class="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span class="truncate">Remaining</span>
            <span class="text-[9px] sm:text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">Baqaya</span>
          </div>
          <span id="monthlyRemaining" class="text-base sm:text-lg lg:text-2xl font-black font-mono text-amber-700 tabular-nums truncate tracking-tight py-0.5 block">Rs. 0.00</span>
          <span class="text-[10px] sm:text-[11px] text-slate-500 truncate block">Sales minus Payments</span>
        </div>
        <div class="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span class="truncate">Total Invoices</span>
            <span class="text-[9px] sm:text-[10px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">Volume</span>
          </div>
          <span id="monthlyCount" class="text-base sm:text-lg lg:text-2xl font-black font-mono text-slate-900 tabular-nums py-0.5 block">0</span>
          <span class="text-[10px] sm:text-[11px] text-slate-500 truncate block">Bills in selected month</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b text-[11px] uppercase text-slate-600">
              <th class="p-2.5">Invoice #</th>
              <th class="p-2.5">Date</th>
              <th class="p-2.5">Client Name</th>
              <th class="p-2.5 text-right font-bold text-emerald-800 bg-emerald-50/50">Total Bill (New Sale)</th>
              <th class="p-2.5 text-right font-bold text-sky-800 bg-sky-50/50">Payment Received</th>
              <th class="p-2.5 text-right font-bold text-amber-800 bg-amber-50/50">Remaining Balance (Baqaya)</th>
              <th class="p-2.5 text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody id="monthlyTableBody" class="divide-y divide-slate-100"></tbody>
        </table>
      </div>
    </div>

    <!-- 6. YEARLY STATEMENT VIEW -->
    <div id="view-yearly" class="tab-view hidden space-y-6">
      <div class="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-base font-bold text-slate-900">Yearly Statement</h2>
            <span id="yearlyCustomerBadge" class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              All Customers
            </span>
          </div>
          <p id="yearlySubtext" class="text-xs text-slate-600 mt-0.5">
            Total Yearly Sales / Total Bill, Payment Received & Remaining Balance (Baqaya).
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 min-h-[38px]">
            <i class="fa-solid fa-user-tag text-emerald-700 text-xs"></i>
            <select id="yearlySelectCustomer" onchange="renderYearlyStatement()" class="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-1 py-1 cursor-pointer max-w-[160px] sm:max-w-[200px]">
              <option value="all">👥 All Customers (Store Total)</option>
            </select>
          </div>
          <div class="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 min-h-[38px]">
            <i class="fa-solid fa-calendar text-slate-500 text-xs"></i>
            <select id="yearlySelectYear" onchange="renderYearlyStatement()" class="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-2 py-1 cursor-pointer"></select>
          </div>
          <button onclick="window.print()" id="yearlyPrintBtn" class="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 min-h-[38px]">
            <i class="fa-solid fa-print"></i> <span id="yearlyPrintBtnText">Print Annual Report</span>
          </button>
        </div>
      </div>

      <!-- 4 KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span class="truncate">Yearly Sales</span>
            <span class="text-[9px] sm:text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">Total Bill</span>
          </div>
          <span id="yearlyRevenue" class="text-base sm:text-lg lg:text-2xl font-black font-mono text-emerald-800 tabular-nums truncate tracking-tight py-0.5 block">Rs. 0.00</span>
          <span class="text-[10px] sm:text-[11px] text-slate-500 truncate block">All bills in selected year</span>
        </div>
        <div class="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span class="truncate">Payment Received</span>
            <span class="text-[9px] sm:text-[10px] text-sky-800 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 shrink-0">Collected</span>
          </div>
          <span id="yearlyCash" class="text-base sm:text-lg lg:text-2xl font-black font-mono text-sky-800 tabular-nums truncate tracking-tight py-0.5 block">Rs. 0.00</span>
          <span class="text-[10px] sm:text-[11px] text-slate-500 truncate block">Collected in year</span>
        </div>
        <div class="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span class="truncate">Remaining</span>
            <span class="text-[9px] sm:text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">Baqaya</span>
          </div>
          <span id="yearlyRemaining" class="text-base sm:text-lg lg:text-2xl font-black font-mono text-amber-700 tabular-nums truncate tracking-tight py-0.5 block">Rs. 0.00</span>
          <span class="text-[10px] sm:text-[11px] text-slate-500 truncate block">Sales minus Payments</span>
        </div>
        <div class="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span class="truncate">Total Invoices</span>
            <span class="text-[9px] sm:text-[10px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">Annual</span>
          </div>
          <span id="yearlyCount" class="text-base sm:text-lg lg:text-2xl font-black font-mono text-slate-900 tabular-nums py-0.5 block">0</span>
          <span class="text-[10px] sm:text-[11px] text-slate-500 truncate block">Invoices for year</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b text-[11px] uppercase text-slate-600">
              <th class="p-2.5">Month</th>
              <th class="p-2.5 text-center w-20">Invoices</th>
              <th class="p-2.5 text-right font-bold text-emerald-800 bg-emerald-50/50">Total Yearly Sales / Total Bill</th>
              <th class="p-2.5 text-right font-bold text-sky-800 bg-sky-50/50">Total Payment Received</th>
              <th class="p-2.5 text-right font-bold text-amber-800 bg-amber-50/50">Remaining Balance (Baqaya)</th>
            </tr>
          </thead>
          <tbody id="yearlyTableBody" class="divide-y divide-slate-100"></tbody>
        </table>
      </div>
    </div>

  </main>

  <!-- Mobile Bottom Tab Navigation (6 Tabs) -->
  <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1.5 grid grid-cols-6 text-center no-print">
    <button onclick="switchTab('store')" id="mob-tab-store" class="flex flex-col items-center py-1 text-slate-500">
      <i class="fa-solid fa-shield-halved text-xs sm:text-sm"></i><span class="text-[9px] mt-0.5 leading-none">Security</span>
    </button>
    <button onclick="switchTab('create')" id="mob-tab-create" class="flex flex-col items-center py-1 text-emerald-700 font-bold">
      <i class="fa-solid fa-file-invoice text-xs sm:text-sm"></i><span class="text-[9px] mt-0.5 leading-none">Create</span>
    </button>
    <button onclick="switchTab('customers')" id="mob-tab-customers" class="flex flex-col items-center py-1 text-slate-500">
      <i class="fa-solid fa-users text-xs sm:text-sm"></i><span class="text-[9px] mt-0.5 leading-none">Clients</span>
    </button>
    <button onclick="switchTab('history')" id="mob-tab-history" class="flex flex-col items-center py-1 text-slate-500">
      <i class="fa-solid fa-clock-rotate-left text-xs sm:text-sm"></i><span class="text-[9px] mt-0.5 leading-none">History</span>
    </button>
    <button onclick="switchTab('monthly')" id="mob-tab-monthly" class="flex flex-col items-center py-1 text-slate-500">
      <i class="fa-solid fa-calendar-days text-xs sm:text-sm"></i><span class="text-[9px] mt-0.5 leading-none">Monthly</span>
    </button>
    <button onclick="switchTab('yearly')" id="mob-tab-yearly" class="flex flex-col items-center py-1 text-slate-500">
      <i class="fa-solid fa-chart-line text-xs sm:text-sm"></i><span class="text-[9px] mt-0.5 leading-none">Yearly</span>
    </button>
  </nav>

  <!-- Printable Invoice Modal -->
  <div id="printModal" class="hidden fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 sm:p-6 flex items-center justify-center">
    <div class="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-auto">
      <div class="flex justify-between items-start border-b pb-4 no-print">
        <span class="text-xs uppercase font-bold text-slate-400">Invoice Print / PDF</span>
        <div class="flex gap-2">
          <button onclick="window.print()" class="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold"><i class="fa-solid fa-print mr-1"></i> Print</button>
          <button onclick="closePrintModal()" class="px-2 py-1 text-slate-500 hover:text-slate-900 text-sm"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div id="printInvoiceContent"></div>
    </div>
  </div>

  <!-- Customer Add/Edit Modal -->
  <div id="customerModal" class="hidden fixed inset-0 z-50 bg-slate-900/50 p-4 flex items-center justify-center">
    <div class="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
      <h3 id="custModalTitle" class="text-sm font-bold text-slate-900 border-b pb-2">Add Customer</h3>
      <input type="hidden" id="custModalId">
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold mb-1">Customer Name *</label>
          <input type="text" id="custModalName" class="w-full px-3 py-2 border rounded-lg">
        </div>
        <div>
          <label class="block font-semibold mb-1">Phone Number *</label>
          <input type="tel" id="custModalPhone" class="w-full px-3 py-2 border rounded-lg">
        </div>
        <div>
          <label class="block font-semibold mb-1">Opening Balance (Rs.) *</label>
          <input type="number" id="custModalBalance" value="0" step="0.01" min="0" class="w-full px-3 py-2 border rounded-lg font-mono">
          <p class="text-[10px] text-slate-400 mt-1">Initial starting balance set ONCE for this customer. Running balance updates dynamically.</p>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeCustomerModal()" class="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
        <button onclick="saveCustomerFromModal()" class="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg">Save</button>
      </div>
    </div>
  </div>

  <!-- Customer Khata / Statement Modal -->
  <div id="khataModal" class="hidden fixed inset-0 z-50 bg-slate-950/70 p-2 sm:p-4 flex items-center justify-center overflow-y-auto">
    <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 my-auto">
      <!-- Modal Header -->
      <div class="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <i class="fa-solid fa-book-open"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 id="khataCustName" class="text-base font-bold text-slate-900">Customer Name</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">Client Ledger</span>
            </div>
            <p class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span><i class="fa-solid fa-phone text-[10px] mr-1 text-slate-400"></i><span id="khataCustPhone">Phone</span></span>
              <span>•</span>
              <span id="khataInvCount">0 Invoices</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="shareActiveKhataWhatsApp()" class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
            <i class="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
            <span>Share on WhatsApp</span>
          </button>
          <button onclick="printActiveKhata()" class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors">
            <i class="fa-solid fa-print text-xs"></i>
            <span>Print PDF</span>
          </button>
          <button onclick="billFromKhata()" class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors">
            <i class="fa-solid fa-plus text-xs"></i>
            <span>New Bill</span>
          </button>
          <button onclick="closeKhataModal()" class="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
        <!-- 4 Summary KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div class="text-[11px] font-semibold text-slate-500 uppercase">1. Opening Balance</div>
            <div id="khataKpiOpening" class="text-base sm:text-xl font-bold font-mono text-slate-800 mt-1">Rs. 0.00</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Initial starting balance</div>
          </div>
          <div class="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
            <div class="text-[11px] font-semibold text-blue-700 uppercase">2. Total Purchases</div>
            <div id="khataKpiPurchases" class="text-base sm:text-xl font-bold font-mono text-blue-900 mt-1">Rs. 0.00</div>
            <div class="text-[10px] text-blue-600/80 mt-0.5">Subtotal bill sum</div>
          </div>
          <div class="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
            <div class="text-[11px] font-semibold text-emerald-700 uppercase">3. Total Payments</div>
            <div id="khataKpiPaid" class="text-base sm:text-xl font-bold font-mono text-emerald-900 mt-1">Rs. 0.00</div>
            <div class="text-[10px] text-emerald-600/80 mt-0.5">Total received cash</div>
          </div>
          <div id="khataKpiDueBox" class="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200">
            <div id="khataKpiDueLabel" class="text-[11px] font-bold text-amber-800 uppercase">4. Net Due Balance</div>
            <div id="khataKpiDue" class="text-base sm:text-xl font-bold font-mono text-amber-900 mt-1">Rs. 0.00</div>
            <div class="text-[10px] text-amber-700 mt-0.5">(Opening + Purchases − Paid)</div>
          </div>
        </div>

        <!-- Ledger Table -->
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <th class="py-2.5 px-3">Date</th>
                  <th class="py-2.5 px-3">Invoice #</th>
                  <th class="py-2.5 px-3">Items / Notes</th>
                  <th class="py-2.5 px-3 text-right">Bill Subtotal</th>
                  <th class="py-2.5 px-3 text-right">Paid</th>
                  <th class="py-2.5 px-3 text-right">Running Ledger</th>
                  <th class="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody id="khataTableBody" class="divide-y divide-slate-100 font-mono">
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div class="text-xs text-slate-500">
          Net Outstanding Balance: <span id="khataFooterDue" class="font-bold font-mono text-slate-900 text-sm">Rs. 0.00</span>
        </div>
        <button onclick="closeKhataModal()" class="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg">Close</button>
      </div>
    </div>
  </div>

  <script>
    // VANILLA JS ENGINE & LOCALSTORAGE STATE
    var STORAGE_KEY_CUSTOMERS = 'invoicegen_customers_v2';
    var STORAGE_KEY_INVOICES = 'invoicegen_invoices_v2';
    var STORAGE_KEY_BUSINESS = 'invoicegen_business_v2';
    var STORAGE_KEY_SECURITY = 'invoicegen_security_v1';
    var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var firebaseConfig = {
      apiKey: "AIzaSyCWP0m0fF0esmF1nTAXhz0ALkPhX9eNyRk",
      authDomain: "invoice-flow-4b4c9.firebaseapp.com",
      projectId: "invoice-flow-4b4c9",
      storageBucket: "invoice-flow-4b4c9.firebasestorage.app",
      messagingSenderId: "746068664458",
      appId: "1:746068664458:web:0d6a81e9412c4693778d73"
    };

    var firebaseApp = null;
    var firebaseAuth = null;
    var firestoreDb = null;
    var currentFirebaseUser = null;

    if (typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps || !firebase.apps.length) {
          firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
          firebaseApp = firebase.app();
        }
        firebaseAuth = firebase.auth();
        firestoreDb = firebase.firestore();
      } catch (e) {
        console.warn('Firebase initialization notice:', e);
      }
    }

    var DEFAULT_STORE_INFO = {
      name: 'Al-Madina Trading & Wholesale',
      phone: '+92 300 8889900',
      address: 'Shop #14, Main Commercial Market, City Center',
      tagline: 'Dealers in Quality Rice, Oil, Grains & Wholesale Grocery'
    };

    var businessInfo = JSON.parse(localStorage.getItem(STORAGE_KEY_BUSINESS) || JSON.stringify(DEFAULT_STORE_INFO));
    var customers = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOMERS) || '[]');
    var invoices = JSON.parse(localStorage.getItem(STORAGE_KEY_INVOICES) || '[]');
    var securityConfig = JSON.parse(localStorage.getItem(STORAGE_KEY_SECURITY) || '{"pinEnabled":false,"pin":"","biometricEnabled":false}');

    var currentPinInput = [];

    function formatRupees(amount) {
      var num = Number(amount) || 0;
      return (num < 0 ? '-' : '') + 'Rs. ' + Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function showToast(msg) {
      var t = document.getElementById('toast');
      document.getElementById('toastMsg').innerText = msg;
      t.classList.remove('translate-y-[-100px]', 'opacity-0', 'pointer-events-none');
      setTimeout(function() { t.classList.add('translate-y-[-100px]', 'opacity-0', 'pointer-events-none'); }, 3000);
    }

    // --- SECURITY & LOCK SCREEN SYSTEM ---
    function initSecurity() {
      var lockScreen = document.getElementById('securityLockScreen');
      var nameEl = document.getElementById('lockScreenStoreName');
      if (nameEl) nameEl.innerText = businessInfo.name || 'InvoiceFlow';

      if (securityConfig && securityConfig.pinEnabled && securityConfig.pin) {
        lockScreen.classList.remove('hidden');
        renderPinDots();
        if (securityConfig.biometricEnabled && window.PublicKeyCredential) {
          document.getElementById('quickBioContainer').classList.remove('hidden');
        } else {
          document.getElementById('quickBioContainer').classList.add('hidden');
        }
      } else {
        lockScreen.classList.add('hidden');
      }
      updateSecurityUI();
    }

    function renderPinDots() {
      for (var i = 0; i < 4; i++) {
        var dot = document.getElementById('pinDot' + i);
        if (dot) {
          if (i < currentPinInput.length) {
            dot.className = 'w-4 h-4 rounded-full border-2 bg-emerald-400 border-emerald-400 shadow-md shadow-emerald-500/50 scale-110 transition-all';
          } else {
            dot.className = 'w-4 h-4 rounded-full border-2 bg-slate-800 border-slate-600 transition-all';
          }
        }
      }
    }

    function handleNumpadDigit(digit) {
      if (currentPinInput.length < 4) {
        currentPinInput.push(digit);
        renderPinDots();
        document.getElementById('lockScreenError').innerText = '';
        if (currentPinInput.length === 4) {
          verifyEnteredPin();
        }
      }
    }

    function handleNumpadBackspace() {
      if (currentPinInput.length > 0) {
        currentPinInput.pop();
        renderPinDots();
        document.getElementById('lockScreenError').innerText = '';
      }
    }

    function handleBiometricOrClearClick() {
      if (securityConfig.biometricEnabled) {
        triggerWebAuthnBiometric();
      } else {
        currentPinInput = [];
        renderPinDots();
        document.getElementById('lockScreenError').innerText = '';
      }
    }

    function verifyEnteredPin() {
      var entered = currentPinInput.join('');
      if (entered === securityConfig.pin) {
        unlockApp();
      } else {
        document.getElementById('lockScreenError').innerText = 'Incorrect 4-Digit PIN. Please try again.';
        var container = document.getElementById('pinDotsContainer');
        container.classList.add('animate-bounce');
        setTimeout(function() {
          container.classList.remove('animate-bounce');
          currentPinInput = [];
          renderPinDots();
        }, 500);
      }
    }

    function unlockApp() {
      var lockScreen = document.getElementById('securityLockScreen');
      lockScreen.classList.add('hidden');
      currentPinInput = [];
      renderPinDots();
      showToast('Unlocked successfully!');
    }

    function lockAppNow() {
      if (!securityConfig.pinEnabled || !securityConfig.pin) {
        showToast('Set a 4-digit PIN in Store Info & Security first.');
        switchTab('store');
        return;
      }
      currentPinInput = [];
      renderPinDots();
      document.getElementById('lockScreenError').innerText = '';
      document.getElementById('securityLockScreen').classList.remove('hidden');
    }

    async function triggerWebAuthnBiometric() {
      if (!window.PublicKeyCredential || !navigator.credentials) {
        document.getElementById('lockScreenError').innerText = 'Biometric WebAuthn not supported on this browser.';
        return;
      }
      try {
        document.getElementById('lockScreenError').innerText = 'Scanning Biometric Sensor...';
        var challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        var assertion = await navigator.credentials.get({
          publicKey: { challenge: challenge, userVerification: 'preferred', timeout: 60000 }
        });
        if (assertion) {
          unlockApp();
        }
      } catch (err) {
        document.getElementById('lockScreenError').innerText = 'Biometric verification cancelled.';
      }
    }

    function resetPinSecurityModal() {
      if (confirm('Reset PIN and restore default access?')) {
        securityConfig = { pinEnabled: false, pin: '', biometricEnabled: false };
        localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(securityConfig));
        document.getElementById('securityLockScreen').classList.add('hidden');
        updateSecurityUI();
        showToast('PIN Protection Disabled');
      }
    }

    // Keyboard support for lock screen
    window.addEventListener('keydown', function(e) {
      var lockScreen = document.getElementById('securityLockScreen');
      if (lockScreen && !lockScreen.classList.contains('hidden')) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleNumpadDigit(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handleNumpadBackspace();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          currentPinInput = [];
          renderPinDots();
        }
      }
    });

    function updateSecurityUI() {
      var isPin = Boolean(securityConfig.pinEnabled && securityConfig.pin);
      var badge = document.getElementById('secStatusBadge');
      var ribbonBadge = document.getElementById('ribbonSecurityBadge');
      var tabStatus = document.getElementById('secTabStatusText');
      var setupForm = document.getElementById('secSetupFormContainer');
      var activeForm = document.getElementById('secActiveFormContainer');

      if (isPin) {
        if (badge) {
          badge.className = 'text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-200';
          badge.innerText = 'PIN Protection Active';
        }
        if (ribbonBadge) ribbonBadge.classList.remove('hidden');
        if (tabStatus) {
          tabStatus.innerText = 'ACTIVE';
          tabStatus.className = 'text-[11px] font-bold text-emerald-700';
        }
        if (setupForm) setupForm.classList.add('hidden');
        if (activeForm) activeForm.classList.remove('hidden');
      } else {
        if (badge) {
          badge.className = 'text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200';
          badge.innerText = 'PIN Protection Disabled';
        }
        if (ribbonBadge) ribbonBadge.classList.add('hidden');
        if (tabStatus) {
          tabStatus.innerText = 'DISABLED';
          tabStatus.className = 'text-[11px] font-bold text-slate-500';
        }
        if (setupForm) setupForm.classList.remove('hidden');
        if (activeForm) activeForm.classList.add('hidden');
      }

      var bioBtn = document.getElementById('btnToggleBiometrics');
      if (bioBtn) {
        if (securityConfig.biometricEnabled) {
          bioBtn.innerText = 'ON';
          bioBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white';
        } else {
          bioBtn.innerText = 'OFF';
          bioBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700';
        }
      }
    }

    function saveNewPinFromSettings() {
      var p1 = document.getElementById('secNewPin').value.trim();
      var p2 = document.getElementById('secConfirmPin').value.trim();
      if (!/^\\d{4}$/.test(p1)) {
        showToast('PIN must be exactly 4 digits');
        return;
      }
      if (p1 !== p2) {
        showToast('PINs do not match');
        return;
      }
      securityConfig.pin = p1;
      securityConfig.pinEnabled = true;
      localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(securityConfig));
      document.getElementById('secNewPin').value = '';
      document.getElementById('secConfirmPin').value = '';
      updateSecurityUI();
      showToast('4-digit PIN Protection Enabled!');
    }

    function changePinFromSettings() {
      var curr = document.getElementById('secChangeCurrent').value.trim();
      var p1 = document.getElementById('secChangeNew').value.trim();
      var p2 = document.getElementById('secChangeConfirm').value.trim();
      if (curr !== securityConfig.pin) {
        showToast('Current PIN is incorrect');
        return;
      }
      if (!/^\\d{4}$/.test(p1)) {
        showToast('New PIN must be 4 digits');
        return;
      }
      if (p1 !== p2) {
        showToast('New PIN and Confirm do not match');
        return;
      }
      securityConfig.pin = p1;
      localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(securityConfig));
      document.getElementById('secChangeCurrent').value = '';
      document.getElementById('secChangeNew').value = '';
      document.getElementById('secChangeConfirm').value = '';
      showToast('PIN Changed Successfully!');
    }

    function disablePinLock() {
      if (confirm('Disable PIN & Biometric protection?')) {
        securityConfig = { pinEnabled: false, pin: '', biometricEnabled: false };
        localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(securityConfig));
        updateSecurityUI();
        showToast('PIN Protection Disabled');
      }
    }

    async function toggleBiometricsFromSettings() {
      if (!securityConfig.pinEnabled) {
        showToast('Enable a 4-digit PIN first.');
        return;
      }
      if (!securityConfig.biometricEnabled) {
        if (!window.PublicKeyCredential || !navigator.credentials) {
          showToast('WebAuthn not supported on this device.');
          return;
        }
        try {
          var challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          var userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);
          var cred = await navigator.credentials.create({
            publicKey: {
              challenge: challenge,
              rp: { name: 'InvoiceFlow' },
              user: { id: userId, name: 'admin', displayName: 'Store Admin' },
              pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
              authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'preferred' },
              timeout: 60000
            }
          });
          if (cred) {
            securityConfig.biometricEnabled = true;
            localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(securityConfig));
            updateSecurityUI();
            showToast('Biometric Fingerprint Unlock Enabled!');
          }
        } catch (e) {
          showToast('Biometric registration cancelled or failed.');
        }
      } else {
        securityConfig.biometricEnabled = false;
        localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(securityConfig));
        updateSecurityUI();
        showToast('Biometric Unlock Turned OFF');
      }
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-view').forEach(function(v) { v.classList.add('hidden'); });
      document.getElementById('view-' + tabId).classList.remove('hidden');

      document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        b.classList.add('text-slate-600');
      });
      var activeBtn = document.getElementById('tab-btn-' + tabId);
      if (activeBtn) {
        activeBtn.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
        activeBtn.classList.remove('text-slate-600');
      }

      ['store', 'create', 'customers', 'history', 'monthly', 'yearly'].forEach(function(t) {
        var mob = document.getElementById('mob-tab-' + t);
        if (mob) {
          if (t === tabId) {
            mob.className = 'flex flex-col items-center py-1 text-emerald-700 font-bold';
          } else {
            mob.className = 'flex flex-col items-center py-1 text-slate-500';
          }
        }
      });

      if (tabId === 'store') renderStoreInfo();
      if (tabId === 'customers') renderCustomers();
      if (tabId === 'history') renderHistory();
      if (tabId === 'monthly') renderMonthlyStatement();
      if (tabId === 'yearly') renderYearlyStatement();
    }

    // STORE INFO MODULE
    function renderStoreInfo() {
      document.getElementById('storeFormName').value = businessInfo.name || '';
      document.getElementById('storeFormPhone').value = businessInfo.phone || '';
      document.getElementById('storeFormTagline').value = businessInfo.tagline || '';
      document.getElementById('storeFormAddress').value = businessInfo.address || '';
      updateStoreInfoDisplays();
      updateSecurityUI();
    }

    function updateStoreInfoDisplays() {
      var rName = document.getElementById('ribbonStoreName');
      if (rName) rName.innerText = businessInfo.name;
      var rPhone = document.getElementById('ribbonStorePhone');
      if (rPhone) rPhone.innerText = businessInfo.phone;

      var cName = document.getElementById('createHeaderStoreName');
      if (cName) cName.innerText = businessInfo.name;
      var cTag = document.getElementById('createHeaderStoreTagline');
      if (cTag) cTag.innerText = businessInfo.tagline || '';
      var cPhone = document.getElementById('createHeaderStorePhone');
      if (cPhone) cPhone.innerText = businessInfo.phone;
      var cAddr = document.getElementById('createHeaderStoreAddress');
      if (cAddr) cAddr.innerText = businessInfo.address;
    }

    function saveStoreInfoFromForm(e) {
      if (e) e.preventDefault();
      businessInfo = {
        name: document.getElementById('storeFormName').value.trim() || 'My Store',
        phone: document.getElementById('storeFormPhone').value.trim() || '',
        tagline: document.getElementById('storeFormTagline').value.trim() || '',
        address: document.getElementById('storeFormAddress').value.trim() || ''
      };
      localStorage.setItem(STORAGE_KEY_BUSINESS, JSON.stringify(businessInfo));
      updateStoreInfoDisplays();
      showToast('Store Info Saved Successfully!');
    }

    function resetStoreInfoDefault() {
      businessInfo = Object.assign({}, DEFAULT_STORE_INFO);
      localStorage.setItem(STORAGE_KEY_BUSINESS, JSON.stringify(businessInfo));
      renderStoreInfo();
      showToast('Store Info Reset to Sample Data');
    }

    // FORM & CALCULATIONS
    var currentItems = [{ id: 1, name: '', qty: 1, price: 0 }];

    function renderItemRows() {
      var container = document.getElementById('itemsContainer');
      container.innerHTML = '';
      currentItems.forEach(function(it, idx) {
        var row = document.createElement('div');
        row.className = 'flex flex-col sm:flex-row items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200';
        row.innerHTML = '<input type="text" placeholder="Item name..." value="' + (it.name || '') + '" oninput="updateItem(' + idx + ', \\'name\\', this.value)" class="w-full sm:flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300">' +
          '<input type="number" min="1" value="' + it.qty + '" oninput="updateItem(' + idx + ', \\'qty\\', this.value)" class="w-full sm:w-20 px-2 py-1.5 text-xs font-mono text-center rounded border border-slate-300">' +
          '<input type="number" min="0" step="0.01" placeholder="Price" value="' + (it.price || '') + '" oninput="updateItem(' + idx + ', \\'price\\', this.value)" class="w-full sm:w-28 px-2 py-1.5 text-xs font-mono text-right rounded border border-slate-300">' +
          '<div class="w-full sm:w-28 text-right font-mono text-xs font-bold text-slate-900">' + formatRupees(it.qty * it.price) + '</div>' +
          '<button type="button" onclick="removeItemRow(' + idx + ')" class="p-1.5 text-slate-400 hover:text-rose-600"><i class="fa-solid fa-trash-can text-xs"></i></button>';
        container.appendChild(row);
      });
      recalculate();
    }

    function updateItem(idx, field, val) {
      if (field === 'name') currentItems[idx].name = val;
      if (field === 'qty') currentItems[idx].qty = Math.max(1, Number(val) || 1);
      if (field === 'price') currentItems[idx].price = Math.max(0, Number(val) || 0);
      recalculate();
    }

    function addItemRow() {
      currentItems.push({ id: Date.now(), name: '', qty: 1, price: 0 });
      renderItemRows();
    }

    function removeItemRow(idx) {
      if (currentItems.length > 1) {
        currentItems.splice(idx, 1);
      } else {
        currentItems = [{ id: 1, name: '', qty: 1, price: 0 }];
      }
      renderItemRows();
    }

    function recalculate() {
      var subtotal = currentItems.reduce(function(sum, it) { return sum + (it.qty * it.price); }, 0);
      var prevBal = Number(document.getElementById('invPrevBalance').value) || 0;
      var totalBill = subtotal + prevBal;
      var paymentReceived = Number(document.getElementById('invPaymentReceived').value) || 0;
      var remaining = totalBill - paymentReceived;

      document.getElementById('dispSubtotal').innerText = formatRupees(subtotal);
      document.getElementById('dispTotalBill').innerText = formatRupees(totalBill);
      document.getElementById('dispRemaining').innerText = formatRupees(remaining);
      return { subtotal: subtotal, prevBal: prevBal, totalBill: totalBill, paymentReceived: paymentReceived, remaining: remaining };
    }

    function getCustomerRunningBalance(cust, excludeInvId) {
      if (!cust) return 0;
      var opening = Number(cust.openingBalance !== undefined ? cust.openingBalance : (cust.previousBalance || 0));
      var custId = cust.id;
      var custName = (cust.name || '').trim().toLowerCase();

      var relevantInvoices = invoices.filter(function(inv) {
        if (excludeInvId && inv.id === excludeInvId) return false;
        if (custId && inv.customerId && inv.customerId === custId) return true;
        if (custName && inv.customerName && inv.customerName.trim().toLowerCase() === custName) return true;
        return false;
      });

      var totalSales = relevantInvoices.reduce(function(sum, inv) { return sum + (Number(inv.subtotal) || 0); }, 0);
      var totalPaid = relevantInvoices.reduce(function(sum, inv) { return sum + (Number(inv.paymentReceived) || 0); }, 0);

      return opening + totalSales - totalPaid;
    }

    function setFullPayment() {
      var calc = recalculate();
      document.getElementById('invPaymentReceived').value = calc.totalBill;
      recalculate();
    }

    function onCustomerSelectChange() {
      var sel = document.getElementById('invCustomerSelect').value;
      if (sel === 'custom') {
        document.getElementById('invCustomerName').value = '';
        document.getElementById('invCustomerPhone').value = '';
        document.getElementById('invPrevBalance').value = 0;
      } else {
        var c = customers.find(function(x) { return x.id === sel; });
        if (c) {
          document.getElementById('invCustomerName').value = c.name;
          document.getElementById('invCustomerPhone').value = c.phone || '';
          var runningBal = getCustomerRunningBalance(c, editingInvoiceId);
          document.getElementById('invPrevBalance').value = runningBal;
        }
      }
      recalculate();
    }

    var editingInvoiceId = null;

    function resetFormToEmpty() {
      editingInvoiceId = null;
      var banner = document.getElementById('editingBanner');
      if (banner) banner.classList.add('hidden');
      document.getElementById('invCustomerSelect').value = 'custom';
      document.getElementById('invCustomerName').value = '';
      document.getElementById('invCustomerPhone').value = '';
      document.getElementById('invPrevBalance').value = 0;
      document.getElementById('invPaymentReceived').value = '';
      document.getElementById('invDate').value = new Date().toISOString().split('T')[0];
      generateNextInvoiceNumber();
      currentItems = [{ id: 1, name: '', qty: 1, price: 0 }];
      renderItemRows();
      populateCustomerDropdown();
    }

    function cancelEdit() {
      resetFormToEmpty();
      showToast('Edit Mode Cancelled');
      switchTab('history');
    }

    function generateNextInvoiceNumber() {
      var count = invoices.length + 1;
      document.getElementById('invNumber').value = 'INV-' + new Date().getFullYear() + '-' + String(count).padStart(3, '0');
    }

    function populateCustomerDropdown() {
      var sel = document.getElementById('invCustomerSelect');
      var curr = sel.value;
      sel.innerHTML = '<option value="custom">+ Type New Customer Manually</option>';
      customers.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        var runningBal = getCustomerRunningBalance(c, editingInvoiceId);
        opt.innerText = c.name + ' (Balance: ' + formatRupees(runningBal) + ')';
        sel.appendChild(opt);
      });
      sel.value = curr || 'custom';
    }

    function saveInvoiceFromForm(shouldPrint) {
      var custName = document.getElementById('invCustomerName').value.trim();
      if (!custName) {
        alert('Please enter or select a customer name.');
        return;
      }
      var validItems = currentItems.filter(function(it) { return it.name && it.name.trim() !== ''; });
      if (validItems.length === 0) {
        alert('Please add at least one item.');
        return;
      }

      var calc = recalculate();
      var custPhone = document.getElementById('invCustomerPhone').value.trim();
      var custSelect = document.getElementById('invCustomerSelect').value;
      var invNum = document.getElementById('invNumber').value.trim();
      var invDate = document.getElementById('invDate').value;

      var invObj = {
        id: editingInvoiceId || ('inv-' + Date.now()),
        invoiceNumber: invNum,
        customerId: custSelect !== 'custom' ? custSelect : undefined,
        customerName: custName,
        customerPhone: custPhone,
        invoiceDate: invDate,
        items: validItems.map(function(it) {
          return { id: it.id || Date.now(), name: it.name, quantity: it.qty, unitPrice: it.price, amount: it.qty * it.price };
        }),
        subtotal: calc.subtotal,
        previousBalance: calc.prevBal,
        totalBill: calc.totalBill,
        paymentReceived: calc.paymentReceived,
        remainingBalance: calc.remaining,
        grandTotal: calc.totalBill,
        createdAt: new Date().toISOString()
      };

      if (custSelect === 'custom') {
        var existingCust = customers.find(function(c) { return c.name.toLowerCase() === custName.toLowerCase(); });
        if (!existingCust) {
          var initOpening = Number(calc.prevBal) || 0;
          var newCust = {
            id: 'cust-' + Date.now(),
            name: custName,
            phone: custPhone,
            openingBalance: initOpening,
            previousBalance: initOpening,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          customers.unshift(newCust);
          invObj.customerId = newCust.id;
          localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
        } else {
          invObj.customerId = existingCust.id;
        }
      }

      if (editingInvoiceId) {
        var idx = invoices.findIndex(function(i) { return i.id === editingInvoiceId; });
        if (idx >= 0) invoices[idx] = invObj;
        showToast('Invoice #' + invNum + ' Updated');
      } else {
        invoices.unshift(invObj);
        showToast('Invoice #' + invNum + ' Saved & Form Cleared');
      }

      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));

      if (shouldPrint) {
        showPrintModal(invObj);
      }

      resetFormToEmpty();
      renderCustomers();
      populateStatementCustomerDropdowns();
    }

    function editInvoice(id) {
      var inv = invoices.find(function(i) { return i.id === id; });
      if (!inv) return;

      editingInvoiceId = inv.id;
      switchTab('create');

      var banner = document.getElementById('editingBanner');
      if (banner) banner.classList.remove('hidden');
      var numEl = document.getElementById('editingInvNum');
      if (numEl) numEl.innerText = '#' + inv.invoiceNumber;

      populateCustomerDropdown();
      if (inv.customerId && customers.some(function(c) { return c.id === inv.customerId; })) {
        document.getElementById('invCustomerSelect').value = inv.customerId;
      } else {
        document.getElementById('invCustomerSelect').value = 'custom';
      }

      document.getElementById('invCustomerName').value = inv.customerName;
      document.getElementById('invCustomerPhone').value = inv.customerPhone || '';
      document.getElementById('invNumber').value = inv.invoiceNumber;
      document.getElementById('invDate').value = inv.invoiceDate;
      document.getElementById('invPrevBalance').value = inv.previousBalance;
      document.getElementById('invPaymentReceived').value = inv.paymentReceived || '';

      currentItems = inv.items.map(function(it) {
        return { id: it.id, name: it.name, qty: it.quantity, price: it.unitPrice };
      });
      renderItemRows();
      showToast('Loaded Invoice #' + inv.invoiceNumber + ' into Edit Mode');
    }

    // CUSTOMERS MANAGEMENT
    var activeKhataCustomerId = null;

    function renderCustomers() {
      var list = document.getElementById('customersList');
      list.innerHTML = '';
      if (customers.length === 0) {
        list.innerHTML = '<div class="col-span-full py-12 text-center text-slate-400 text-xs">No customers saved yet.</div>';
        return;
      }
      customers.forEach(function(c) {
        var opBal = Number(c.openingBalance !== undefined ? c.openingBalance : (c.previousBalance || 0));
        var runningBal = getCustomerRunningBalance(c);
        var card = document.createElement('div');
        card.className = 'bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs';
        card.innerHTML = '<div class="space-y-2">' +
          '<div class="flex justify-between items-start">' +
            '<div>' +
              '<h4 class="font-bold text-slate-900 text-sm">' + c.name + '</h4>' +
              '<p class="text-xs text-slate-500 mt-0.5"><i class="fa-solid fa-phone mr-1 text-slate-400"></i>' + (c.phone || 'No phone') + '</p>' +
            '</div>' +
            '<div class="text-right">' +
              '<span class="text-[10px] text-slate-400 block uppercase font-medium">Running Due</span>' +
              '<span class="text-sm font-mono font-bold ' + (runningBal > 0 ? 'text-amber-700' : 'text-emerald-700') + '">' + formatRupees(runningBal) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">' +
            '<span>Opening Balance (Set Once):</span>' +
            '<span class="font-mono font-medium text-slate-700">' + formatRupees(opBal) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs gap-1.5 flex-wrap">' +
          '<button onclick="openCustomerKhata(\\'' + c.id + '\\')" class="flex-1 px-2.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"><i class="fa-solid fa-book-open text-amber-400 text-xs"></i> Khata</button>' +
          '<button onclick="createInvoiceForCust(\\'' + c.id + '\\')" class="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-md font-semibold transition-colors"><i class="fa-solid fa-file-invoice mr-1"></i> Bill</button>' +
          '<div class="flex gap-1">' +
            '<button onclick="editCustomerModal(\\'' + c.id + '\\')" class="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded" title="Edit Customer"><i class="fa-solid fa-pen-to-square"></i></button>' +
            '<button onclick="deleteCustomer(\\'' + c.id + '\\')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Delete Customer"><i class="fa-solid fa-trash-can"></i></button>' +
          '</div>' +
        '</div>';
        list.appendChild(card);
      });
    }

    function openCustomerKhata(id) {
      var c = customers.find(function(x) { return x.id === id; });
      if (!c) return;
      activeKhataCustomerId = c.id;

      var opBal = Number(c.openingBalance !== undefined ? c.openingBalance : (c.previousBalance || 0));
      var custId = c.id;
      var custNameLower = (c.name || '').trim().toLowerCase();

      var relevantInvoices = invoices.filter(function(inv) {
        if (custId && inv.customerId && inv.customerId === custId) return true;
        if (custNameLower && inv.customerName && inv.customerName.trim().toLowerCase() === custNameLower) return true;
        return false;
      });

      relevantInvoices.sort(function(a, b) {
        return new Date(a.invoiceDate || a.date).getTime() - new Date(b.invoiceDate || b.date).getTime();
      });

      var totalPurchases = relevantInvoices.reduce(function(sum, inv) { return sum + (Number(inv.subtotal) || 0); }, 0);
      var totalPaid = relevantInvoices.reduce(function(sum, inv) { return sum + (Number(inv.paymentReceived) || 0); }, 0);
      var netDue = opBal + totalPurchases - totalPaid;

      document.getElementById('khataCustName').innerText = c.name;
      document.getElementById('khataCustPhone').innerText = c.phone || 'No phone';
      document.getElementById('khataInvCount').innerText = relevantInvoices.length + ' Invoices';

      document.getElementById('khataKpiOpening').innerText = formatRupees(opBal);
      document.getElementById('khataKpiPurchases').innerText = formatRupees(totalPurchases);
      document.getElementById('khataKpiPaid').innerText = formatRupees(totalPaid);
      document.getElementById('khataKpiDue').innerText = formatRupees(netDue);
      document.getElementById('khataFooterDue').innerText = formatRupees(netDue);

      var tbody = document.getElementById('khataTableBody');
      tbody.innerHTML = '';

      // Opening balance initial row
      var opRow = document.createElement('tr');
      opRow.className = 'bg-slate-50/50 italic text-slate-600 font-sans';
      opRow.innerHTML = '<td class="py-2 px-3 text-slate-400 font-mono text-[11px]">' + (c.createdAt ? (c.createdAt.split('T')[0]) : 'Opening') + '</td>' +
        '<td class="py-2 px-3 font-semibold text-slate-500">OPENING-BAL</td>' +
        '<td class="py-2 px-3 text-slate-500">Initial starting balance</td>' +
        '<td class="py-2 px-3 text-right font-mono font-medium text-slate-700">' + formatRupees(opBal) + '</td>' +
        '<td class="py-2 px-3 text-right font-mono text-slate-400">-</td>' +
        '<td class="py-2 px-3 text-right font-mono font-bold text-slate-900">' + formatRupees(opBal) + '</td>' +
        '<td class="py-2 px-3 text-center text-slate-400">—</td>';
      tbody.appendChild(opRow);

      var runningLedger = opBal;
      if (relevantInvoices.length === 0) {
        var emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="7" class="py-6 text-center text-slate-400 font-sans">No bill transactions recorded yet.</td>';
        tbody.appendChild(emptyRow);
      } else {
        relevantInvoices.forEach(function(inv) {
          var sub = Number(inv.subtotal) || 0;
          var paid = Number(inv.paymentReceived) || 0;
          runningLedger = runningLedger + sub - paid;

          var itemDesc = inv.items && inv.items.length > 0
            ? inv.items.map(function(it) { return it.name + ' (' + it.qty + ')'; }).join(', ')
            : 'No items';

          var tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-50 transition-colors font-sans';
          tr.innerHTML = '<td class="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">' + (inv.invoiceDate || inv.date) + '</td>' +
            '<td class="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-900">#' + inv.invoiceNumber + '</td>' +
            '<td class="py-2.5 px-3 max-w-xs truncate text-slate-600 text-xs" title="' + itemDesc.replace(/"/g, '&quot;') + '">' + itemDesc + '</td>' +
            '<td class="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">' + formatRupees(sub) + '</td>' +
            '<td class="py-2.5 px-3 text-right font-mono font-medium text-emerald-700">' + (paid > 0 ? formatRupees(paid) : 'Rs. 0.00') + '</td>' +
            '<td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">' +
              '<span class="' + (runningLedger > 0 ? 'text-amber-800' : 'text-emerald-700') + '">' + formatRupees(runningLedger) + '</span>' +
            '</td>' +
            '<td class="py-2.5 px-3 text-center">' +
              '<button onclick="closeKhataModal(); previewInvoice(\\'' + inv.id + '\\')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"><i class="fa-solid fa-eye mr-1"></i> View</button>' +
            '</td>';
          tbody.appendChild(tr);
        });
      }

      document.getElementById('khataModal').classList.remove('hidden');
    }

    function closeKhataModal() {
      document.getElementById('khataModal').classList.add('hidden');
      activeKhataCustomerId = null;
    }

    function billFromKhata() {
      if (activeKhataCustomerId) {
        var id = activeKhataCustomerId;
        closeKhataModal();
        createInvoiceForCust(id);
      }
    }

    function shareActiveKhataWhatsApp() {
      if (!activeKhataCustomerId) return;
      var c = customers.find(function(x) { return x.id === activeKhataCustomerId; });
      if (!c) return;

      var opBal = Number(c.openingBalance !== undefined ? c.openingBalance : (c.previousBalance || 0));
      var custId = c.id;
      var custNameLower = (c.name || '').trim().toLowerCase();

      var relevantInvoices = invoices.filter(function(inv) {
        if (custId && inv.customerId && inv.customerId === custId) return true;
        if (custNameLower && inv.customerName && inv.customerName.trim().toLowerCase() === custNameLower) return true;
        return false;
      });

      var totalPurchases = relevantInvoices.reduce(function(sum, inv) { return sum + (Number(inv.subtotal) || 0); }, 0);
      var totalPaid = relevantInvoices.reduce(function(sum, inv) { return sum + (Number(inv.paymentReceived) || 0); }, 0);
      var netDue = opBal + totalPurchases - totalPaid;

      var cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.indexOf('03') === 0 && cleanPhone.length === 11) {
        cleanPhone = '92' + cleanPhone.substring(1);
      }

      var todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      var storeTitle = businessInfo.name || 'Store';
      var storePhone = businessInfo.phone ? ('\\n📞 *Contact:* ' + businessInfo.phone) : '';

      var msg = '*📊 CUSTOMER ACCOUNT STATEMENT (KHATA)*\\n━━━━━━━━━━━━━━━━━━━━\\n' +
        '🏪 *Store:* ' + storeTitle + storePhone + '\\n' +
        '👤 *Customer:* ' + c.name + '\\n' +
        '📱 *Phone:* ' + (c.phone || 'N/A') + '\\n' +
        '📅 *Date:* ' + todayStr + '\\n━━━━━━━━━━━━━━━━━━━━\\n' +
        '*1. Opening Balance:* ' + formatRupees(opBal) + '\\n' +
        '*2. Total Purchases (' + relevantInvoices.length + ' Invoices):* ' + formatRupees(totalPurchases) + '\\n' +
        '*3. Total Payments Received:* ' + formatRupees(totalPaid) + '\\n━━━━━━━━━━━━━━━━━━━━\\n' +
        '*💰 NET DUE BALANCE (BAQAYA):* ' + formatRupees(netDue) + '\\n━━━━━━━━━━━━━━━━━━━━\\n' +
        (netDue > 0 ? ('⚠️ *Please clear your pending balance of ' + formatRupees(netDue) + ' at your earliest convenience.*\\n') : '✅ *Your account is fully cleared. Thank you!*\\n') +
        '_Generated via ' + storeTitle + ' POS System_';

      var encoded = encodeURIComponent(msg);
      var url = cleanPhone ? ('https://api.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encoded) : ('https://api.whatsapp.com/send?text=' + encoded);
      window.open(url, '_blank');
    }

    function printActiveKhata() {
      window.print();
    }

    function openCustomerModal() {
      document.getElementById('custModalId').value = '';
      document.getElementById('custModalTitle').innerText = 'Add Customer';
      document.getElementById('custModalName').value = '';
      document.getElementById('custModalPhone').value = '';
      document.getElementById('custModalBalance').value = 0;
      document.getElementById('customerModal').classList.remove('hidden');
    }

    function editCustomerModal(id) {
      var c = customers.find(function(x) { return x.id === id; });
      if (!c) return;
      document.getElementById('custModalId').value = c.id;
      document.getElementById('custModalTitle').innerText = 'Edit Customer';
      document.getElementById('custModalName').value = c.name;
      document.getElementById('custModalPhone').value = c.phone || '';
      var op = Number(c.openingBalance !== undefined ? c.openingBalance : (c.previousBalance || 0));
      document.getElementById('custModalBalance').value = op;
      document.getElementById('customerModal').classList.remove('hidden');
    }

    function closeCustomerModal() {
      document.getElementById('customerModal').classList.add('hidden');
    }

    function saveCustomerFromModal() {
      var id = document.getElementById('custModalId').value;
      var name = document.getElementById('custModalName').value.trim();
      var phone = document.getElementById('custModalPhone').value.trim();
      var bal = Number(document.getElementById('custModalBalance').value) || 0;
      if (!name) { alert('Customer name is required'); return; }

      if (id) {
        var c = customers.find(function(x) { return x.id === id; });
        if (c) {
          c.name = name;
          c.phone = phone;
          c.openingBalance = bal;
          c.previousBalance = bal;
          c.updatedAt = new Date().toISOString();
        }
      } else {
        customers.unshift({
          id: 'cust-' + Date.now(),
          name: name,
          phone: phone,
          openingBalance: bal,
          previousBalance: bal,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
      closeCustomerModal();
      renderCustomers();
      populateCustomerDropdown();
      populateStatementCustomerDropdowns();
      showToast(id ? 'Customer Updated' : 'Customer Saved');
    }

    function deleteCustomer(id) {
      if (confirm('Delete this customer?')) {
        customers = customers.filter(function(c) { return c.id !== id; });
        localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
        renderCustomers();
        populateCustomerDropdown();
        showToast('Customer deleted');
      }
    }

    function createInvoiceForCust(id) {
      var c = customers.find(function(x) { return x.id === id; });
      if (!c) return;
      resetFormToEmpty();
      switchTab('create');
      document.getElementById('invCustomerSelect').value = c.id;
      document.getElementById('invCustomerName').value = c.name;
      document.getElementById('invCustomerPhone').value = c.phone || '';
      document.getElementById('invPrevBalance').value = c.previousBalance || 0;
      recalculate();
    }

    // INVOICE HISTORY
    function renderHistory() {
      var list = document.getElementById('historyList');
      var search = (document.getElementById('historySearch').value || '').toLowerCase();
      list.innerHTML = '';

      var filtered = invoices.filter(function(i) {
        return i.customerName.toLowerCase().includes(search) || i.invoiceNumber.toLowerCase().includes(search);
      });

      if (filtered.length === 0) {
        list.innerHTML = '<div class="col-span-full py-12 text-center text-slate-400 text-xs">No invoices found.</div>';
        return;
      }

      filtered.forEach(function(inv) {
        var card = document.createElement('div');
        card.className = 'bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs';
        card.innerHTML = '<div class="flex justify-between items-start border-b pb-2">' +
          '<div>' +
            '<span class="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">#' + inv.invoiceNumber + '</span>' +
            '<h4 class="font-bold text-slate-900 text-sm mt-1">' + inv.customerName + '</h4>' +
            '<p class="text-[11px] text-slate-500">' + inv.invoiceDate + ' · ' + (inv.customerPhone || 'No phone') + '</p>' +
          '</div>' +
          '<div class="text-right">' +
            '<span class="text-[10px] text-slate-400 uppercase font-semibold block">Total Bill</span>' +
            '<span class="font-mono text-sm font-bold text-slate-900 block">' + formatRupees(inv.totalBill) + '</span>' +
            '<span class="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">Rem: ' + formatRupees(inv.remainingBalance) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="text-xs text-slate-600 flex justify-between">' +
          '<span>Items: <strong>' + inv.items.length + '</strong> (Subtotal: ' + formatRupees(inv.subtotal) + ')</span>' +
          '<span>Paid: <strong class="text-sky-700">' + formatRupees(inv.paymentReceived || 0) + '</strong></span>' +
        '</div>' +
        '<div class="flex items-center justify-between pt-2 border-t">' +
          '<div class="flex gap-2">' +
            '<button onclick="editInvoice(\\'' + inv.id + '\\')" class="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center gap-1"><i class="fa-solid fa-pen-to-square text-xs"></i> Edit</button>' +
            '<button onclick="showPrintModalById(\\'' + inv.id + '\\')" class="px-2 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"><i class="fa-solid fa-print"></i> PDF</button>' +
            '<button onclick="shareWhatsAppDirect(\\'' + inv.id + '\\')" class="px-2 py-1 text-xs text-white bg-[#25D366] hover:bg-[#20bd5a] rounded"><i class="fa-brands fa-whatsapp"></i></button>' +
          '</div>' +
          '<button onclick="deleteInvoice(\\'' + inv.id + '\\')" class="p-1 text-slate-400 hover:text-rose-600 text-xs"><i class="fa-solid fa-trash-can"></i></button>' +
        '</div>';
        list.appendChild(card);
      });
    }

    function deleteInvoice(id) {
      if (confirm('Delete this invoice permanently?')) {
        invoices = invoices.filter(function(i) { return i.id !== id; });
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
        renderHistory();
        showToast('Invoice deleted');
      }
    }

    // STATEMENTS (MONTHLY & YEARLY)
    function populateStatementCustomerDropdowns() {
      var map = {};
      customers.forEach(function(c) {
        if (c.name) map[c.name.trim()] = c.name.trim();
      });
      invoices.forEach(function(inv) {
        if (inv.customerName) map[inv.customerName.trim()] = inv.customerName.trim();
      });

      var names = Object.keys(map).sort();

      ['monthlySelectCustomer', 'yearlySelectCustomer'].forEach(function(elId) {
        var el = document.getElementById(elId);
        if (el) {
          var curr = el.value || 'all';
          el.innerHTML = '<option value="all">👥 All Customers (Store Total)</option>';
          names.forEach(function(name) {
            var opt = document.createElement('option');
            opt.value = name;
            opt.innerText = name;
            el.appendChild(opt);
          });
          el.value = curr;
        }
      });
    }

    function renderMonthlyStatement() {
      populateStatementCustomerDropdowns();

      var selM = document.getElementById('monthlySelectMonth');
      var selY = document.getElementById('monthlySelectYear');
      var selCust = document.getElementById('monthlySelectCustomer');

      if (selM.children.length === 0) {
        MONTH_NAMES.forEach(function(m, idx) {
          var opt = document.createElement('option');
          opt.value = idx;
          opt.innerText = m;
          selM.appendChild(opt);
        });
        selM.value = new Date().getMonth();

        for (var y = 2024; y <= 2030; y++) {
          var optY = document.createElement('option');
          optY.value = y;
          optY.innerText = y;
          selY.appendChild(optY);
        }
        selY.value = new Date().getFullYear();
      }

      var month = Number(selM.value);
      var year = Number(selY.value);
      var targetCustomer = selCust ? selCust.value : 'all';

      // Update badge and print button text
      var badge = document.getElementById('monthlyCustomerBadge');
      var printBtnText = document.getElementById('monthlyPrintBtnText');
      var printBtn = document.getElementById('monthlyPrintBtn');

      if (targetCustomer !== 'all') {
        if (badge) {
          badge.innerText = targetCustomer;
          badge.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
        }
        if (printBtnText) printBtnText.innerText = 'Print Customer Statement';
        if (printBtn) {
          printBtn.className = 'px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg flex items-center gap-1.5 min-h-[38px]';
        }
      } else {
        if (badge) {
          badge.innerText = 'All Customers';
          badge.className = 'text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200';
        }
        if (printBtnText) printBtnText.innerText = 'Print Statement';
        if (printBtn) {
          printBtn.className = 'px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 min-h-[38px]';
        }
      }

      var monthlyInvs = invoices.filter(function(i) {
        if (!i.invoiceDate) return false;
        var d = new Date(i.invoiceDate);
        var matchesDate = d.getMonth() === month && d.getFullYear() === year;
        if (!matchesDate) return false;
        if (targetCustomer === 'all') return true;
        return (i.customerName || '').trim().toLowerCase() === targetCustomer.trim().toLowerCase();
      });

      var totalSales = monthlyInvs.reduce(function(s, i) { return s + (Number(i.subtotal) || 0); }, 0);
      var totalCash = monthlyInvs.reduce(function(s, i) { return s + (Number(i.paymentReceived) || 0); }, 0);
      // Strictly Total Period Sales minus Total Period Payment Received to avoid double counting
      var totalRemaining = totalSales - totalCash;

      document.getElementById('monthlyRevenue').innerText = formatRupees(totalSales);
      document.getElementById('monthlyCash').innerText = formatRupees(totalCash);
      document.getElementById('monthlyRemaining').innerText = formatRupees(totalRemaining);
      document.getElementById('monthlyCount').innerText = monthlyInvs.length;

      var tb = document.getElementById('monthlyTableBody');
      tb.innerHTML = '';
      if (monthlyInvs.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">No invoices found for ' + (targetCustomer === 'all' ? 'this month' : targetCustomer) + '.</td></tr>';
        return;
      }

      monthlyInvs.forEach(function(i) {
        var bill = Number(i.subtotal) || 0;
        var paid = Number(i.paymentReceived) || 0;
        var baqaya = bill - paid;

        var tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/70 transition-colors';
        tr.innerHTML = '<td class="p-2.5 font-mono font-bold text-slate-900">#' + i.invoiceNumber + '</td>' +
          '<td class="p-2.5 text-slate-500">' + i.invoiceDate + '</td>' +
          '<td class="p-2.5 font-semibold text-slate-900">' + i.customerName + '</td>' +
          '<td class="p-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30 text-xs sm:text-sm">' + formatRupees(bill) + '</td>' +
          '<td class="p-2.5 text-right font-mono font-bold text-sky-800 bg-sky-50/30 text-xs sm:text-sm">' + formatRupees(paid) + '</td>' +
          '<td class="p-2.5 text-right font-mono font-bold bg-amber-50/30 text-xs sm:text-sm ' + (baqaya > 0 ? 'text-amber-800' : 'text-emerald-700') + '">' + formatRupees(baqaya) + '</td>' +
          '<td class="p-2.5 text-center"><button onclick="showPrintModalById(\\'' + i.id + '\\')" class="text-xs text-slate-600 hover:text-slate-900"><i class="fa-solid fa-print mr-1"></i>PDF</button></td>';
        tb.appendChild(tr);
      });
    }

    function renderYearlyStatement() {
      populateStatementCustomerDropdowns();

      var selY = document.getElementById('yearlySelectYear');
      var selCust = document.getElementById('yearlySelectCustomer');

      if (selY.children.length === 0) {
        for (var y = 2024; y <= 2030; y++) {
          var optY = document.createElement('option');
          optY.value = y;
          optY.innerText = y;
          selY.appendChild(optY);
        }
        selY.value = new Date().getFullYear();
      }

      var year = Number(selY.value);
      var targetCustomer = selCust ? selCust.value : 'all';

      // Update badge and print button text
      var badge = document.getElementById('yearlyCustomerBadge');
      var printBtnText = document.getElementById('yearlyPrintBtnText');
      var printBtn = document.getElementById('yearlyPrintBtn');

      if (targetCustomer !== 'all') {
        if (badge) {
          badge.innerText = targetCustomer;
          badge.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
        }
        if (printBtnText) printBtnText.innerText = 'Print Customer Statement';
        if (printBtn) {
          printBtn.className = 'px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg flex items-center gap-1.5 min-h-[38px]';
        }
      } else {
        if (badge) {
          badge.innerText = 'All Customers';
          badge.className = 'text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200';
        }
        if (printBtnText) printBtnText.innerText = 'Print Annual Report';
        if (printBtn) {
          printBtn.className = 'px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 min-h-[38px]';
        }
      }

      var yearlyInvs = invoices.filter(function(i) {
        if (!i.invoiceDate) return false;
        var y = new Date(i.invoiceDate).getFullYear();
        if (y !== year) return false;
        if (targetCustomer === 'all') return true;
        return (i.customerName || '').trim().toLowerCase() === targetCustomer.trim().toLowerCase();
      });

      var totalSales = yearlyInvs.reduce(function(s, i) { return s + (Number(i.subtotal) || 0); }, 0);
      var totalCash = yearlyInvs.reduce(function(s, i) { return s + (Number(i.paymentReceived) || 0); }, 0);
      // Strictly Total Period Sales minus Total Period Payment Received
      var totalRemaining = totalSales - totalCash;

      document.getElementById('yearlyRevenue').innerText = formatRupees(totalSales);
      document.getElementById('yearlyCash').innerText = formatRupees(totalCash);
      document.getElementById('yearlyRemaining').innerText = formatRupees(totalRemaining);
      document.getElementById('yearlyCount').innerText = yearlyInvs.length;

      var tb = document.getElementById('yearlyTableBody');
      tb.innerHTML = '';

      MONTH_NAMES.forEach(function(m, idx) {
        var mInvs = yearlyInvs.filter(function(i) { return new Date(i.invoiceDate).getMonth() === idx; });
        var mSales = mInvs.reduce(function(s, i) { return s + (Number(i.subtotal) || 0); }, 0);
        var mCash = mInvs.reduce(function(s, i) { return s + (Number(i.paymentReceived) || 0); }, 0);
        var mRem = mSales - mCash;
        var isZero = mInvs.length === 0 && mSales === 0 && mCash === 0;

        var tr = document.createElement('tr');
        tr.className = isZero ? 'hover:bg-slate-50/40 text-slate-400 transition-colors' : 'hover:bg-slate-50/80 transition-colors';
        tr.innerHTML = '<td class="py-2.5 sm:py-3 px-3 ' + (isZero ? 'font-normal text-slate-400' : 'font-semibold text-slate-800') + '">' + m + '</td>' +
          '<td class="py-2.5 sm:py-3 px-3 text-center font-mono ' + (isZero ? 'text-slate-300' : 'text-slate-700 font-semibold') + '">' + (isZero ? '0' : mInvs.length) + '</td>' +
          '<td class="py-2.5 sm:py-3 px-3 text-right font-mono text-xs sm:text-sm ' + (isZero ? 'text-slate-300 font-normal' : 'font-bold text-emerald-800 bg-emerald-50/30') + '">' + formatRupees(mSales) + '</td>' +
          '<td class="py-2.5 sm:py-3 px-3 text-right font-mono text-xs sm:text-sm ' + (isZero ? 'text-slate-300 font-normal' : 'font-bold text-sky-800 bg-sky-50/30') + '">' + formatRupees(mCash) + '</td>' +
          '<td class="py-2.5 sm:py-3 px-3 text-right font-mono text-xs sm:text-sm ' + (isZero ? 'text-slate-300 font-normal' : (mRem > 0 ? 'font-bold text-amber-800 bg-amber-50/30' : 'font-bold text-emerald-700 bg-emerald-50/20')) + '">' + formatRupees(mRem) + '</td>';
        tb.appendChild(tr);
      });
    }


    // PRINT & WHATSAPP
    function showPrintModalById(id) {
      var inv = invoices.find(function(i) { return i.id === id; });
      if (inv) showPrintModal(inv);
    }

    function showPrintModal(inv) {
      var content = document.getElementById('printInvoiceContent');
      var itemsHtml = inv.items.map(function(it) {
        return '<tr class="border-b text-xs">' +
          '<td class="py-2">' + it.name + '</td>' +
          '<td class="py-2 text-center font-mono">' + it.quantity + '</td>' +
          '<td class="py-2 text-right font-mono">' + formatRupees(it.unitPrice) + '</td>' +
          '<td class="py-2 text-right font-mono font-bold">' + formatRupees(it.amount) + '</td>' +
        '</tr>';
      }).join('');

      content.innerHTML = '<div class="border-b-2 border-slate-900 pb-4 mb-4">' +
        '<div class="flex justify-between items-start">' +
          '<div>' +
            '<h2 class="text-xl font-black tracking-tight text-slate-900">' + businessInfo.name + '</h2>' +
            (businessInfo.tagline ? '<p class="text-xs text-emerald-800 italic">' + businessInfo.tagline + '</p>' : '') +
            '<p class="text-xs text-slate-600 mt-1">' + businessInfo.address + '</p>' +
            '<p class="text-xs text-slate-600">Phone: ' + businessInfo.phone + '</p>' +
          '</div>' +
          '<div class="text-right">' +
            '<h1 class="text-xl font-extrabold font-mono text-slate-900">INVOICE</h1>' +
            '<p class="text-xs font-mono font-bold text-slate-700">#' + inv.invoiceNumber + '</p>' +
            '<p class="text-xs text-slate-500">Date: ' + inv.invoiceDate + '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="bg-slate-50 p-3 rounded-lg border mb-4 text-xs">' +
        '<span class="text-[10px] uppercase font-bold text-slate-400 block">Billed To:</span>' +
        '<h4 class="font-bold text-slate-900 text-sm">' + inv.customerName + '</h4>' +
        (inv.customerPhone ? '<p class="text-slate-600">Phone: ' + inv.customerPhone + '</p>' : '') +
      '</div>' +
      '<table class="w-full text-left mb-6 border-collapse">' +
        '<thead>' +
          '<tr class="border-b-2 border-slate-900 text-[11px] uppercase text-slate-700">' +
            '<th class="py-2">Item Description</th>' +
            '<th class="py-2 text-center w-16">Qty</th>' +
            '<th class="py-2 text-right w-24">Unit Price</th>' +
            '<th class="py-2 text-right w-28">Amount</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + itemsHtml + '</tbody>' +
      '</table>' +
      '<div class="flex justify-end">' +
        '<div class="w-72 space-y-1.5 text-xs">' +
          '<div class="flex justify-between py-1 border-b"><span>1. Items Subtotal:</span><span class="font-mono font-bold">' + formatRupees(inv.subtotal) + '</span></div>' +
          '<div class="flex justify-between py-1 border-b text-amber-800"><span>2. Previous Balance:</span><span class="font-mono font-bold">' + formatRupees(inv.previousBalance) + '</span></div>' +
          '<div class="flex justify-between py-1.5 border-b-2 border-slate-900 font-bold text-sm"><span>3. Total Bill:</span><span class="font-mono text-emerald-800">' + formatRupees(inv.totalBill) + '</span></div>' +
          '<div class="flex justify-between py-1 border-b text-sky-800"><span>4. Payment Received:</span><span class="font-mono font-bold">' + formatRupees(inv.paymentReceived || 0) + '</span></div>' +
          '<div class="flex justify-between py-2 border-b-2 border-slate-900 font-bold text-base text-amber-900 bg-amber-50 px-2 rounded"><span>5. Remaining Balance:</span><span class="font-mono">' + formatRupees(inv.remainingBalance) + '</span></div>' +
        '</div>' +
      '</div>';

      document.getElementById('printModal').classList.remove('hidden');
    }

    function closePrintModal() {
      document.getElementById('printModal').classList.add('hidden');
    }

    function handleFormShareWhatsApp() {
      var calc = recalculate();
      var custName = document.getElementById('invCustomerName').value.trim() || 'Valued Customer';
      var invNum = document.getElementById('invNumber').value.trim();

      var text = '*' + businessInfo.name + '*\\n' +
        (businessInfo.tagline ? '_' + businessInfo.tagline + '_\\n' : '') +
        'Phone: ' + businessInfo.phone + '\\n\\n' +
        '🧾 *INVOICE: ' + invNum + '*\\n' +
        '👤 Customer: *' + custName + '*\\n' +
        '---------------------------\\n';

      currentItems.forEach(function(it) {
        if (it.name) {
          text += '• ' + it.name + ' (' + it.qty + ' x ' + formatRupees(it.price) + ') = *' + formatRupees(it.qty * it.price) + '*\\n';
        }
      });

      text += '---------------------------\\n' +
        'Subtotal: ' + formatRupees(calc.subtotal) + '\\n' +
        'Previous Balance: ' + formatRupees(calc.prevBal) + '\\n' +
        '💰 *TOTAL BILL: ' + formatRupees(calc.totalBill) + '*\\n' +
        '✅ Payment Received: ' + formatRupees(calc.paymentReceived) + '\\n' +
        '⚠️ *REMAINING BALANCE (Baqaya): ' + formatRupees(calc.remaining) + '*\\n\\n' +
        'Thank you for your business!';

      var url = 'https://wa.me/?text=' + encodeURIComponent(text);
      window.open(url, '_blank');
    }

    function shareWhatsAppDirect(id) {
      var inv = invoices.find(function(i) { return i.id === id; });
      if (!inv) return;

      var text = '*' + businessInfo.name + '*\\n' +
        (businessInfo.tagline ? '_' + businessInfo.tagline + '_\\n' : '') +
        'Phone: ' + businessInfo.phone + '\\n\\n' +
        '🧾 *INVOICE: ' + inv.invoiceNumber + '*\\n' +
        '📅 Date: ' + inv.invoiceDate + '\\n' +
        '👤 Customer: *' + inv.customerName + '*\\n' +
        '---------------------------\\n';

      inv.items.forEach(function(it) {
        text += '• ' + it.name + ' (' + it.quantity + ' x ' + formatRupees(it.unitPrice) + ') = *' + formatRupees(it.amount) + '*\\n';
      });

      text += '---------------------------\\n' +
        'Subtotal: ' + formatRupees(inv.subtotal) + '\\n' +
        'Previous Balance: ' + formatRupees(inv.previousBalance) + '\\n' +
        '💰 *TOTAL BILL: ' + formatRupees(inv.totalBill) + '*\\n' +
        '✅ Payment Received: ' + formatRupees(inv.paymentReceived || 0) + '\\n' +
        '⚠️ *REMAINING BALANCE (Baqaya): ' + formatRupees(inv.remainingBalance) + '*\\n\\n' +
        'Thank you for your business!';

      var phoneClean = (inv.customerPhone || '').replace(/[^0-9]/g, '');
      var url = phoneClean ? ('https://wa.me/' + phoneClean + '?text=' + encodeURIComponent(text)) : ('https://wa.me/?text=' + encodeURIComponent(text));
      window.open(url, '_blank');
    }

    // ON STARTUP
    window.addEventListener('DOMContentLoaded', function() {
      initSecurity();
      renderStoreInfo();
      resetFormToEmpty();
    });
  </script>
</body>
</html>`;

  const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'InvoiceFlow_App.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
