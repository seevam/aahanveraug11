/**
 * Hindi (हिन्दी) strings.
 *
 * Typed against the English shape, so any key added there is a compile error
 * here until it is translated — no silent English fallback on a patient's
 * screen.
 *
 * Style, after testing on a phone:
 *  - Everyday Hindi, as Indian phone apps use it — "सेव करें", "शेड्यूल",
 *    "वाइब्रेशन" — not formal Hindi ("सहेजें", "समय-सारणी", "कंपन") that
 *    reads like a government form.
 *  - Button labels short, ideally one or two words.
 *  - The words on buttons are the words the help text tells people to tap.
 *
 * Still to do before public launch: a read-through by a native speaker, and a
 * clinician's eye on `validation.*`, where a misread message could lead to a
 * wrong schedule.
 */

import type { Translation } from '../types';

const hi: Translation = {
  common: {
    appName: 'आईड्रॉप शेड्यूलर',
    tagline: 'हर दिन, एक आँख की मदद',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    delete: 'हटाएँ',
    edit: 'बदलें',
    add: 'जोड़ें',
    done: 'हो गया',
    next: 'आगे',
    back: 'वापस',
    skip: 'छोड़ें',
    close: 'बंद करें',
    retry: 'फिर से कोशिश करें',
    loading: 'लोड हो रहा है…',
    optional: 'ज़रूरी नहीं',
    today: 'आज',
    none: 'कोई नहीं',
    ok: 'ठीक है',
  },

  onboarding: {
    welcomeTitle: 'कोई भी ड्रॉप न छूटे',
    welcomeBody:
      'आईड्रॉप शेड्यूलर हर आई ड्रॉप का हिसाब रखता है, दवाओं के बीच सही अंतर रखता है और समय होने पर आपको याद दिलाता है।',
    getStarted: 'शुरू करें',
    profileTitle: 'ये आई ड्रॉप किसके लिए हैं?',
    profileBody: 'बाद में और लोग भी जोड़ सकते हैं — माता-पिता, पति/पत्नी या आप ख़ुद।',
    nameLabel: 'नाम',
    namePlaceholder: 'जैसे आहान',
    relationshipLabel: 'रिश्ता',
    relationshipPlaceholder: 'जैसे माँ, ख़ुद',
    medicationTitle: 'पहली दवा जोड़ें',
    medicationBody: 'चाहें तो अभी छोड़ दें, दवाएँ बाद में भी जोड़ सकते हैं।',
    notificationsTitle: 'रिमाइंडर चालू करें',
    notificationsBody:
      'दवा का समय होने पर आपको बताने के लिए ऐप को अनुमति चाहिए। इसके बिना रिमाइंडर आप तक नहीं पहुँचेंगे।',
    notificationsEnable: 'रिमाइंडर चालू करें',
    notificationsLater: 'अभी नहीं',
    notificationsDenied:
      'रिमाइंडर बंद हैं। फ़ोन की सेटिंग में जाकर इन्हें कभी भी चालू कर सकते हैं।',
  },

  tabs: {
    today: 'आज',
    reminders: 'रिमाइंडर',
    reports: 'रिपोर्ट',
    profile: 'प्रोफ़ाइल',
  },

  today: {
    alarmSetupTitle: 'अलार्म पूरी तरह सेट नहीं हैं',
    alarmSetupBody: 'आपका फ़ोन अलार्म देर से या बिना आवाज़ के बजा सकता है। ठीक करने में बस एक मिनट लगेगा।',
    alarmSetupAction: 'अलार्म सेट करें',
    title: 'आज',
    nextDose: 'अगली दवा',
    noDosesTitle: 'आज कोई दवा नहीं है',
    noDosesBody: 'रिमाइंडर जोड़ें, वह यहाँ दिखेगा।',
    allDoneTitle: 'आज की सारी दवा हो गई',
    allDoneBody: 'आज की हर खुराक दर्ज हो गई है। कल मिलते हैं।',
    remaining_one: 'आज {{count}} खुराक बाकी है',
    remaining_other: 'आज {{count}} खुराकें बाकी हैं',
    upcoming: 'आगे की दवाएँ',
    earlier: 'आज पहले की',
    markTaken: 'ले लिया',
    snooze: 'स्नूज़',
    skipDose: 'छोड़ें',
    undo: 'वापस लें',
    movedFor: 'दो दवाओं के बीच {{minutes}} मिनट का अंतर रखने के लिए समय {{time}} कर दिया गया',
  },

  status: {
    pending: 'बाकी',
    taken: 'ले लिया',
    snoozed: 'स्नूज़ किया',
    skipped: 'छोड़ दिया',
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
    emptyBody: 'डॉक्टर ने जो आई ड्रॉप बताए हैं, उन्हें जोड़ें — हम उनका समय तय कर देंगे।',
    addReminder: 'रिमाइंडर जोड़ें',
    editReminder: 'रिमाइंडर बदलें',
    active: 'चालू',
    paused: 'बंद',
    pause: 'रोकें',
    resume: 'फिर से चालू करें',
    deleteTitle: 'यह रिमाइंडर हटाएँ?',
    deleteBody:
      'आगे की खुराकें हट जाएँगी। जो खुराकें आप दर्ज कर चुके हैं, वे रिपोर्ट में रहेंगी।',
    perDay_one: 'दिन में {{count}} बार',
    perDay_other: 'दिन में {{count}} बार',
    everyDay: 'हर दिन',
    selectedDays: '{{days}}',
  },

  form: {
    medication: 'दवा का नाम',
    medicationPlaceholder: 'नाम या ब्रांड लिखें',
    medicationHint: 'बोतल पर जैसा लिखा है, वैसा ही नाम लिखें।',
    medicationFreeText: '“{{name}}” इस्तेमाल करें',
    dosage: 'मात्रा',
    dosagePlaceholder: 'जैसे 1 ड्रॉप',
    whichEye: 'किस आँख में',
    schedule: 'शेड्यूल',
    modeInterval: 'हर कुछ घंटे में',
    modeCount: 'कुछ बार, तय अंतर पर',
    modeTimes: 'तय समय पर',
    modeIntervalHint: 'जैसे 08:00 से 20:00 तक हर 2 घंटे में',
    modeCountHint: 'जैसे 09:00 से शुरू, 10-10 मिनट पर 5 बार',
    modeTimesHint: 'जैसे 08:00 और 20:00',
    startTime: 'पहली खुराक',
    endTime: 'आख़िरी खुराक कब तक',
    every: 'हर',
    minutes: 'मिनट',
    hours: 'घंटे',
    numberOfDoses: 'कितनी बार',
    gapBetween: 'दो खुराकों के बीच का अंतर',
    times: 'समय',
    addTime: 'समय जोड़ें',
    days: 'दिन',
    startDate: 'कब से',
    endDate: 'कब तक',
    endDateNever: 'कोई आख़िरी तारीख़ नहीं',
    snoozeSettings: 'स्नूज़',
    snoozeLength: 'कितनी देर के लिए स्नूज़',
    snoozeLimit: 'ज़्यादा से ज़्यादा कितनी बार स्नूज़',
    alerts: 'अलर्ट',
    sound: 'आवाज़',
    vibration: 'वाइब्रेशन',
    preview: 'प्रीव्यू',
    previewTitle: 'आपका दिन ऐसा दिखेगा',
    previewShifted: 'दूसरी दवा से टकराव न हो, इसलिए {{from}} से बदला गया',
    previewOther: '{{name}} — पहले से तय',
    previewNone: 'प्रीव्यू देखने के लिए ऊपर शेड्यूल भरें।',
    saveReminder: 'रिमाइंडर सेव करें',
  },

  validation: {
    nameRequired: 'कृपया नाम लिखें।',
    medicationRequired: 'कृपया दवा का नाम लिखें।',
    'interval-too-small': 'दो खुराकों के बीच कम से कम 1 मिनट का अंतर रखें।',
    'interval-window-invalid': 'आख़िरी खुराक का समय पहली खुराक के बाद होना चाहिए।',
    'count-too-small': 'कम से कम एक खुराक रखें।',
    'count-gap-too-small': 'दो खुराकों के बीच कम से कम 1 मिनट का अंतर रखें।',
    'count-overflows-day':
      'इतनी खुराकें आधी रात से पहले पूरी नहीं होंगी — आख़िरी खुराक {{time}} पर आएगी। खुराकें कम करें, अंतर घटाएँ या जल्दी शुरू करें।',
    'times-empty': 'कम से कम एक समय जोड़ें।',
    'times-out-of-range': 'कृपया 00:00 से 23:59 के बीच का समय डालें।',
    'no-days-selected': 'कम से कम एक दिन चुनें।',
    'date-range-invalid': 'आख़िरी तारीख़ शुरू की तारीख़ के बाद होनी चाहिए।',
    infeasibleTitle: 'यह शेड्यूल नहीं बन पा रहा',
    infeasibleShift:
      '{{time}} वाली {{name}} को बाकी दवाओं से {{gap}} मिनट दूर रखने के लिए उसे बहुत ज़्यादा खिसकाना पड़ेगा। इन दवाओं के समय में थोड़ा और अंतर रखें।',
    infeasibleMidnight:
      'दवाओं के बीच अंतर रखने पर {{time}} वाली {{name}} आधी रात के बाद चली जाएगी। कोई पहले का समय चुनें।',
  },

  reports: {
    title: 'रिपोर्ट',
    range7: '7 दिन',
    range30: '30 दिन',
    range90: '90 दिन',
    adherence: 'ली गई खुराकें',
    ofEvaluated: '{{total}} में से {{taken}} खुराकें',
    noDataTitle: 'अभी कोई रिकॉर्ड नहीं',
    noDataBody: 'खुराकें दर्ज करना शुरू करते ही रिपोर्ट यहाँ दिखेगी।',
    taken: 'ली गई',
    missed: 'छूट गई',
    skipped: 'छोड़ दी',
    currentStreak: 'अभी लगातार',
    bestStreak: 'सबसे ज़्यादा लगातार',
    days_one: '{{count}} दिन',
    days_other: '{{count}} दिन',
    byMedication: 'दवा के हिसाब से',
    share: 'रिपोर्ट भेजें',
    onTrack: 'सही चल रहा है',
    needsAttention: 'थोड़ा सुधार चाहिए',
    outstandingNote: '{{count}} आने वाली खुराकें अभी गिनी नहीं गई हैं।',
  },

  profile: {
    title: 'प्रोफ़ाइल',
    people: 'लोग',
    addPerson: 'नया व्यक्ति जोड़ें',
    editPerson: 'जानकारी बदलें',
    deletePersonTitle: '{{name}} को हटाएँ?',
    deletePersonBody:
      'इससे उनके सारे रिमाइंडर और खुराकों का पूरा रिकॉर्ड हट जाएगा। यह वापस नहीं होगा।',
    deleteLastPersonBody: 'यह आपकी अकेली प्रोफ़ाइल है। इसे हटाने से ऐप का सारा डेटा मिट जाएगा।',
    settings: 'सेटिंग',
    language: 'भाषा',
    security: 'ऐप लॉक',
    backup: 'बैकअप',
    about: 'ऐप के बारे में',
    exactAlarms: 'अलार्म ठीक समय पर',
    exactAlarmsBody: 'बैटरी बचाने के लिए Android रिमाइंडर में देर कर सकता है। फ़ोन की सेटिंग में इस ऐप को “Alarms & reminders” की अनुमति दें, ताकि अलार्म ठीक समय पर बजे।',
    openSystemSettings: 'फ़ोन की सेटिंग खोलें',
    alarmSetup: 'अलार्म सेटअप',
    ringWith: 'रिमाइंडर कहाँ से बजे',
    ringWithClock: 'क्लॉक ऐप',
    ringWithApp: 'यही ऐप',
    ringWithClockBody: 'रिमाइंडर आपके फ़ोन के क्लॉक ऐप में असली अलार्म बन जाते हैं और सुबह के अलार्म की तरह ही बजते हैं।',
    ringWithAppBody: 'यह ऐप ख़ुद अलार्म बजाता है। आप “ले लिया”, “स्नूज़” या “छोड़ें” दबाकर जवाब दे सकते हैं।',
    alarmSound: 'आवाज़ और लॉक स्क्रीन',
    alarmSoundBody: 'कुछ फ़ोन (Realme, Oppo, OnePlus, Vivo) नए ऐप की आवाज़, लॉक स्क्रीन और पॉप-अप बंद रखते हैं। “Dose alarms” के लिए ये सब चालू करें।',
    battery: 'बैटरी',
    batteryBody: 'इस ऐप की बैटरी सेटिंग “Unrestricted” या “Don’t optimise” पर रखें, ताकि बैटरी बचाने के लिए फ़ोन अलार्म न रोके।',
    autoLaunch: 'ऑटो-लॉन्च और बैकग्राउंड',
    autoLaunchBody: 'आपके फ़ोन का अपना ऐप मैनेजर अलार्म रोक सकता है। इस ऐप को ऑटो-लॉन्च और बैकग्राउंड में चलने की अनुमति दें।',
    fullScreenAlarms: 'फ़ुल-स्क्रीन अलार्म',
    fullScreenAlarmsBody: 'Android 14 या नए फ़ोन में इस ऐप को “Full-screen notifications” की अनुमति दें। इसके बिना अलार्म पूरी स्क्रीन पर नहीं, बस ऊपर एक पट्टी में दिखेगा।',
    allowed: 'अनुमति है',
    notAllowed: 'अनुमति नहीं है',
    notificationsStatus: 'रिमाइंडर',
    notificationsOn: 'चालू',
    notificationsOff: 'बंद — ठीक करने के लिए दबाएँ',
    version: 'वर्ज़न {{version}}',
    dataNote: 'आपका सारा डेटा इसी फ़ोन में रहता है। सिर्फ़ जानकारी वाले वीडियो के लिए इंटरनेट चाहिए।',
    privacyPolicy: 'प्राइवेसी पॉलिसी',
  },

  security: {
    title: 'ऐप लॉक',
    description: 'ऐप खोलने से पहले PIN माँगें। आपकी दवाओं का रिकॉर्ड निजी स्वास्थ्य जानकारी है।',
    enable: 'ऐप लॉक चालू करें',
    disable: 'ऐप लॉक बंद करें',
    setPin: '4 अंकों का PIN बनाएँ',
    confirmPin: 'PIN दोबारा डालें',
    pinMismatch: 'दोनों PIN एक जैसे नहीं हैं। फिर से कोशिश करें।',
    unlockTitle: 'अपना PIN डालें',
    wrongPin: 'ग़लत PIN',
    useBiometric: 'फ़िंगरप्रिंट या फ़ेस अनलॉक',
    biometricPrompt: 'आईड्रॉप शेड्यूलर खोलें',
    biometricUnavailable: 'इस फ़ोन में फ़िंगरप्रिंट या फ़ेस अनलॉक सेट नहीं है।',
  },

  backup: {
    title: 'बैकअप',
    description:
      'आपका डेटा सिर्फ़ इसी फ़ोन में है। बैकअप फ़ाइल सेव कर लें, ताकि फ़ोन बदलने या खो जाने पर डेटा वापस मिल सके।',
    exportAction: 'बैकअप सेव करें',
    exportSuccess: 'बैकअप सेव हो गया।',
    exportFailed: 'बैकअप सेव नहीं हो पाया।',
    importAction: 'बैकअप से डेटा वापस लाएँ',
    importWarningTitle: 'यह बैकअप लगाएँ?',
    importWarningBody:
      'ऐप में अभी जो कुछ है — सभी लोग, रिमाइंडर और खुराकों का रिकॉर्ड — वह सब बैकअप से बदल जाएगा।',
    importSuccess: '{{patients}} लोग और {{reminders}} रिमाइंडर वापस आ गए।',
    importFailed: 'यह फ़ाइल आईड्रॉप शेड्यूलर का बैकअप नहीं है, या पढ़ी नहीं जा सकी।',
    importVersionMismatch: 'यह बैकअप ऐप के नए वर्ज़न से बना है।',
    lastBackup: 'पिछला बैकअप: {{date}}',
    neverBackedUp: 'अभी तक कोई बैकअप नहीं बना है।',
  },

  alarm: {
    forPerson: '{{name}} के लिए',
    timeFor: 'दवा का समय',
    taken: 'ले लिया',
    snooze: '{{minutes}} मिनट स्नूज़ करें',
    skip: 'यह खुराक छोड़ें',
    snoozeLimitReached: 'इस खुराक को जितनी बार स्नूज़ कर सकते थे, कर चुके हैं।',
    scheduledFor: '{{time}} का समय',
  },

  clock: {
    title: 'क्लॉक ऐप के अलार्म',
    upToDate: 'क्लॉक ऐप में सब अपडेट है',
    needsUpdate: 'क्लॉक ऐप में बदलाव करना है',
    inSyncBody: 'आपके रिमाइंडर फ़ोन के क्लॉक ऐप में अलार्म बने हैं। दवा डालने के बाद इस ऐप की सूचना में “ले लिया” दबाएँ, ताकि वह रिपोर्ट में दर्ज हो।',
    toAdd_one: '{{count}} अलार्म अभी क्लॉक ऐप में जोड़ना बाकी है।',
    toAdd_other: '{{count}} अलार्म अभी क्लॉक ऐप में जोड़ने बाकी हैं।',
    addAction: 'क्लॉक ऐप में जोड़ें',
    addFailed: 'क्लॉक ऐप में अलार्म नहीं जुड़ पाए। फिर से कोशिश करें।',
    staleIntro: 'आपका शेड्यूल बदल गया है। Android किसी ऐप को क्लॉक के अलार्म हटाने नहीं देता, इसलिए क्लॉक ऐप में जाकर ये अलार्म ख़ुद हटाएँ:',
    openClock: 'क्लॉक ऐप खोलें',
    deletedAction: 'मैंने इन्हें हटा दिया',
  },

  volume: {
    title: 'अलार्म की आवाज़',
    body: 'अलार्म इसी आवाज़ में बजते हैं, फ़ोन वाइब्रेट या साइलेंट पर हो तब भी। रिंगटोन या गाने की आवाज़ से यह नहीं बदलती।',
    silentWarning: 'अलार्म की आवाज़ बंद है। आपको दवा के अलार्म सुनाई नहीं देंगे।',
    quieter: 'आवाज़ कम करें',
    louder: 'आवाज़ बढ़ाएँ',
    level: 'आवाज़: {{max}} में से {{current}}',
    test: 'टेस्ट आवाज़ चलाएँ',
    stopTest: 'टेस्ट आवाज़ बंद करें',
  },

  // Short on purpose, and with a no-break space: Android squeezes three action
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

  // The one-letter forms Hindi calendars use, for the day buttons.
  daysShort: {
    sun: 'र',
    mon: 'सो',
    tue: 'मं',
    wed: 'बु',
    thu: 'गु',
    fri: 'शु',
    sat: 'श',
  },

  instructions: {
    linkLabel: 'आई ड्रॉप कैसे डालें',
    title: 'आई ड्रॉप कैसे डालें',
    otherLanguages: 'दूसरी भाषा में देखें',
    watchIn: '{{language}} में देखें',
    openInBrowser: 'वीडियो ब्राउज़र में खोलें',
    needsInternet: 'यह वीडियो इंटरनेट से चलता है। इंटरनेट चालू करके फिर से कोशिश करें।',
  },

  impact: {
    heading: 'बच्चों के चश्मे के फ़्रेम',
    raisedLabel: 'अब तक जुटाए',
    framesLabel: 'फ़्रेम दिए गए',
    perFrameNote: '{{amount}} में एक ज़रूरतमंद बच्चे के चश्मे का फ़्रेम आता है।',
    asOf: '{{date}} तक',
  },
};

export default hi;
