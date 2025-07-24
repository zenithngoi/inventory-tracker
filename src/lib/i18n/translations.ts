// Translation dictionaries for English, Simplified Chinese, and Bahasa Melayu

export type Locale = 'en' | 'zh-CN' | 'ms-MY';

export const en = {
  common: {
    languageName: 'English',
    scanning: 'Scanning...',
    scannedSuccessfully: 'Scanned Successfully!',
    scanComplete: 'Scan Complete',
    startScanner: 'Start Scanner',
    stopScanner: 'Stop Scanner',
    enterBarcodeManually: 'Enter Barcode Manually',
    barcodeDetected: 'Barcode detected',
    submit: 'Submit',
    close: 'Close',
    error: 'Error',
    manualInput: 'Manual Input',
    barcodeScanner: 'Barcode Scanner',
    savedInCloud: 'Saved in Cloud (Edge Config)',
    languagePreferenceSaved: 'Your language preference is saved in Vercel Edge Config',
  },
};

export const zhCN = {
  common: {
    languageName: '简体中文',
    scanning: '正在扫描...',
    scannedSuccessfully: '扫描成功！',
    scanComplete: '扫描完成',
    startScanner: '开始扫描',
    stopScanner: '停止扫描',
    enterBarcodeManually: '手动输入条码',
    barcodeDetected: '检测到条码',
    submit: '提交',
    close: '关闭',
    error: '错误',
    manualInput: '手动输入',
    barcodeScanner: '条码扫描器',
    savedInCloud: '已保存在云端（Edge Config）',
    languagePreferenceSaved: '您的语言偏好已保存在 Vercel Edge Config',
  },
};

export const msMY = {
  common: {
    languageName: 'Bahasa Melayu',
    scanning: 'Mengimbas...',
    scannedSuccessfully: 'Berjaya Imbas!',
    scanComplete: 'Imbas Selesai',
    startScanner: 'Mula Imbas',
    stopScanner: 'Henti Imbas',
    enterBarcodeManually: 'Masukkan Kod Bar Secara Manual',
    barcodeDetected: 'Kod Bar Dikesan',
    submit: 'Hantar',
    close: 'Tutup',
    error: 'Ralat',
    manualInput: 'Input Manual',
    barcodeScanner: 'Pengimbas Kod Bar',
    savedInCloud: 'Disimpan di Cloud (Edge Config)',
    languagePreferenceSaved: 'Keutamaan bahasa anda disimpan dalam Vercel Edge Config',
  },
};