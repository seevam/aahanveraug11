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
    markTaken: 'ले ली',
    snooze: 'बाद में',
    skipDose: 'छोड़ें',
    undo: 'पूर्ववत करें',
    movedFor: 'बूँदों के बीच {{minutes}} मिनट का अंतर रखने के लिए {{time}} पर किया गया',
  },

  status: {
    pending: 'बाकी',
    taken: 'ले ली',
    snoozed: 'टाली गई',
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
    snoozeSettings: 'टालना',
    snoozeLength: 'कितनी देर टालें',
    snoozeLimit: 'अधिकतम कितनी बार टालें',
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
    notificationsStatus: 'रिमाइंडर',
    notificationsOn: 'चालू',
    notificationsOff: 'बंद — ठीक करने के लिए दबाएँ',
    version: 'संस्करण {{version}}',
    dataNote: 'आपका सारा डेटा इसी फ़ोन में रहता है। कहीं नहीं भेजा जाता।',
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
    taken: 'ले ली',
    snooze: '{{minutes}} मिनट बाद',
    skip: 'यह खुराक छोड़ें',
    snoozeLimitReached: 'आप इस खुराक को अधिकतम बार टाल चुके हैं।',
    scheduledFor: '{{time}} के लिए निर्धारित',
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

  medicationClass: {
    glaucoma: 'ग्लूकोमा',
    lubricant: 'सूखी आँख / चिकनाई',
    antibiotic: 'एंटीबायोटिक',
    steroid: 'स्टेरॉयड',
    nsaid: 'सूजन-रोधी',
    antiallergy: 'एलर्जी-रोधी',
    mydriatic: 'पुतली फैलाने वाली बूँद',
    antiviral: 'वायरस-रोधी',
  },
  instructions: {
    linkLabel: 'आई ड्रॉप कैसे डालें',
    title: 'आई ड्रॉप कैसे डालें',
    intro:
      'बूँद का आँख में पहुँचना — और वहीं टिकना — खुराक याद रखने जितना ही ज़रूरी है। इन चरणों में एक मिनट से भी कम लगता है।',
    disclaimer:
      'यह तरीक़े की सामान्य जानकारी है। यह आपके डॉक्टर या फ़ार्मासिस्ट की सलाह की जगह नहीं लेती। अपनी दवाओं के लिए हमेशा उनके निर्देश मानें, और यहाँ कुछ भी उनकी बात से अलग लगे तो उनसे पूछें।',
    stepsHeading: 'चरण दर चरण',
    step1: 'साबुन और पानी से हाथ धोएँ और पोंछ लें।',
    step2: 'शीशी जाँचें: सही दवा, सही आँख, और तारीख़ बीती हुई न हो।',
    step3: 'लेबल पर हिलाने को कहा गया हो तो हल्के से हिलाएँ।',
    step4:
      'ढक्कन खोलकर साफ़ जगह पर रखें। नोक को कहीं न छुआएँ — न आँख से, न पलकों से, न उँगलियों से।',
    step5: 'सिर पीछे झुकाएँ, या लेट जाएँ, और छत की ओर देखें।',
    step6: 'एक उँगली से नीचे की पलक को हल्के से नीचे खींचकर छोटी जेब बनाएँ।',
    step7: 'शीशी को आँख के ऊपर, बिना छुए पकड़ें, और एक बूँद उस जेब में डालें।',
    step8:
      'आँख धीरे से बंद करें। ज़ोर से न भींचें और तेज़ी से पलक न झपकाएँ — इससे बूँद बाहर निकल जाती है।',
    step9:
      'नाक के पास, आँख के अंदरूनी कोने पर एक-दो मिनट हल्का दबाव रखें। इससे बूँद आँख में बनी रहती है।',
    step10: 'जो बाहर बहे उसे साफ़ टिश्यू से पोंछ लें, फिर ढक्कन लगा दें।',
    gapHeading: 'अलग-अलग बूँदों के बीच अंतर रखें',
    gapBody:
      'दूसरी बूँद से पहले कम से कम {{minutes}} मिनट रुकें, वरना दूसरी बूँद पहली को धो देगी। आईड्रॉप शेड्यूलर आपके रिमाइंडर में यह अंतर पहले से रख देता है, इसलिए बस दिए गए समय का पालन करें।',
    tipsHeading: 'जानने योग्य बातें',
    tip1: 'एक बूँद पर्याप्त है। आँख एक से ज़्यादा नहीं रोक सकती, इसलिए दूसरी बेकार चली जाती है।',
    tip2:
      'बूँद साफ़ तौर पर आँख से बाहर गिर गई हो तो एक और डालें। पक्का न हो कि अंदर गई या नहीं, तो डॉक्टर या फ़ार्मासिस्ट से पूछें।',
    tip3: 'बूँदों के साथ मरहम या जेल भी लगाते हों, तो पहले बूँदें और सबसे आख़िर में मरहम।',
    tip4:
      'कॉन्टैक्ट लेंस पहनते हों तो बूँद से पहले उतार दें और दोबारा लगाने से पहले लगभग 15 मिनट रुकें — जब तक डॉक्टर कुछ और न कहें।',
    tip5: 'शीशी किसी के साथ साझा न करें, परिवार के सदस्य के साथ भी नहीं।',
    tip6:
      'शीशी को लेबल के अनुसार रखें, और डॉक्टर या फ़ार्मासिस्ट की बताई तारीख़ के बाद इस्तेमाल बंद कर दें।',
  },

  capColour: {
    heading: 'ढक्कन का रंग',
    note:
      'हर तरह की आँख की दवा के ढक्कन का रंग एक आम परंपरा के अनुसार होता है। लेबल भी ज़रूर पढ़ें — ब्रांड के हिसाब से रंग बदल सकते हैं।',
    describedAs: '{{colour}} ढक्कन',
    yellow: 'पीला',
    teal: 'फ़िरोज़ी',
    purple: 'बैंगनी',
    orange: 'नारंगी',
    darkBlue: 'गहरा नीला',
    green: 'हरा',
    red: 'लाल',
    pink: 'गुलाबी',
    tan: 'भूरा',
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
