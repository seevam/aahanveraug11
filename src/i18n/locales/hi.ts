/**
 * Hindi (हिन्दी) strings.
 *
 * Typed against the English shape, so any key added there is a compile error
 * here until it is translated — no silent English fallback on a patient's
 * screen.
 *
 * Note for review before public launch: these are careful translations, but
 * medical wording deserves a native-speaker and clinician pass, particularly
 * `validation.*` (where a misread message could lead to a wrong schedule) and
 * `status.missed`, which must stay factual rather than accusatory.
 */

import type { Translation } from '../types';

const hi: Translation = {
  common: {
    appName: 'आईड्रॉप शेड्यूलर',
    tagline: 'हर दिन एक आँख के लिए',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएँ',
    edit: 'बदलें',
    add: 'जोड़ें',
    done: 'पूरा',
    next: 'आगे',
    back: 'पीछे',
    skip: 'छोड़ें',
    close: 'बंद करें',
    retry: 'फिर कोशिश करें',
    loading: 'लोड हो रहा है…',
    optional: 'वैकल्पिक',
    today: 'आज',
    none: 'कोई नहीं',
    ok: 'ठीक है',
  },

  onboarding: {
    welcomeTitle: 'कोई भी बूँद न छूटे',
    welcomeBody:
      'आईड्रॉप शेड्यूलर हर आई ड्रॉप का हिसाब रखता है, उनके बीच सही अंतर रखता है, और समय पर याद दिलाता है।',
    getStarted: 'शुरू करें',
    profileTitle: 'ये बूँदें किसके लिए हैं?',
    profileBody: 'आप बाद में और लोग जोड़ सकते हैं — माता-पिता, जीवनसाथी, या स्वयं।',
    nameLabel: 'नाम',
    namePlaceholder: 'जैसे आहान',
    relationshipLabel: 'रिश्ता',
    relationshipPlaceholder: 'जैसे माता, स्वयं',
    medicationTitle: 'पहली दवा जोड़ें',
    medicationBody: 'आप इसे छोड़ सकते हैं और बाद में दवाएँ जोड़ सकते हैं।',
    notificationsTitle: 'रिमाइंडर चालू करें',
    notificationsBody:
      'खुराक का समय होने पर सूचित करने के लिए आईड्रॉप शेड्यूलर को अनुमति चाहिए। इसके बिना रिमाइंडर आप तक नहीं पहुँच पाएँगे।',
    notificationsEnable: 'रिमाइंडर चालू करें',
    notificationsLater: 'अभी नहीं',
    notificationsDenied:
      'रिमाइंडर बंद हैं। आप इन्हें कभी भी फ़ोन की सेटिंग्स में चालू कर सकते हैं।',
  },

  tabs: {
    today: 'आज',
    reminders: 'रिमाइंडर',
    reports: 'रिपोर्ट',
    profile: 'प्रोफ़ाइल',
  },

  today: {
    alarmSetupTitle: 'अलार्म पूरी तरह सेट नहीं हैं',
    alarmSetupBody: 'आपका फ़ोन खुराक के अलार्म को देर से या बिना आवाज़ के बजा सकता है। ठीक करने में एक मिनट लगेगा।',
    alarmSetupAction: 'अलार्म सेट करें',
    title: 'आज',
    nextDose: 'अगली खुराक',
    noDosesTitle: 'आज कुछ निर्धारित नहीं है',
    noDosesBody: 'रिमाइंडर जोड़ें और वह यहाँ दिखाई देगा।',
    allDoneTitle: 'आज के लिए सब पूरा',
    allDoneBody: 'हर खुराक दर्ज हो चुकी है। कल मिलते हैं।',
    remaining_one: 'आज {{count}} खुराक बाकी',
    remaining_other: 'आज {{count}} खुराकें बाकी',
    upcoming: 'आने वाली',
    earlier: 'आज पहले',
    markTaken: 'ले लिया',
    snooze: 'स्नूज़',
    skipDose: 'छोड़ें',
    undo: 'पूर्ववत करें',
    movedFor: 'बूँदों के बीच {{minutes}} मिनट का अंतर रखने के लिए इसे {{time}} पर कर दिया गया',
  },

  status: {
    pending: 'बाकी',
    taken: 'ले लिया',
    snoozed: 'स्नूज़ की गई',
    skipped: 'छोड़ी गई',
    missed: 'छूट गई',
  },

  eye: {
    left: 'बाईं आँख',
    right: 'दाईं आँख',
    both: 'दोनों आँखें',
  },

  reminders: {
    title: 'रिमाइंडर',
    emptyTitle: 'अभी कोई रिमाइंडर नहीं',
    emptyBody: 'आपको जो बूँदें बताई गई हैं उन्हें जोड़ें, हम उनका समय तय कर देंगे।',
    addReminder: 'रिमाइंडर जोड़ें',
    editReminder: 'रिमाइंडर बदलें',
    active: 'चालू',
    paused: 'रुका हुआ',
    pause: 'रोकें',
    resume: 'फिर चालू करें',
    deleteTitle: 'यह रिमाइंडर हटाएँ?',
    deleteBody:
      'आगे की खुराकें हट जाएँगी। जो खुराकें पहले दर्ज हो चुकी हैं वे रिपोर्ट में बनी रहेंगी।',
    perDay_one: 'दिन में {{count}} बार',
    perDay_other: 'दिन में {{count}} बार',
    everyDay: 'हर दिन',
    selectedDays: '{{days}}',
  },

  form: {
    medication: 'दवा',
    medicationPlaceholder: 'नाम या ब्रांड लिखें',
    medicationHint: 'जैसा बोतल पर लिखा है, नाम वैसा ही लिखें।',
    medicationFreeText: '“{{name}}” का उपयोग करें',
    dosage: 'मात्रा',
    dosagePlaceholder: 'जैसे 1 बूँद',
    whichEye: 'कौन सी आँख',
    schedule: 'समय-सारणी',
    modeInterval: 'हर कुछ घंटों में',
    modeCount: 'तय संख्या में बार',
    modeTimes: 'निश्चित समय पर',
    modeIntervalHint: 'जैसे 08:00 से 20:00 के बीच हर 2 घंटे',
    modeCountHint: 'जैसे 09:00 से, 10 मिनट के अंतर पर 5 बार',
    modeTimesHint: 'जैसे 08:00 और 20:00',
    startTime: 'पहली खुराक',
    endTime: 'आख़िरी खुराक तक',
    every: 'हर',
    minutes: 'मिनट',
    hours: 'घंटे',
    numberOfDoses: 'खुराकों की संख्या',
    gapBetween: 'खुराकों के बीच अंतर',
    times: 'समय',
    addTime: 'समय जोड़ें',
    days: 'दिन',
    startDate: 'शुरू',
    endDate: 'समाप्त',
    endDateNever: 'कोई अंतिम तिथि नहीं',
    snoozeSettings: 'स्नूज़',
    snoozeLength: 'कितनी देर के लिए स्नूज़ करें',
    snoozeLimit: 'अधिकतम कितनी बार स्नूज़ करें',
    alerts: 'सूचनाएँ',
    sound: 'आवाज़',
    vibration: 'कंपन',
    preview: 'झलक',
    previewTitle: 'आपका दिन ऐसा दिखेगा',
    previewShifted: 'दूसरी बूँद से टकराव बचाने के लिए {{from}} से बदला गया',
    previewOther: '{{name}} — पहले से निर्धारित',
    previewNone: 'झलक देखने के लिए समय-सारणी भरें।',
    saveReminder: 'रिमाइंडर सहेजें',
  },

  validation: {
    nameRequired: 'कृपया नाम भरें।',
    medicationRequired: 'कृपया दवा का नाम भरें।',
    'interval-too-small': 'खुराकों के बीच कम से कम 1 मिनट का अंतर होना चाहिए।',
    'interval-window-invalid': 'आख़िरी खुराक पहली खुराक के बाद होनी चाहिए।',
    'count-too-small': 'कम से कम एक खुराक दर्ज करें।',
    'count-gap-too-small': 'खुराकों के बीच कम से कम 1 मिनट का अंतर होना चाहिए।',
    'count-overflows-day':
      'इतनी खुराकें आधी रात से पहले नहीं आ पाएँगी — आख़िरी {{time}} पर पड़ेगी। कम खुराकें, कम अंतर, या पहले का समय चुनें।',
    'times-empty': 'कम से कम एक समय जोड़ें।',
    'times-out-of-range': 'कृपया 00:00 और 23:59 के बीच का समय भरें।',
    'no-days-selected': 'कम से कम एक दिन चुनें।',
    'date-range-invalid': 'अंतिम तिथि शुरुआती तिथि के बाद होनी चाहिए।',
    infeasibleTitle: 'यह समय-सारणी ठीक नहीं बैठ रही',
    infeasibleShift:
      '{{time}} पर {{name}} को आपकी दूसरी बूँदों से {{gap}} मिनट दूर रखना बिना बहुत आगे खिसकाए संभव नहीं है। इन बूँदों को और दूर-दूर रखें।',
    infeasibleMidnight:
      'बूँदों के बीच अंतर लगाने पर {{time}} पर {{name}} आधी रात के बाद चली जाएगी। कोई पहले का समय चुनें।',
  },

  reports: {
    title: 'रिपोर्ट',
    range7: '7 दिन',
    range30: '30 दिन',
    range90: '90 दिन',
    adherence: 'ली गई खुराकें',
    ofEvaluated: '{{total}} में से {{taken}} खुराकें',
    noDataTitle: 'अभी कोई इतिहास नहीं',
    noDataBody: 'जैसे ही आप खुराकें दर्ज करना शुरू करेंगे, रिपोर्ट यहाँ दिखेगी।',
    taken: 'ली गई',
    missed: 'छूटी',
    skipped: 'छोड़ी',
    currentStreak: 'मौजूदा सिलसिला',
    bestStreak: 'सबसे लंबा सिलसिला',
    days_one: '{{count}} दिन',
    days_other: '{{count}} दिन',
    byMedication: 'दवा के अनुसार',
    share: 'रिपोर्ट साझा करें',
    onTrack: 'सही राह पर',
    needsAttention: 'सुधार की गुंजाइश',
    outstandingNote: '{{count}} आने वाली खुराकें अभी गिनी नहीं गई हैं।',
  },

  profile: {
    title: 'प्रोफ़ाइल',
    people: 'लोग',
    addPerson: 'व्यक्ति जोड़ें',
    editPerson: 'व्यक्ति बदलें',
    deletePersonTitle: '{{name}} को हटाएँ?',
    deletePersonBody:
      'इससे उनके रिमाइंडर और पूरा खुराक इतिहास हट जाएगा। इसे वापस नहीं लाया जा सकता।',
    deleteLastPersonBody: 'यह आपकी इकलौती प्रोफ़ाइल है। इसे हटाने से ऐप का सारा डेटा मिट जाएगा।',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    security: 'ऐप लॉक',
    backup: 'बैकअप',
    about: 'ऐप के बारे में',
    exactAlarms: 'सटीक अलार्म समय',
    exactAlarmsBody: 'बैटरी बचाने के लिए Android रिमाइंडर देर से दिखा सकता है। खुराक ठीक समय पर बजे, इसके लिए सिस्टम सेटिंग्स में इस ऐप को “Alarms & reminders” की अनुमति दें।',
    openSystemSettings: 'सिस्टम सेटिंग्स खोलें',
    alarmSetup: 'अलार्म सेटअप',
    ringWith: 'रिमाइंडर किससे बजें',
    ringWithClock: 'क्लॉक ऐप',
    ringWithApp: 'यह ऐप',
    ringWithClockBody: 'रिमाइंडर आपके फ़ोन के क्लॉक ऐप में असली अलार्म बनते हैं और बिल्कुल सुबह के अलार्म की तरह बजते हैं।',
    ringWithAppBody: 'यह ऐप अपना अलार्म बजाता है, और आप उसका जवाब “ले लिया”, “स्नूज़” या “छोड़ें” से दे सकते हैं।',
    alarmSound: 'आवाज़ और लॉक स्क्रीन',
    alarmSoundBody: 'कुछ फ़ोन — Realme, Oppo, OnePlus, Vivo — नए ऐप के लिए आवाज़, लॉक स्क्रीन और पॉप-अप बैनर बंद कर देते हैं। “Dose alarms” के लिए ये सभी चालू करें।',
    battery: 'बैटरी',
    batteryBody: 'इस ऐप का बैटरी उपयोग “Unrestricted” या “Don’t optimise” पर रखें, ताकि फ़ोन बैटरी बचाने के लिए अलार्म न रोके।',
    autoLaunch: 'ऑटो लॉन्च और बैकग्राउंड',
    autoLaunchBody: 'आपके फ़ोन का अपना ऐप मैनेजर अलार्म रोक सकता है। इस ऐप के लिए ऑटो लॉन्च और बैकग्राउंड गतिविधि की अनुमति दें।',
    fullScreenAlarms: 'फ़ुल-स्क्रीन अलार्म',
    fullScreenAlarmsBody: 'Android 14 और नए फ़ोन पर इस ऐप को “Full-screen notifications” की अनुमति दें। इसके बिना अलार्म लॉक स्क्रीन पर पूरी स्क्रीन में आने के बजाय सिर्फ़ बैनर की तरह दिखेगा।',
    allowed: 'अनुमति है',
    notAllowed: 'अनुमति नहीं',
    notificationsStatus: 'रिमाइंडर',
    notificationsOn: 'चालू',
    notificationsOff: 'बंद — ठीक करने के लिए दबाएँ',
    version: 'संस्करण {{version}}',
    dataNote: 'आपका सारा डेटा इसी फ़ोन में रहता है। सिर्फ़ समझाने वाले वीडियो इंटरनेट इस्तेमाल करते हैं।',
  },

  security: {
    title: 'ऐप लॉक',
    description: 'आईड्रॉप शेड्यूलर खोलने से पहले PIN माँगें। आपका दवा इतिहास स्वास्थ्य जानकारी है।',
    enable: 'ऐप लॉक चालू करें',
    disable: 'ऐप लॉक बंद करें',
    setPin: '4 अंकों का PIN चुनें',
    confirmPin: 'दोबारा भरें',
    pinMismatch: 'दोनों PIN मेल नहीं खाए। फिर कोशिश करें।',
    unlockTitle: 'अपना PIN भरें',
    wrongPin: 'ग़लत PIN।',
    useBiometric: 'बायोमेट्रिक का उपयोग करें',
    biometricPrompt: 'आईड्रॉप शेड्यूलर अनलॉक करें',
    biometricUnavailable: 'इस फ़ोन में बायोमेट्रिक सेट नहीं है।',
  },

  backup: {
    title: 'बैकअप',
    description:
      'आपका डेटा केवल इसी फ़ोन में है। बैकअप फ़ाइल सहेजें ताकि फ़ोन बदलने या खोने पर उसे वापस पा सकें।',
    exportAction: 'बैकअप सहेजें',
    exportSuccess: 'बैकअप सहेजा गया।',
    exportFailed: 'बैकअप सहेजा नहीं जा सका।',
    importAction: 'बैकअप से वापस लाएँ',
    importWarningTitle: 'यह बैकअप वापस लाएँ?',
    importWarningBody:
      'यह ऐप में मौजूद सब कुछ बदल देगा — सभी लोग, रिमाइंडर और खुराक इतिहास।',
    importSuccess: '{{patients}} लोग और {{reminders}} रिमाइंडर वापस लाए गए।',
    importFailed: 'यह फ़ाइल आईड्रॉप शेड्यूलर बैकअप के रूप में पढ़ी नहीं जा सकी।',
    importVersionMismatch: 'यह बैकअप ऐप के नए संस्करण से बना है।',
    lastBackup: 'पिछला बैकअप: {{date}}',
    neverBackedUp: 'आपने अभी तक बैकअप नहीं बनाया है।',
  },

  alarm: {
    forPerson: '{{name}} के लिए',
    timeFor: 'समय हो गया',
    taken: 'ले लिया',
    snooze: '{{minutes}} मिनट के लिए स्नूज़',
    skip: 'यह खुराक छोड़ें',
    snoozeLimitReached: 'आप इस खुराक को अधिकतम बार स्नूज़ कर चुके हैं।',
    scheduledFor: '{{time}} के लिए निर्धारित',
  },

  clock: {
    title: 'क्लॉक ऐप अलार्म',
    upToDate: 'क्लॉक ऐप अप-टू-डेट है',
    needsUpdate: 'क्लॉक ऐप को अपडेट करना है',
    inSyncBody: 'आपके रिमाइंडर फ़ोन के क्लॉक ऐप में अलार्म हैं। खुराक लेने के बाद इस ऐप की सूचना में “ले लिया” दबाएँ, ताकि वह आपकी रिपोर्ट में दिखे।',
    toAdd_one: '{{count}} अलार्म अभी क्लॉक ऐप में जोड़ना बाकी है।',
    toAdd_other: '{{count}} अलार्म अभी क्लॉक ऐप में जोड़ने बाकी हैं।',
    addAction: 'क्लॉक ऐप में जोड़ें',
    addFailed: 'क्लॉक ऐप में अलार्म नहीं जुड़ पाए। कृपया फिर से कोशिश करें।',
    staleIntro: 'आपका शेड्यूल बदल गया है। Android ऐप को क्लॉक अलार्म मिटाने नहीं देता, इसलिए कृपया क्लॉक ऐप में ये अलार्म मिटाएँ:',
    openClock: 'क्लॉक ऐप खोलें',
    deletedAction: 'मैंने इन्हें मिटा दिया',
  },

  volume: {
    title: 'अलार्म की आवाज़',
    body: 'अलार्म इसी आवाज़ पर बजते हैं, वाइब्रेट या साइलेंट मोड में भी। फ़ोन की रिंग और मीडिया की आवाज़ से यह नहीं बदलती।',
    silentWarning: 'अलार्म की आवाज़ बंद है। आपको खुराक के अलार्म सुनाई नहीं देंगे।',
    quieter: 'आवाज़ कम करें',
    louder: 'आवाज़ बढ़ाएँ',
    level: 'आवाज़ {{max}} में से {{current}}',
    test: 'टेस्ट आवाज़ सुनें',
    stopTest: 'टेस्ट आवाज़ रोकें',
  },

  // Short on purpose, and with no-break spaces: Android squeezes three action
  // buttons into one row, and a label with an ordinary space can wrap, leaving
  // only its first word visible ("ले" instead of "ले लिया").
  notify: {
    taken: 'ले लिया',
    snooze: 'स्नूज़',
    skip: 'छोड़ें',
  },

  days: {
    sun: 'रवि',
    mon: 'सोम',
    tue: 'मंगल',
    wed: 'बुध',
    thu: 'गुरु',
    fri: 'शुक्र',
    sat: 'शनि',
  },

  instructions: {
    linkLabel: 'आई ड्रॉप कैसे डालें',
    title: 'आई ड्रॉप कैसे डालें',
    otherLanguages: 'दूसरी भाषा में देखें',
    watchIn: '{{language}} में देखें',
    openInBrowser: 'वीडियो ब्राउज़र में खोलें',
    needsInternet: 'यह वीडियो इंटरनेट से चलता है। अपना कनेक्शन जाँचकर फिर कोशिश करें।',
  },

  impact: {
    heading: 'चश्मे के फ़्रेम के लिए जुटाई राशि',
    raisedLabel: 'अब तक जुटाया',
    framesLabel: 'फ़्रेम दिए गए',
    perFrameNote: '{{amount}} से ज़रूरतमंद एक बच्चे के लिए एक फ़्रेम बनता है।',
    asOf: '{{date}} तक',
  },
};

export default hi;
