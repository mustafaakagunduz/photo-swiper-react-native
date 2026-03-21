export type Language = 'tr' | 'en';

export interface Translations {
  // PermissionScreen
  appTagline: string;
  swipeLeftDelete: string;
  swipeRightKeep: string;
  undoMistake: string;
  deletedToRecent: string;
  grantAccess: string;
  waitingPermission: string;
  permissionDenied: string;
  tryAgain: string;
  permissionBlocked: string;
  openSettings: string;
  disclaimer: string;

  // SwipeScreen states
  loadingGallery: string;
  errorTitle: string;
  galleryEmpty: string;
  noMediaFound: string;
  sessionComplete: string;
  calculatingResults: string;
  selectStartPoint: string;
  pendingBadge(n: number): string;

  // ProgressHeader
  statKeptLabel: string;
  statDeletedLabel: string;
  statRemainingLabel: string;

  // ActionButtons
  deleteLabel: string;
  keepLabel: string;
  swipeHint: string;

  // SwipeCard
  keepVerb: string;
  deleteVerb: string;

  // PendingScreen
  photoDeletedMsg(n: number): string;
  photoRescuedMsg(n: number): string;
  doneLabel: string;
  continueBtn: string;
  backBtn: string;
  photoCountLabel(n: number): string;
  rescuedCountLabel(n: number): string;
  tapToRescue: string;
  allRescuedHint: string;
  deleteKeepSummary(del: number, res: number): string;
  keepAllBtn: string;
  deleteBtnLabel(n: number, keep: number): string;
  deletingLabel: string;
  iosConfirmHint: string;

  // ResultScreen
  sessionCompleted: string;
  pendingDeleteTitle(n: number): string;
  iosSingleConfirm: string;
  deleteNPhotos(n: number): string;
  cancelledMsg: string;
  statDeleted: string;
  statToDelete: string;
  statKept: string;
  statTotal: string;
  movedToRecent: string;
  cleanedPercent(p: number): string;
  newSession: string;
  recentFilesNote: string;
  summaryNone: string;
  summaryPending(n: number): string;
  summaryZero: string;
  summarySmall: string;
  summaryMedium: string;
  summaryLarge: string;
  summaryMax: string;

  // GalleryPickerModal
  cancel: string;
  startPointTitle: string;
  tapToStart: string;
  noPhotoFound: string;
}

const tr: Translations = {
  appTagline: 'Fotoğraf ve videolarını hızlıca temizle',
  swipeLeftDelete: 'Sola kaydır — Sil',
  swipeRightKeep: 'Sağa kaydır — Koru',
  undoMistake: 'Yanlış silmede geri al',
  deletedToRecent: 'Silinen → Son Silinenler',
  grantAccess: 'Galeriye Erişime İzin Ver',
  waitingPermission: 'İzin bekleniyor…',
  permissionDenied:
    'Galeri erişimi reddedildi. Uygulamanın çalışabilmesi için erişime izin verilmesi gerekiyor.',
  tryAgain: 'Tekrar Dene',
  permissionBlocked:
    "Galeri erişimi kalıcı olarak engellendi. Devam etmek için Ayarlar'dan izni manuel olarak ver.",
  openSettings: 'Ayarları Aç',
  disclaimer: 'Hiçbir veri buluta yüklenmez.\nHer şey cihazında kalır.',

  loadingGallery: 'Galeri yükleniyor…',
  errorTitle: 'Hata',
  galleryEmpty: 'Galeri Boş',
  noMediaFound: 'Görüntülenecek fotoğraf veya video bulunamadı.',
  sessionComplete: 'Tamamlandı',
  calculatingResults: 'Sonuçlar hesaplanıyor…',
  selectStartPoint: 'Başlangıç Noktası Seç',
  pendingBadge: (n) => `${n} foto silinmeyi bekliyor — Gör & Onayla`,

  statKeptLabel: 'Tutulan',
  statDeletedLabel: 'Silinen',
  statRemainingLabel: 'Kalan',

  deleteLabel: 'Sil',
  keepLabel: 'Koru',
  swipeHint: '← Sil · Koru →',

  keepVerb: 'KORU',
  deleteVerb: 'SİL',

  photoDeletedMsg: (n) => `${n} fotoğraf silindi`,
  photoRescuedMsg: (n) => `${n} fotoğraf kurtarıldı`,
  doneLabel: 'Tamamlandı',
  continueBtn: 'Devam Et',
  backBtn: '← Geri',
  photoCountLabel: (n) => `${n} Foto`,
  rescuedCountLabel: (n) => `${n} kurtarıldı`,
  tapToRescue: 'Korumak istediğin fotoğrafa dokun',
  allRescuedHint: 'Hepsi kurtarıldı — aşağıdan onayla',
  deleteKeepSummary: (del, res) => `${del} silinecek · ${res} kurtarılacak`,
  keepAllBtn: 'Hepsini Koru & Devam Et',
  deleteBtnLabel: (n, keep) =>
    keep > 0 ? `${n} Fotoğrafı Sil  ·  ${keep} Koru` : `${n} Fotoğrafı Sil`,
  deletingLabel: 'Siliniyor…',
  iosConfirmHint: 'iOS tek seferlik onay isteyecek',

  sessionCompleted: 'Oturum Tamamlandı',
  pendingDeleteTitle: (n) => `${n} fotoğraf silinmeyi bekliyor`,
  iosSingleConfirm: 'Tek bir onay ile hepsini sil — iOS tek seferlik izin ister.',
  deleteNPhotos: (n) => `${n} Fotoğrafı Sil`,
  cancelledMsg: 'İptal edildi — fotoğraflar silinmedi.',
  statDeleted: 'Silindi',
  statToDelete: 'Silinecek',
  statKept: 'Tutuldu',
  statTotal: 'Toplam',
  movedToRecent: "Son Silinenler'e\ntaşındı",
  cleanedPercent: (p) => `${p}%\ntemizlendi`,
  newSession: 'Yeni Oturum Başlat',
  recentFilesNote:
    'Silinen öğeler iOS "Son Silinenler" klasöründe\n30 gün boyunca saklanır.',
  summaryNone: 'Hiçbir şey işaretlemedin.',
  summaryPending: (n) => `${n} fotoğraf silme için işaretlendi.`,
  summaryZero: 'Hiçbir şey silmedin, galerin korundu.',
  summarySmall: 'Küçük bir temizlik yaptın.',
  summaryMedium: 'Galerini güzel bir şekilde temizledin.',
  summaryLarge: 'Ciddi bir temizlik yaptın.',
  summaryMax: 'Galerin neredeyse sıfırlandı.',

  cancel: 'İptal',
  startPointTitle: 'Başlangıç Noktası',
  tapToStart: 'Kaydırmaya başlamak istediğin fotoğrafa dokun',
  noPhotoFound: 'Fotoğraf bulunamadı',
};

const en: Translations = {
  appTagline: 'Quickly clean your photos and videos',
  swipeLeftDelete: 'Swipe left — Delete',
  swipeRightKeep: 'Swipe right — Keep',
  undoMistake: 'Undo accidental deletes',
  deletedToRecent: 'Deleted → Recently Deleted',
  grantAccess: 'Allow Gallery Access',
  waitingPermission: 'Waiting for permission…',
  permissionDenied:
    'Gallery access was denied. You need to allow access for the app to work.',
  tryAgain: 'Try Again',
  permissionBlocked:
    'Gallery access is permanently blocked. Go to Settings to grant access manually.',
  openSettings: 'Open Settings',
  disclaimer: 'No data is uploaded to the cloud.\nEverything stays on your device.',

  loadingGallery: 'Loading gallery…',
  errorTitle: 'Error',
  galleryEmpty: 'Gallery Empty',
  noMediaFound: 'No photos or videos found.',
  sessionComplete: 'Done',
  calculatingResults: 'Calculating results…',
  selectStartPoint: 'Select Start Point',
  pendingBadge: (n) => `${n} photo${n !== 1 ? 's' : ''} pending deletion — View & Confirm`,

  statKeptLabel: 'Kept',
  statDeletedLabel: 'Deleted',
  statRemainingLabel: 'Left',

  deleteLabel: 'Delete',
  keepLabel: 'Keep',
  swipeHint: '← Delete · Keep →',

  keepVerb: 'KEEP',
  deleteVerb: 'DELETE',

  photoDeletedMsg: (n) => `${n} photo${n !== 1 ? 's' : ''} deleted`,
  photoRescuedMsg: (n) => `${n} photo${n !== 1 ? 's' : ''} rescued`,
  doneLabel: 'Done',
  continueBtn: 'Continue',
  backBtn: '← Back',
  photoCountLabel: (n) => `${n} Photo${n !== 1 ? 's' : ''}`,
  rescuedCountLabel: (n) => `${n} rescued`,
  tapToRescue: 'Tap a photo to rescue it',
  allRescuedHint: 'All rescued — confirm below',
  deleteKeepSummary: (del, res) => `${del} to delete · ${res} to keep`,
  keepAllBtn: 'Keep All & Continue',
  deleteBtnLabel: (n, keep) =>
    keep > 0 ? `Delete ${n}  ·  Keep ${keep}` : `Delete ${n} Photo${n !== 1 ? 's' : ''}`,
  deletingLabel: 'Deleting…',
  iosConfirmHint: 'iOS will ask for a one-time confirmation',

  sessionCompleted: 'Session Complete',
  pendingDeleteTitle: (n) => `${n} photo${n !== 1 ? 's' : ''} waiting to be deleted`,
  iosSingleConfirm: 'Delete all at once — iOS asks for a one-time permission.',
  deleteNPhotos: (n) => `Delete ${n} Photo${n !== 1 ? 's' : ''}`,
  cancelledMsg: 'Cancelled — photos were not deleted.',
  statDeleted: 'Deleted',
  statToDelete: 'To Delete',
  statKept: 'Kept',
  statTotal: 'Total',
  movedToRecent: 'Moved to\nRecently Deleted',
  cleanedPercent: (p) => `${p}%\ncleaned`,
  newSession: 'Start New Session',
  recentFilesNote:
    'Deleted items are kept in iOS\n"Recently Deleted" for 30 days.',
  summaryNone: "You didn't mark anything.",
  summaryPending: (n) => `${n} photo${n !== 1 ? 's' : ''} marked for deletion.`,
  summaryZero: 'Nothing deleted, your gallery is intact.',
  summarySmall: 'You did a little cleanup.',
  summaryMedium: 'Nice work — gallery cleaned up well.',
  summaryLarge: 'Serious cleanup done.',
  summaryMax: 'Your gallery is almost empty.',

  cancel: 'Cancel',
  startPointTitle: 'Start Point',
  tapToStart: 'Tap the photo you want to start from',
  noPhotoFound: 'No photos found',
};

export const TRANSLATIONS: Record<Language, Translations> = { tr, en };
