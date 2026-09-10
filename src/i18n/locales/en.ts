/**
 * English strings — the source of truth for the translation shape.
 * `hi.ts` and `ta.ts` are typed against this object, so a missing key is a
 * compile error rather than a blank label on a patient's screen.
 *
 * Tone rules, from the product principles:
 *  - Never shame a missed dose. "Missed" is a fact, not a verdict, and the
 *    surrounding copy always offers the next action.
 *  - Prefer plain words over clinical ones: "gap between drops", not
 *    "inter-instillation interval".
 */

const en = {
  common: {
    appName: 'Ahaan Eye',
    tagline: 'Impact an eye every day',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    done: 'Done',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    close: 'Close',
    retry: 'Try again',
    loading: 'Loading…',
    optional: 'Optional',
    today: 'Today',
    none: 'None',
    ok: 'OK',
  },

  onboarding: {
    welcomeTitle: 'Never miss a drop',
    welcomeBody:
      'Ahaan Eye keeps track of every eye drop, spaces them correctly, and reminds you when it is time.',
    getStarted: 'Get started',
    profileTitle: 'Who are these drops for?',
    profileBody: 'You can add more people later — a parent, a partner, or yourself.',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Aahan',
    relationshipLabel: 'Relationship',
    relationshipPlaceholder: 'e.g. Mother, Myself',
    medicationTitle: 'Add a first medication',
    medicationBody: 'You can skip this and add medications later.',
    notificationsTitle: 'Turn on reminders',
    notificationsBody:
      'Ahaan Eye needs permission to alert you when a dose is due. Without it, reminders cannot reach you.',
    notificationsEnable: 'Turn on reminders',
    notificationsLater: 'Not now',
    notificationsDenied:
      'Reminders are switched off. You can turn them on any time in your phone settings.',
  },

  tabs: {
    today: 'Today',
    reminders: 'Reminders',
    reports: 'Reports',
    profile: 'Profile',
  },

  today: {
    title: 'Today',
    nextDose: 'Next dose',
    noDosesTitle: 'Nothing scheduled today',
    noDosesBody: 'Add a reminder and it will appear here.',
    allDoneTitle: 'All done for today',
    allDoneBody: 'Every dose is accounted for. See you tomorrow.',
    remaining_one: '{{count}} dose left today',
    remaining_other: '{{count}} doses left today',
    upcoming: 'Coming up',
    earlier: 'Earlier today',
    markTaken: 'Taken',
    snooze: 'Snooze',
    skipDose: 'Skip',
    undo: 'Undo',
    movedFor: 'Moved to {{time}} to keep {{minutes}} minutes between drops',
  },

  status: {
    pending: 'Due',
    taken: 'Taken',
    snoozed: 'Snoozed',
    skipped: 'Skipped',
    missed: 'Missed',
  },

  eye: {
    left: 'Left eye',
    right: 'Right eye',
    both: 'Both eyes',
  },

  reminders: {
    title: 'Reminders',
    emptyTitle: 'No reminders yet',
    emptyBody: 'Add the drops you have been prescribed and we will schedule them for you.',
    addReminder: 'Add reminder',
    editReminder: 'Edit reminder',
    active: 'Active',
    paused: 'Paused',
    pause: 'Pause',
    resume: 'Resume',
    deleteTitle: 'Delete this reminder?',
    deleteBody:
      'Future doses will be removed. Doses you have already recorded stay in your reports.',
    perDay_one: '{{count}} time a day',
    perDay_other: '{{count}} times a day',
    everyDay: 'Every day',
    selectedDays: '{{days}}',
  },

  form: {
    medication: 'Medication',
    medicationPlaceholder: 'Type a name or brand',
    medicationHint: 'Start typing — we will suggest matching eye drops.',
    medicationFreeText: 'Use “{{name}}”',
    dosage: 'Dosage',
    dosagePlaceholder: 'e.g. 1 drop',
    whichEye: 'Which eye',
    schedule: 'Schedule',
    modeInterval: 'Every few hours',
    modeCount: 'A set number of times',
    modeTimes: 'At specific times',
    modeIntervalHint: 'e.g. every 2 hours between 08:00 and 20:00',
    modeCountHint: 'e.g. 5 times, 10 minutes apart, from 09:00',
    modeTimesHint: 'e.g. 08:00 and 20:00',
    startTime: 'First dose',
    endTime: 'Last dose by',
    every: 'Every',
    minutes: 'minutes',
    hours: 'hours',
    numberOfDoses: 'Number of doses',
    gapBetween: 'Gap between doses',
    times: 'Times',
    addTime: 'Add a time',
    days: 'Days',
    startDate: 'Starts',
    endDate: 'Ends',
    endDateNever: 'No end date',
    snoozeSettings: 'Snooze',
    snoozeLength: 'Snooze for',
    snoozeLimit: 'Maximum snoozes',
    alerts: 'Alerts',
    sound: 'Sound',
    vibration: 'Vibration',
    preview: 'Preview',
    previewTitle: 'Your day will look like this',
    previewShifted: 'Moved from {{from}} to avoid overlapping another drop',
    previewOther: '{{name}} — already scheduled',
    previewNone: 'Fill in the schedule to see a preview.',
    saveReminder: 'Save reminder',
  },

  validation: {
    nameRequired: 'Please enter a name.',
    medicationRequired: 'Please enter a medication.',
    'interval-too-small': 'The gap between doses must be at least 1 minute.',
    'interval-window-invalid': 'The last dose must come after the first dose.',
    'count-too-small': 'Enter at least one dose.',
    'count-gap-too-small': 'The gap between doses must be at least 1 minute.',
    'count-overflows-day':
      'That many doses will not fit before midnight — the last would fall at {{time}}. Try fewer doses, a smaller gap, or an earlier start.',
    'times-empty': 'Add at least one time.',
    'times-out-of-range': 'Please enter a time between 00:00 and 23:59.',
    'no-days-selected': 'Choose at least one day.',
    'date-range-invalid': 'The end date must come after the start date.',
    infeasibleTitle: 'This schedule does not fit',
    infeasibleShift:
      '{{name}} at {{time}} cannot be spaced {{gap}} minutes from your other drops without moving it too far. Try spreading these drops further apart.',
    infeasibleMidnight:
      '{{name}} at {{time}} would be pushed past midnight once the gap between drops is applied. Try an earlier time.',
  },

  reports: {
    title: 'Reports',
    range7: '7 days',
    range30: '30 days',
    range90: '90 days',
    adherence: 'Doses taken',
    ofEvaluated: '{{taken}} of {{total}} doses',
    noDataTitle: 'No history yet',
    noDataBody: 'Once you start recording doses, your report appears here.',
    taken: 'Taken',
    missed: 'Missed',
    skipped: 'Skipped',
    currentStreak: 'Current streak',
    bestStreak: 'Best streak',
    days_one: '{{count}} day',
    days_other: '{{count}} days',
    byMedication: 'By medication',
    share: 'Share report',
    onTrack: 'On track',
    needsAttention: 'Room to improve',
    outstandingNote: '{{count}} upcoming doses are not counted yet.',
  },

  profile: {
    title: 'Profile',
    people: 'People',
    addPerson: 'Add a person',
    editPerson: 'Edit person',
    deletePersonTitle: 'Delete {{name}}?',
    deletePersonBody: 'This removes their reminders and all their dose history. It cannot be undone.',
    deleteLastPersonBody: 'This is your only profile. Deleting it clears all data in the app.',
    settings: 'Settings',
    language: 'Language',
    security: 'App lock',
    backup: 'Backup',
    about: 'About',
    notificationsStatus: 'Reminders',
    notificationsOn: 'On',
    notificationsOff: 'Off — tap to fix',
    version: 'Version {{version}}',
    dataNote: 'All your data stays on this phone. Nothing is sent anywhere.',
  },

  security: {
    title: 'App lock',
    description: 'Require a PIN before opening Ahaan Eye. Your medication history is health data.',
    enable: 'Turn on app lock',
    disable: 'Turn off app lock',
    setPin: 'Choose a 4-digit PIN',
    confirmPin: 'Enter it again',
    pinMismatch: 'Those PINs did not match. Try again.',
    unlockTitle: 'Enter your PIN',
    wrongPin: 'Incorrect PIN.',
    useBiometric: 'Use biometrics',
    biometricPrompt: 'Unlock Ahaan Eye',
    biometricUnavailable: 'Biometrics are not set up on this phone.',
  },

  backup: {
    title: 'Backup',
    description:
      'Your data lives only on this phone. Save a backup file so you can restore it if you change or lose your phone.',
    exportAction: 'Save a backup',
    exportSuccess: 'Backup saved.',
    exportFailed: 'Could not save the backup.',
    importAction: 'Restore from a backup',
    importWarningTitle: 'Restore this backup?',
    importWarningBody:
      'This replaces everything currently in the app — all people, reminders and dose history.',
    importSuccess: 'Restored {{patients}} people and {{reminders}} reminders.',
    importFailed: 'That file could not be read as an Ahaan Eye backup.',
    importVersionMismatch: 'That backup was made by a newer version of the app.',
    lastBackup: 'Last backup: {{date}}',
    neverBackedUp: 'You have not made a backup yet.',
  },

  alarm: {
    timeFor: 'Time for',
    taken: 'Taken',
    snooze: 'Snooze {{minutes}} min',
    skip: 'Skip this dose',
    snoozeLimitReached: 'You have snoozed this dose the maximum number of times.',
    scheduledFor: 'Scheduled for {{time}}',
  },

  days: {
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
  },

  medicationClass: {
    glaucoma: 'Glaucoma',
    lubricant: 'Dry eye / lubricant',
    antibiotic: 'Antibiotic',
    steroid: 'Steroid',
    nsaid: 'Anti-inflammatory',
    antiallergy: 'Anti-allergy',
    mydriatic: 'Dilating drop',
    antiviral: 'Antiviral',
  },

  instructions: {
    linkLabel: 'How to use eye drops',
    title: 'How to use eye drops',
    intro:
      'Getting the drop into your eye — and keeping it there — matters as much as remembering the dose. These steps take under a minute.',
    disclaimer:
      'This is general guidance on technique. It does not replace what your doctor or pharmacist has told you. Always follow their instructions for your own medicines, and ask them if anything here differs from what they said.',
    stepsHeading: 'Step by step',
    step1: 'Wash your hands with soap and water, and dry them.',
    step2: 'Check the bottle: the right medicine, the right eye, and not past its expiry date.',
    step3: 'If the label says to shake it, shake it gently.',
    step4:
      'Open the cap and set it down on a clean surface. Do not let the tip touch anything — not your eye, your eyelashes, or your fingers.',
    step5: 'Tilt your head back, or lie down, and look up at the ceiling.',
    step6: 'Gently pull your lower eyelid down with one finger to make a small pocket.',
    step7:
      'Hold the bottle above your eye without touching it, and squeeze one drop into the pocket.',
    step8:
      'Close your eye gently. Do not squeeze it shut and do not blink hard — that pushes the drop straight out.',
    step9:
      'Press lightly on the inner corner of your eye, beside your nose, for one to two minutes. This keeps the drop in your eye.',
    step10: 'Wipe away anything that runs down with a clean tissue, then put the cap back on.',
    gapHeading: 'Leave a gap between different drops',
    gapBody:
      'Wait at least {{minutes}} minutes before a different drop, or the second one washes the first out. Ahaan Eye already spaces your reminders for you, so just follow the times it gives you.',
    tipsHeading: 'Worth knowing',
    tip1: 'One drop is enough. Your eye cannot hold more than one, so a second is wasted.',
    tip2:
      'If the drop clearly missed your eye, use one more. If you are not sure whether it went in, ask your doctor or pharmacist.',
    tip3: 'If you use an ointment or gel as well as drops, put the drops in first and the ointment last.',
    tip4:
      'If you wear contact lenses, take them out before your drops and wait about 15 minutes before putting them back in — unless your doctor tells you otherwise.',
    tip5: 'Never share a bottle with anyone else, even a family member.',
    tip6:
      'Store the bottle as the label says, and stop using it after the date your doctor or pharmacist gave you.',
  },

  capColour: {
    heading: 'Cap colour',
    note:
      'Cap colours follow a common convention for each type of eye medicine. Always read the label as well — colours can differ between brands.',
    describedAs: '{{colour}} cap',
    yellow: 'Yellow',
    teal: 'Teal',
    purple: 'Purple',
    orange: 'Orange',
    darkBlue: 'Dark blue',
    green: 'Green',
    red: 'Red',
    pink: 'Pink',
    tan: 'Tan',
  },

  impact: {
    heading: 'Eye frames funded',
    raisedLabel: 'Raised so far',
    framesLabel: 'Frames funded',
    perFrameNote: '{{amount}} funds one pair of frames for a child who needs them.',
    asOf: 'As of {{date}}',
  },
} as const;

export default en;
export type TranslationShape = typeof en;
