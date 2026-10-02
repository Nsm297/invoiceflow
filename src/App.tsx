import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabType, Customer, Invoice, BusinessInfo, SecurityConfig } from './types/invoice';
import {
  getStoredCustomers,
  saveStoredCustomers,
  saveCustomer,
  deleteCustomer,
  getStoredInvoices,
  saveStoredInvoices,
  saveInvoice,
  deleteInvoice,
  getStoredBusinessInfo,
  saveStoredBusinessInfo,
  resetAllDemoData,
  clearAllUserData,
  DEFAULT_BUSINESS_INFO,
} from './utils/storage';
import {
  getStoredSecurityConfig,
  saveStoredSecurityConfig,
  DEFAULT_SECURITY_CONFIG,
} from './utils/security';
import {
  syncDataToFirestore,
  fetchDataFromFirestore,
  checkRedirectLogin,
  syncSecuritySettingsToFirestore,
  fetchSecuritySettingsFromFirestore,
} from './utils/firebase';
import { formatRupees, shareInvoiceViaWhatsApp } from './utils/formatters';
import {
  shareInvoiceViaWhatsAppImage,
  downloadInvoiceImage,
  downloadInvoicePDF,
} from './utils/pdfGenerator';
import { downloadStandaloneHtmlApp } from './utils/standaloneApp';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InAppBrowserWarning } from './components/InAppBrowserWarning';
import { Login } from './pages/Login';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CustomerModule } from './components/CustomerModule';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceHistory } from './components/InvoiceHistory';
import { MonthlyStatement } from './components/MonthlyStatement';
import { YearlyStatement } from './components/YearlyStatement';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { StoreInfoModule } from './components/StoreInfoModule';
import { SecurityLockScreen } from './components/SecurityLockScreen';
import { PinConfirmModal } from './components/PinConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';

function MainApp() {
  const { user: currentUser, loading: authLoading, loginWithGoogle, logout: logoutUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('create');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(getStoredBusinessInfo());
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(getStoredSecurityConfig());

  // Cloud Sync States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Security Lock state - maintain unlocked state across page refreshes via sessionStorage
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const sec = getStoredSecurityConfig();
    const isUnlockedInSession =
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pwa_unlocked') === 'true';
    if (isUnlockedInSession) return false;
    return Boolean(sec.pinEnabled && sec.pin);
  });

  // PIN / Confirmation prompt state for protected data deletions
  const [pinConfirmModalState, setPinConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemDetails?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Transient states
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [preselectedCustomer, setPreselectedCustomer] = useState<Customer | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showBusinessModal, setShowBusinessModal] = useState<boolean>(false);

  // Refs for current data in auto-sync without stale closures
  const customersRef = useRef<Customer[]>(customers);
  const invoicesRef = useRef<Invoice[]>(invoices);
  const businessInfoRef = useRef<BusinessInfo>(businessInfo);

  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  useEffect(() => {
    invoicesRef.current = invoices;
  }, [invoices]);

  useEffect(() => {
    businessInfoRef.current = businessInfo;
  }, [businessInfo]);

  // Load stored data on mount & synchronize permanent user-scoped security config
  useEffect(() => {
    setCustomers(getStoredCustomers());
    setInvoices(getStoredInvoices());
    setBusinessInfo(getStoredBusinessInfo());

    const uid = currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('app_user_uid') || undefined : undefined);
    const sec = getStoredSecurityConfig(uid);
    setSecurityConfig(sec);

    if (uid) {
      // Sync security config from Firestore if available
      fetchSecuritySettingsFromFirestore(uid).then((cloudSec) => {
        if (cloudSec && cloudSec.pin) {
          const merged: SecurityConfig = {
            pinEnabled: Boolean(cloudSec.pinEnabled),
            pin: cloudSec.pin,
            biometricEnabled: Boolean(cloudSec.biometricEnabled),
            credentialId: cloudSec.credentialId,
            autoLockOnIdle: Boolean(cloudSec.autoLockOnIdle),
          };
          setSecurityConfig(merged);
          saveStoredSecurityConfig(merged, uid);
        }
      });
    }

    const isUnlockedInSession =
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pwa_unlocked') === 'true';
    if (sec.pinEnabled && sec.pin && !isUnlockedInSession) {
      setIsLocked(true);
    }
  }, [currentUser]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cloud Auto-Sync Trigger
  const autoSyncToCloud = useCallback(
    async (
      uid: string,
      customData?: { invoices?: Invoice[]; customers?: Customer[]; businessInfo?: BusinessInfo }
    ) => {
      if (!uid) return;
      try {
        setIsSyncing(true);
        const dataToUpload = {
          invoices: customData?.invoices ?? invoicesRef.current,
          customers: customData?.customers ?? customersRef.current,
          businessInfo: customData?.businessInfo ?? businessInfoRef.current,
        };
        const res = await syncDataToFirestore(uid, dataToUpload);
        if (res.success) {
          const formatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncedTime(formatted);
        }
      } catch (err) {
        console.error('Auto cloud sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Check redirect login on initial mount
  useEffect(() => {
    checkRedirectLogin().catch(() => {});
  }, []);

  // Monitor Firebase Auth state & fetch Cloud data once session is restored
  useEffect(() => {
    if (authLoading) return; // Wait until local IndexedDB session check completes
    if (!currentUser) return;

    let isMounted = true;

    const loadCloudData = async () => {
      try {
        setIsSyncing(true);
        const cloudData = await fetchDataFromFirestore(currentUser.uid);
        if (!isMounted) return;

        if (cloudData && (cloudData.invoices?.length || cloudData.customers?.length || cloudData.businessInfo)) {
          // Apply cloud data to local state and localStorage
          if (cloudData.customers && cloudData.customers.length > 0) {
            setCustomers(cloudData.customers);
            saveStoredCustomers(cloudData.customers);
          }
          if (cloudData.invoices && cloudData.invoices.length > 0) {
            setInvoices(cloudData.invoices);
            saveStoredInvoices(cloudData.invoices);
          }
          if (cloudData.businessInfo) {
            setBusinessInfo(cloudData.businessInfo);
            saveStoredBusinessInfo(cloudData.businessInfo);
          }
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          showToast(
            'success',
            'Cloud Synced with Google Account',
            `Loaded ${cloudData.invoices?.length || 0} invoices & ${cloudData.customers?.length || 0} customers from Firestore.`
          );
        } else {
          // Initial account setup: seed Firestore with current local data
          await autoSyncToCloud(currentUser.uid, {
            invoices: getStoredInvoices(),
            customers: getStoredCustomers(),
            businessInfo: getStoredBusinessInfo(),
          });
          showToast(
            'success',
            'Cloud Backup Initialized',
            'Your current invoices and customers have been backed up to your Google account.'
          );
        }
      } catch (err) {
        console.error('Error fetching cloud data on login:', err);
        showToast('error', 'Cloud Fetch Failed', 'Could not retrieve data from Firestore.');
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    };

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, [currentUser, authLoading, showToast, autoSyncToCloud]);

  // Google Login / Logout Handlers
  const handleGoogleSignIn = async () => {
    try {
      showToast('info', 'Connecting to Google...', 'Opening Google Authentication popup.');
      const user = await loginWithGoogle();
      if (user) {
        showToast('success', 'Signed In', `Welcome ${user.displayName || user.email}!`);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        let msg = err?.message || 'Authentication error.';
        if (err?.code === 'auth/api-key-not-valid') {
          msg = 'Firebase API Key is invalid or expired. Check Firebase Console Authentication settings.';
        } else if (err?.code === 'auth/unauthorized-domain') {
          msg = 'This domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.';
        }
        showToast('error', 'Google Sign-In Failed', msg);
      }
    }
  };

  const handleOpenLoginScreen = () => {
    // Navigates to Login
  };

  const handleGoogleSignOut = async () => {
    try {
      const uid = currentUser?.uid;
      await logoutUser();
      clearAllUserData();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('pwa_unlocked');
      }
      setCustomers([]);
      setInvoices([]);
      setBusinessInfo(DEFAULT_BUSINESS_INFO);
      // Permanent security settings are preserved and never reset on logout
      const preservedSec = getStoredSecurityConfig(uid);
      setSecurityConfig(preservedSec);
      if (preservedSec.pinEnabled && preservedSec.pin) {
        setIsLocked(true);
      }
      setEditingInvoice(null);
      setPreselectedCustomer(null);
      setPreviewInvoice(null);
      setLastSyncedTime(null);
      setCurrentTab('create');
      showToast('info', 'Signed Out', 'You have been signed out. Please log in to continue.');
    } catch (err: any) {
      console.error('Sign out error:', err);
      showToast('error', 'Sign Out Error', err?.message);
    }
  };

  // Manual Sync & Restore Handlers
  const handleManualSyncToCloud = async () => {
    if (!currentUser) {
      showToast('info', 'Google Login Required', 'Please sign in with Google first to sync to cloud.');
      return;
    }
    try {
      setIsSyncing(true);
      await syncDataToFirestore(currentUser.uid, {
        invoices,
        customers,
        businessInfo,
      });
      const formatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(formatted);
      showToast(
        'success',
        'Cloud Sync Successful',
        `Backed up ${invoices.length} invoices and ${customers.length} customers to users/${currentUser.uid}/appData/main.`
      );
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      showToast('error', 'Sync Failed', err?.message || 'Could not push data to Firestore.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualRestoreFromCloud = async () => {
    if (!currentUser) {
      showToast('info', 'Google Login Required', 'Please sign in with Google first.');
      return;
    }
    try {
      setIsSyncing(true);
      const data = await fetchDataFromFirestore(currentUser.uid);
      if (data) {
        if (data.customers) {
          setCustomers(data.customers);
          saveStoredCustomers(data.customers);
        }
        if (data.invoices) {
          setInvoices(data.invoices);
          saveStoredInvoices(data.invoices);
        }
        if (data.businessInfo) {
          setBusinessInfo(data.businessInfo);
          saveStoredBusinessInfo(data.businessInfo);
        }
        const formatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedTime(formatted);
        showToast(
          'success',
          'Cloud Restore Complete',
          `Restored ${data.invoices?.length || 0} invoices and ${data.customers?.length || 0} customers from Firestore.`
        );
      } else {
        showToast('info', 'No Cloud Data Found', 'No previous cloud records found for this account.');
      }
    } catch (err: any) {
      console.error('Manual restore failed:', err);
      showToast('error', 'Restore Failed', err?.message || 'Could not fetch data from Firestore.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveBusinessInfo = (info: BusinessInfo) => {
    saveStoredBusinessInfo(info);
    setBusinessInfo(info);
    if (currentUser) {
      autoSyncToCloud(currentUser.uid, { businessInfo: info });
    }
    showToast('success', 'Store Info Saved', `${info.name} details saved & applied.`);
  };

  const handleSaveSecurityConfig = (config: SecurityConfig) => {
    const uid = currentUser?.uid;
    saveStoredSecurityConfig(config, uid);
    setSecurityConfig(config);
    if (uid) {
      syncSecuritySettingsToFirestore(uid, config);
    }
    showToast(
      'success',
      'Security Settings Updated',
      config.pinEnabled ? '4-Digit PIN protection is active.' : 'Security lock disabled.'
    );
  };

  const handleLockApp = () => {
    if (securityConfig.pinEnabled) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('pwa_unlocked');
      }
      setIsLocked(true);
      showToast('info', 'App Locked', 'Passcode PIN required to unlock.');
    } else {
      showToast('info', 'No PIN Configured', 'Set a 4-digit PIN in Store Info & Security first.');
      setCurrentTab('store');
    }
  };

  const handleUnlockApp = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pwa_unlocked', 'true');
    }
    setIsLocked(false);
    showToast('success', 'Unlocked Successfully', `Welcome back to ${businessInfo.name || 'InvoiceFlow'}!`);
  };

  const handleResetSecurityFromLockScreen = (newPin?: string) => {
    const uid = currentUser?.uid;
    if (newPin) {
      const updated: SecurityConfig = {
        ...securityConfig,
        pin: newPin,
        pinEnabled: true,
      };
      saveStoredSecurityConfig(updated, uid);
      setSecurityConfig(updated);
      if (uid) {
        syncSecuritySettingsToFirestore(uid, updated);
      }
      handleUnlockApp();
      showToast('success', 'Security PIN Reset', 'Your new 4-digit PIN has been saved permanently.');
    } else {
      const updated: SecurityConfig = {
        pinEnabled: false,
        pin: '',
        biometricEnabled: false,
        credentialId: undefined,
      };
      saveStoredSecurityConfig(updated, uid);
      setSecurityConfig(updated);
      if (uid) {
        syncSecuritySettingsToFirestore(uid, updated);
      }
      handleUnlockApp();
      showToast('info', 'PIN Lock Disabled', 'Security PIN lock has been disabled.');
    }
  };

  // WhatsApp share action with high-resolution JPG image capture & Web Share API
  const handleShareWhatsApp = async (invoice: Invoice) => {
    try {
      showToast('info', 'Preparing Image...', `Capturing invoice image for #${invoice.invoiceNumber}...`);
      const result = await shareInvoiceViaWhatsAppImage(invoice, businessInfo);
      if (result === 'shared') {
        showToast('success', 'Image Shared Directly', `Invoice #${invoice.invoiceNumber} image shared via WhatsApp/Share.`);
      } else if (result === 'opened_wa_and_downloaded') {
        showToast('success', 'Image Downloaded & WhatsApp Opened', `Invoice image saved to downloads. Select it in WhatsApp to send.`);
      }
    } catch (err) {
      console.error('Share error:', err);
      showToast('info', 'Opening WhatsApp', `Connecting to WhatsApp for ${invoice.customerName}...`);
      await shareInvoiceViaWhatsApp(invoice, businessInfo);
    }
  };

  // Customer actions
  const handleSaveCustomer = (customer: Customer) => {
    const updated = saveCustomer(customer);
    setCustomers(updated);
    if (currentUser) {
      autoSyncToCloud(currentUser.uid, { customers: updated });
    }
    showToast('success', 'Customer Saved', `${customer.name} (Opening: ${formatRupees(customer.openingBalance)})`);
  };

  const handleDeleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    setPinConfirmModalState({
      isOpen: true,
      title: 'Authorize Customer Deletion',
      description: `Deleting ${cust?.name || 'this customer'} will permanently erase their balance & profile from the ledger.`,
      itemDetails: cust ? `Customer: ${cust.name} | Phone: ${cust.phone || 'N/A'}` : undefined,
      onConfirm: () => {
        const updated = deleteCustomer(id);
        setCustomers(updated);
        if (currentUser) {
          autoSyncToCloud(currentUser.uid, { customers: updated });
        }
        showToast('info', 'Customer Deleted', cust ? `${cust.name} removed.` : undefined);
      },
    });
  };

  const handleCreateInvoiceForCustomer = (customer: Customer) => {
    setEditingInvoice(null);
    setPreselectedCustomer(customer);
    setCurrentTab('create');
  };

  // Invoice actions
  const handleSaveInvoice = (
    invoice: Invoice,
    newCustomerToSave?: Customer,
    shouldGeneratePDF?: boolean
  ) => {
    let currentCustList = customers;
    if (newCustomerToSave) {
      currentCustList = saveCustomer(newCustomerToSave);
      setCustomers(currentCustList);
    }

    const updatedInvoices = saveInvoice(invoice);
    setInvoices(updatedInvoices);
    const reloadedCustomers = getStoredCustomers();
    setCustomers(reloadedCustomers);

    if (currentUser) {
      autoSyncToCloud(currentUser.uid, {
        invoices: updatedInvoices,
        customers: reloadedCustomers,
      });
    }

    const wasEditing = editingInvoice !== null;
    setEditingInvoice(null);
    setPreselectedCustomer(null);

    if (shouldGeneratePDF) {
      setPreviewInvoice(invoice);
      showToast(
        'success',
        `Invoice #${invoice.invoiceNumber} Generated & Saved`,
        `Form auto-reset for next invoice. Total Bill: ${formatRupees(invoice.totalBill)} | Balance: ${formatRupees(invoice.remainingBalance)}`
      );
    } else {
      showToast(
        'success',
        `Invoice #${invoice.invoiceNumber} Saved & Form Cleared`,
        `Form is ready for next invoice. Total Bill: ${formatRupees(invoice.totalBill)} | Balance: ${formatRupees(invoice.remainingBalance)}`
      );
      if (wasEditing) {
        setCurrentTab('history');
      }
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    setPinConfirmModalState({
      isOpen: true,
      title: 'Authorize Invoice Deletion',
      description: `Permanently delete invoice #${inv?.invoiceNumber || id}? This modifies customer running balances.`,
      itemDetails: inv
        ? `Invoice #${inv.invoiceNumber} | Customer: ${inv.customerName} | Total: ${formatRupees(inv.totalBill)}`
        : undefined,
      onConfirm: () => {
        const updated = deleteInvoice(id);
        setInvoices(updated);
        if (currentUser) {
          autoSyncToCloud(currentUser.uid, { invoices: updated });
        }
        showToast('info', 'Invoice Deleted', inv ? `#${inv.invoiceNumber} removed.` : undefined);
      },
    });
  };

  const handleCreateNewInvoice = () => {
    setEditingInvoice(null);
    setPreselectedCustomer(null);
    setCurrentTab('create');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setPreselectedCustomer(null);
    setCurrentTab('create');
    showToast(
      'info',
      'Edit Mode Activated',
      `Editing #${invoice.invoiceNumber} for ${invoice.customerName}. Saving will update this record directly.`
    );
  };

  const handleCreateNewForCustomerName = (
    customerName: string,
    customerPhone?: string,
    previousBalance?: number
  ) => {
    const existing = customers.find((c) => c.name.toLowerCase() === customerName.toLowerCase());
    if (existing) {
      setPreselectedCustomer(existing);
    } else {
      const initBal = previousBalance || 0;
      setPreselectedCustomer({
        id: 'custom',
        name: customerName,
        phone: customerPhone || '',
        openingBalance: initBal,
        previousBalance: initBal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingInvoice(null);
    setCurrentTab('create');
  };

  const handleResetData = () => {
    setPinConfirmModalState({
      isOpen: true,
      title: 'Authorize Ledger / Demo Reset',
      description: 'Resetting ledger data will replace your current customers and invoices with sample demo records.',
      itemDetails: `Current: ${invoices.length} invoices, ${customers.length} customers`,
      onConfirm: () => {
        const res = resetAllDemoData();
        setCustomers(res.customers);
        setInvoices(res.invoices);
        setBusinessInfo(res.businessInfo);
        setEditingInvoice(null);
        setPreselectedCustomer(null);
        if (currentUser) {
          autoSyncToCloud(currentUser.uid, {
            customers: res.customers,
            invoices: res.invoices,
            businessInfo: res.businessInfo,
          });
        }
        showToast('success', 'Demo Data Restored', 'Loaded sample customers and invoices in Rupees (Rs.).');
      },
    });
  };

  // ==========================================
  // ROUTE FLOW LOGIC ENFORCEMENT (States A, B, C, D)
  // ==========================================

  // State A: Show Session Verification Screen ONLY while authLoading is strictly true
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  // State D (user === null AND authLoading === false): Show the Email/Password Login Screen
  // Every single route requires an authenticated Firebase user (mandatory authentication)
  if (!currentUser) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
        <InAppBrowserWarning />
        <Login
          onSuccess={() => {
            showToast('success', 'Logged In', 'Welcome to InvoiceFlow!');
          }}
        />
      </>
    );
  }

  // State B & C (user !== null):
  // If LockScreen is active, render SecurityLockScreen (Fingerprint / 4-digit PIN)
  // Otherwise render Dashboard / App Main View (State C)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* State B: Security Lock Screen (Fingerprint / 4-Digit PIN) */}
      {isLocked && securityConfig.pinEnabled && (
        <SecurityLockScreen
          businessInfo={businessInfo}
          securityConfig={securityConfig}
          onUnlock={handleUnlockApp}
          onResetSecurity={handleResetSecurityFromLockScreen}
        />
      )}

      {/* Toast Feedback notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* In-App Browser Warning Banner (WhatsApp / Instagram / Facebook Webview) */}
      <InAppBrowserWarning />

      {/* Top Header Bar */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
        }}
        onNewInvoice={handleCreateNewInvoice}
        invoicesCount={invoices.length}
        customersCount={customers.length}
        pinEnabled={securityConfig.pinEnabled}
        onLockApp={handleLockApp}
        user={currentUser}
        authLoading={authLoading}
        isSyncing={isSyncing}
        onGoogleSignIn={handleOpenLoginScreen}
        onGoogleSignOut={handleGoogleSignOut}
      />

      {/* Quick Store Info & Security Ribbon */}
      <div className="bg-emerald-800 text-emerald-50 text-xs px-4 py-2 border-b border-emerald-900/40 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold tracking-wide truncate">{businessInfo.name}</span>
            <span className="opacity-60 hidden sm:inline">·</span>
            <span className="opacity-90 hidden sm:inline">{businessInfo.phone}</span>
            <span className="opacity-60 hidden md:inline">·</span>
            <span className="opacity-90 hidden md:inline truncate">{businessInfo.address}</span>
            {currentUser && (
              <>
                <span className="opacity-60 hidden lg:inline">·</span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-200 border border-emerald-700/50">
                  <i className="fa-solid fa-cloud text-[9px]"></i> Cloud Synced
                </span>
              </>
            )}
            {securityConfig.pinEnabled && (
              <>
                <span className="opacity-60 hidden lg:inline">·</span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-200 border border-emerald-700/50">
                  <i className="fa-solid fa-lock text-[9px]"></i> PIN Protected
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {securityConfig.pinEnabled && (
              <button
                onClick={handleLockApp}
                className="text-[11px] font-semibold bg-rose-900/70 hover:bg-rose-800 px-2 py-0.5 rounded text-rose-100 shadow-xs flex items-center gap-1 transition-colors"
                title="Lock Application Screen"
              >
                <i className="fa-solid fa-lock text-[10px]"></i>
                <span>Lock</span>
              </button>
            )}
            <button
              onClick={downloadStandaloneHtmlApp}
              className="text-[11px] font-semibold bg-emerald-700/80 hover:bg-emerald-600 px-2 py-0.5 rounded text-white shadow-xs flex items-center gap-1 transition-colors"
              title="Download 100% offline standalone single-file HTML invoice generator with PIN lock & Google Cloud Sync"
            >
              <i className="fa-solid fa-download text-[10px]"></i>
              <span className="hidden sm:inline">Export</span> Single-File App
            </button>
            <span className="opacity-60">·</span>
            <button
              onClick={() => setCurrentTab('store')}
              className="text-[11px] underline opacity-90 hover:opacity-100 font-medium"
            >
              Store & Security
            </button>
            <span className="opacity-60">·</span>
            <button
              onClick={handleResetData}
              className="text-[11px] opacity-90 hover:opacity-100 font-medium"
              title="Reset demo records"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
        {/* 1. Store Info & Security Tab */}
        {currentTab === 'store' && (
          <StoreInfoModule
            businessInfo={businessInfo}
            securityConfig={securityConfig}
            onSaveBusinessInfo={handleSaveBusinessInfo}
            onSaveSecurityConfig={handleSaveSecurityConfig}
            onNavigateToCreate={() => setCurrentTab('create')}
            onLockApp={handleLockApp}
            user={currentUser}
            authLoading={authLoading}
            isSyncing={isSyncing}
            lastSyncedTime={lastSyncedTime}
            onGoogleSignIn={handleOpenLoginScreen}
            onGoogleSignOut={handleGoogleSignOut}
            onSyncToCloud={handleManualSyncToCloud}
            onRestoreFromCloud={handleManualRestoreFromCloud}
          />
        )}

        {/* 2. Create Invoice Tab */}
        {currentTab === 'create' && (
          <InvoiceForm
            customers={customers}
            existingInvoices={invoices}
            initialInvoice={editingInvoice}
            preselectedCustomer={preselectedCustomer}
            businessInfo={businessInfo}
            onSaveInvoice={handleSaveInvoice}
            onPreviewInvoice={(inv) => setPreviewInvoice(inv)}
            onShareWhatsApp={handleShareWhatsApp}
            onEditStoreInfo={() => setCurrentTab('store')}
            onCancelEdit={() => {
              setEditingInvoice(null);
              setCurrentTab('history');
            }}
          />
        )}

        {/* 3. Customers Tab */}
        {currentTab === 'customers' && (
          <CustomerModule
            customers={customers}
            invoices={invoices}
            businessInfo={businessInfo}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onCreateInvoiceForCustomer={handleCreateInvoiceForCustomer}
            onViewInvoice={(inv) => setPreviewInvoice(inv)}
          />
        )}

        {/* 4. History Tab */}
        {currentTab === 'history' && (
          <InvoiceHistory
            invoices={invoices}
            onPreviewInvoice={(inv) => setPreviewInvoice(inv)}
            onDeleteInvoice={handleDeleteInvoice}
            onShareWhatsApp={handleShareWhatsApp}
            onEditInvoice={handleEditInvoice}
            onCreateNewForCustomer={handleCreateNewForCustomerName}
            onCreateNew={handleCreateNewInvoice}
          />
        )}

        {/* 5. Monthly Statement Tab */}
        {currentTab === 'monthly' && (
          <MonthlyStatement
            invoices={invoices}
            customers={customers}
            businessInfo={businessInfo}
            onPreviewInvoice={(inv) => setPreviewInvoice(inv)}
            onShareWhatsApp={handleShareWhatsApp}
          />
        )}

        {/* 6. Yearly Statement Tab */}
        {currentTab === 'yearly' && (
          <YearlyStatement
            invoices={invoices}
            customers={customers}
            businessInfo={businessInfo}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (6 tabs) */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Fullscreen Printable PDF Preview Modal */}
      <InvoicePrintModal
        invoice={previewInvoice}
        businessInfo={businessInfo}
        isOpen={previewInvoice !== null}
        onClose={() => setPreviewInvoice(null)}
        onShareWhatsApp={handleShareWhatsApp}
      />

      {/* Edit Store Info Modal */}
      {showBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Business / Store Information</h3>
              <button
                onClick={() => setShowBusinessModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveStoredBusinessInfo(businessInfo);
                setShowBusinessModal(false);
                if (currentUser) {
                  autoSyncToCloud(currentUser.uid, { businessInfo });
                }
                showToast('success', 'Store Info Saved', 'Updated store name, phone, tagline, and address.');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Header Note
                </label>
                <input
                  type="text"
                  value={businessInfo.tagline || ''}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
                  placeholder="e.g. Quality Rice, Oil & Wholesale Grains"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Address
                </label>
                <textarea
                  rows={2}
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBusinessModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm min-h-[38px]"
                >
                  Save Store Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4-Digit PIN & Action Confirmation Modal for Protected Deletions */}
      <PinConfirmModal
        isOpen={pinConfirmModalState.isOpen}
        onClose={() => setPinConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={pinConfirmModalState.onConfirm}
        requiredPin={securityConfig.pinEnabled ? securityConfig.pin : undefined}
        actionTitle={pinConfirmModalState.title}
        actionDescription={pinConfirmModalState.description}
        itemDetails={pinConfirmModalState.itemDetails}
      />

      {/* Connectivity & Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

