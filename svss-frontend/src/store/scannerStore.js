import { create } from 'zustand'

const useScannerStore = create((set) => ({
  cameraStatus: 'idle',   // idle | active | error | permission_denied
  scanStatus: 'idle',     // idle | scanning | success | error
  scannedTicket: null,
  verificationResult: null, // null | 'approved' | 'rejected'

  setCameraStatus: (status) => set({ cameraStatus: status }),
  setScanStatus: (status) => set({ scanStatus: status }),
  setScannedTicket: (ticket) => set({ scannedTicket: ticket }),
  setVerificationResult: (result) => set({ verificationResult: result }),

  resetScanner: () =>
    set({
      scanStatus: 'idle',
      scannedTicket: null,
      verificationResult: null,
    }),
}))

export default useScannerStore
