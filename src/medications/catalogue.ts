/**
 * Bundled ophthalmic medication catalogue for the Indian market.
 *
 * This exists purely so a patient can type "Dorzox" and get the right generic
 * name attached to their reminder. It is an autocomplete convenience, NOT
 * clinical guidance and NOT a formulary:
 *
 *  - Free text is always accepted. Nothing in the app requires a catalogue hit.
 *  - Strengths listed are the common presentations, shown as suggestions when
 *    the patient fills in dosage. The prescription on the bottle wins.
 *  - Brand names are the widely-available Indian brands for that molecule.
 *    They are here for recognition — most patients know the bottle, not the
 *    molecule — not as an endorsement or a completeness claim.
 *
 * Ships on-device, so it works with no connectivity and costs no round trip.
 */

export type MedicationClass =
  | 'glaucoma'
  | 'antibiotic'
  | 'steroid'
  | 'nsaid'
  | 'lubricant'
  | 'antiallergy'
  | 'mydriatic'
  | 'antiviral';

export type MedicationForm = 'drop' | 'gel' | 'ointment' | 'emulsion';

export type MedicationEntry = {
  id: string;
  /** Canonical generic / molecule name. */
  generic: string;
  /** Common Indian brand names for this molecule. */
  brands: string[];
  medicationClass: MedicationClass;
  form: MedicationForm;
  /** Common presentations, offered as dosage suggestions. */
  strengths: string[];
};

export const MEDICATION_CLASS_ORDER: MedicationClass[] = [
  'glaucoma',
  'lubricant',
  'antibiotic',
  'steroid',
  'nsaid',
  'antiallergy',
  'mydriatic',
  'antiviral',
];

export const MEDICATIONS: MedicationEntry[] = [
  // ---------------------------------------------------------------- glaucoma
  {
    id: 'timolol',
    generic: 'Timolol maleate',
    brands: ['Glucomol', 'Iotim', 'Timolet', 'Timoptic'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['0.25%', '0.5%'],
  },
  {
    id: 'latanoprost',
    generic: 'Latanoprost',
    brands: ['Xalatan', 'Latoprost', '9 PM', 'Iotim-LT'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['0.005%'],
  },
  {
    id: 'bimatoprost',
    generic: 'Bimatoprost',
    brands: ['Lumigan', 'Bimat', 'Careprost'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['0.01%', '0.03%'],
  },
  {
    id: 'travoprost',
    generic: 'Travoprost',
    brands: ['Travatan', 'Travoprost-T'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['0.004%'],
  },
  {
    id: 'brimonidine',
    generic: 'Brimonidine tartrate',
    brands: ['Alphagan', 'Iobrim', 'Brimosun'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['0.1%', '0.15%', '0.2%'],
  },
  {
    id: 'dorzolamide',
    generic: 'Dorzolamide',
    brands: ['Dorzox', 'Trusopt', 'Misopt'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['2%'],
  },
  {
    id: 'brinzolamide',
    generic: 'Brinzolamide',
    brands: ['Azopt', 'Brinzox', 'Optibrinz'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['1%'],
  },
  {
    id: 'dorzolamide-timolol',
    generic: 'Dorzolamide + Timolol',
    brands: ['Dorzox-T', 'Cosopt', 'Misopt-T'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['2% + 0.5%'],
  },
  {
    id: 'brimonidine-timolol',
    generic: 'Brimonidine + Timolol',
    brands: ['Combigan', 'Brimolol', 'Iobrim-T'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['0.2% + 0.5%'],
  },
  {
    id: 'latanoprost-timolol',
    generic: 'Latanoprost + Timolol',
    brands: ['Xalacom', 'Latacom', '9 PM-T'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['0.005% + 0.5%'],
  },
  {
    id: 'brinzolamide-timolol',
    generic: 'Brinzolamide + Timolol',
    brands: ['Azarga', 'Brinzox-T'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['1% + 0.5%'],
  },
  {
    id: 'brinzolamide-brimonidine',
    generic: 'Brinzolamide + Brimonidine',
    brands: ['Simbrinza'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['1% + 0.2%'],
  },
  {
    id: 'pilocarpine',
    generic: 'Pilocarpine',
    brands: ['Pilocar', 'Pilomax'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['1%', '2%', '4%'],
  },
  {
    id: 'netarsudil',
    generic: 'Netarsudil',
    brands: ['Rhopressa', 'Netaflow'],
    medicationClass: 'glaucoma',
    form: 'drop',
    strengths: ['0.02%'],
  },

  // --------------------------------------------------------------- lubricant
  {
    id: 'cmc',
    generic: 'Carboxymethylcellulose',
    brands: ['Refresh Tears', 'Optive', 'Lubrex', 'Cellufresh'],
    medicationClass: 'lubricant',
    form: 'drop',
    strengths: ['0.5%', '1%'],
  },
  {
    id: 'sodium-hyaluronate',
    generic: 'Sodium hyaluronate',
    brands: ['Hylo-Fresh', 'I-Kul', 'Hyalub'],
    medicationClass: 'lubricant',
    form: 'drop',
    strengths: ['0.1%', '0.18%', '0.3%'],
  },
  {
    id: 'hpmc',
    generic: 'Hydroxypropyl methylcellulose',
    brands: ['Genteal', 'Tears Plus', 'Moisol'],
    medicationClass: 'lubricant',
    form: 'drop',
    strengths: ['0.3%', '2%'],
  },
  {
    id: 'peg-propylene-glycol',
    generic: 'Polyethylene glycol + Propylene glycol',
    brands: ['Systane', 'Duratears'],
    medicationClass: 'lubricant',
    form: 'drop',
    strengths: ['0.4% + 0.3%'],
  },
  {
    id: 'carbomer',
    generic: 'Carbomer',
    brands: ['Lubistar Gel', 'Viscotears'],
    medicationClass: 'lubricant',
    form: 'gel',
    strengths: ['0.2%'],
  },
  {
    id: 'cyclosporine',
    generic: 'Cyclosporine',
    brands: ['Restasis', 'Cyclomune', 'Imudrops'],
    medicationClass: 'lubricant',
    form: 'emulsion',
    strengths: ['0.05%', '0.1%'],
  },

  // -------------------------------------------------------------- antibiotic
  {
    id: 'moxifloxacin',
    generic: 'Moxifloxacin',
    brands: ['Vigamox', 'Milflox', '4 Quin', 'Moxicip'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.5%'],
  },
  {
    id: 'gatifloxacin',
    generic: 'Gatifloxacin',
    brands: ['Zymar', 'Gatiquin', 'Gatilox'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.3%', '0.5%'],
  },
  {
    id: 'ofloxacin',
    generic: 'Ofloxacin',
    brands: ['Oflox', 'Exocin', 'Zanocin'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.3%'],
  },
  {
    id: 'ciprofloxacin',
    generic: 'Ciprofloxacin',
    brands: ['Ciplox', 'Ciloxan'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.3%'],
  },
  {
    id: 'tobramycin',
    generic: 'Tobramycin',
    brands: ['Tobrex', 'Toba', 'Tobastar'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.3%'],
  },
  {
    id: 'chloramphenicol',
    generic: 'Chloramphenicol',
    brands: ['Chloromycetin', 'Chlorocol'],
    medicationClass: 'antibiotic',
    form: 'ointment',
    strengths: ['1%'],
  },
  {
    id: 'tobramycin-dexamethasone',
    generic: 'Tobramycin + Dexamethasone',
    brands: ['Tobradex', 'Toba-DM', 'Tobastar-DM'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.3% + 0.1%'],
  },
  {
    id: 'moxifloxacin-dexamethasone',
    generic: 'Moxifloxacin + Dexamethasone',
    brands: ['Vigadexa', 'Milflox-DM', '4 Quin-DM'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.5% + 0.1%'],
  },
  {
    id: 'gatifloxacin-prednisolone',
    generic: 'Gatifloxacin + Prednisolone',
    brands: ['Gatiquin-P', 'Gatilox-P'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.3% + 1%'],
  },
  {
    id: 'moxifloxacin-loteprednol',
    generic: 'Moxifloxacin + Loteprednol',
    brands: ['Lotepred-M', 'Milflox-LP'],
    medicationClass: 'antibiotic',
    form: 'drop',
    strengths: ['0.5% + 0.5%'],
  },

  // ------------------------------------------------------------------ steroid
  {
    id: 'prednisolone',
    generic: 'Prednisolone acetate',
    brands: ['Pred Forte', 'Predmet', 'Predace'],
    medicationClass: 'steroid',
    form: 'drop',
    strengths: ['0.12%', '1%'],
  },
  {
    id: 'dexamethasone',
    generic: 'Dexamethasone',
    brands: ['Maxidex', 'Dexoren', 'Dexacip'],
    medicationClass: 'steroid',
    form: 'drop',
    strengths: ['0.1%'],
  },
  {
    id: 'loteprednol',
    generic: 'Loteprednol etabonate',
    brands: ['Lotepred', 'Lotemax'],
    medicationClass: 'steroid',
    form: 'drop',
    strengths: ['0.2%', '0.5%'],
  },
  {
    id: 'fluorometholone',
    generic: 'Fluorometholone',
    brands: ['FML', 'Flarex', 'Flucort'],
    medicationClass: 'steroid',
    form: 'drop',
    strengths: ['0.1%'],
  },
  {
    id: 'difluprednate',
    generic: 'Difluprednate',
    brands: ['Durezol', 'Difluprednate-DF'],
    medicationClass: 'steroid',
    form: 'emulsion',
    strengths: ['0.05%'],
  },
  {
    id: 'hydrocortisone',
    generic: 'Hydrocortisone',
    brands: ['Softacort'],
    medicationClass: 'steroid',
    form: 'drop',
    strengths: ['0.335%'],
  },

  // -------------------------------------------------------------------- NSAID
  {
    id: 'nepafenac',
    generic: 'Nepafenac',
    brands: ['Nevanac', 'Nepaflam'],
    medicationClass: 'nsaid',
    form: 'drop',
    strengths: ['0.1%', '0.3%'],
  },
  {
    id: 'ketorolac',
    generic: 'Ketorolac tromethamine',
    brands: ['Acular', 'Ketlur', 'Ketofly'],
    medicationClass: 'nsaid',
    form: 'drop',
    strengths: ['0.4%', '0.5%'],
  },
  {
    id: 'bromfenac',
    generic: 'Bromfenac',
    brands: ['Bromfree', 'Bromoday'],
    medicationClass: 'nsaid',
    form: 'drop',
    strengths: ['0.07%', '0.09%'],
  },
  {
    id: 'flurbiprofen',
    generic: 'Flurbiprofen',
    brands: ['Ocuflur', 'Flur'],
    medicationClass: 'nsaid',
    form: 'drop',
    strengths: ['0.03%'],
  },

  // -------------------------------------------------------------- antiallergy
  {
    id: 'olopatadine',
    generic: 'Olopatadine',
    brands: ['Patanol', 'Winolap', 'Olopat'],
    medicationClass: 'antiallergy',
    form: 'drop',
    strengths: ['0.1%', '0.2%'],
  },
  {
    id: 'ketotifen',
    generic: 'Ketotifen fumarate',
    brands: ['Zaditor', 'Ketotif'],
    medicationClass: 'antiallergy',
    form: 'drop',
    strengths: ['0.025%'],
  },
  {
    id: 'sodium-cromoglicate',
    generic: 'Sodium cromoglicate',
    brands: ['Cromal', 'Opticrom'],
    medicationClass: 'antiallergy',
    form: 'drop',
    strengths: ['2%', '4%'],
  },
  {
    id: 'bepotastine',
    generic: 'Bepotastine besilate',
    brands: ['Bepreve', 'Bepotas'],
    medicationClass: 'antiallergy',
    form: 'drop',
    strengths: ['1.5%'],
  },
  {
    id: 'azelastine',
    generic: 'Azelastine',
    brands: ['Optivar', 'Azelast'],
    medicationClass: 'antiallergy',
    form: 'drop',
    strengths: ['0.05%'],
  },

  // ---------------------------------------------------------------- mydriatic
  {
    id: 'tropicamide',
    generic: 'Tropicamide',
    brands: ['Tropicacyl', 'Mydriacyl'],
    medicationClass: 'mydriatic',
    form: 'drop',
    strengths: ['0.5%', '1%'],
  },
  {
    id: 'tropicamide-phenylephrine',
    generic: 'Tropicamide + Phenylephrine',
    brands: ['Tropicacyl Plus', 'Mydriacyl-P'],
    medicationClass: 'mydriatic',
    form: 'drop',
    strengths: ['0.8% + 5%'],
  },
  {
    id: 'homatropine',
    generic: 'Homatropine',
    brands: ['Homide', 'Homatropaine'],
    medicationClass: 'mydriatic',
    form: 'drop',
    strengths: ['2%'],
  },
  {
    id: 'atropine',
    generic: 'Atropine sulphate',
    brands: ['Atropine', 'Myopin'],
    medicationClass: 'mydriatic',
    form: 'drop',
    strengths: ['0.01%', '0.1%', '1%'],
  },
  {
    id: 'cyclopentolate',
    generic: 'Cyclopentolate',
    brands: ['Cyclogyl', 'Cyclomid'],
    medicationClass: 'mydriatic',
    form: 'drop',
    strengths: ['0.5%', '1%'],
  },

  // ----------------------------------------------------------------- antiviral
  {
    id: 'acyclovir',
    generic: 'Acyclovir',
    brands: ['Ocuvir', 'Herpex'],
    medicationClass: 'antiviral',
    form: 'ointment',
    strengths: ['3%'],
  },
  {
    id: 'ganciclovir',
    generic: 'Ganciclovir',
    brands: ['Virgan', 'Zirgan'],
    medicationClass: 'antiviral',
    form: 'gel',
    strengths: ['0.15%'],
  },
];

const MEDICATIONS_BY_ID = new Map(MEDICATIONS.map((m) => [m.id, m]));

export function getMedication(id: string): MedicationEntry | undefined {
  return MEDICATIONS_BY_ID.get(id);
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export type MedicationMatch = {
  entry: MedicationEntry;
  /** The string that matched — shown as "Dorzox (Dorzolamide)". */
  matchedOn: string;
  /** True when the match came from a brand rather than the generic name. */
  viaBrand: boolean;
};

/**
 * Ranked search over generic and brand names.
 *
 * Ranking is deliberately simple — prefix beats substring, generic beats brand
 * — because with ~55 entries anything cleverer would be harder to predict than
 * it is useful. Patients type the first few letters of what is on the bottle.
 */
export function searchMedications(query: string, limit = 8): MedicationMatch[] {
  const q = normalise(query);
  if (q.length === 0) return [];

  const scored: Array<MedicationMatch & { score: number }> = [];

  for (const entry of MEDICATIONS) {
    const generic = normalise(entry.generic);
    let best: { score: number; matchedOn: string; viaBrand: boolean } | null = null;

    if (generic.startsWith(q)) {
      best = { score: 0, matchedOn: entry.generic, viaBrand: false };
    } else if (generic.includes(q)) {
      best = { score: 2, matchedOn: entry.generic, viaBrand: false };
    }

    for (const brand of entry.brands) {
      const b = normalise(brand);
      const score = b.startsWith(q) ? 1 : b.includes(q) ? 3 : null;
      if (score !== null && (best === null || score < best.score)) {
        best = { score, matchedOn: brand, viaBrand: true };
      }
    }

    if (best) {
      scored.push({ entry, matchedOn: best.matchedOn, viaBrand: best.viaBrand, score: best.score });
    }
  }

  return scored
    .sort((a, b) => a.score - b.score || a.entry.generic.localeCompare(b.entry.generic))
    .slice(0, limit)
    .map(({ entry, matchedOn, viaBrand }) => ({ entry, matchedOn, viaBrand }));
}

/** Entries grouped by class, for browsing when the patient has no idea what to type. */
export function medicationsByClass(): Array<{
  medicationClass: MedicationClass;
  entries: MedicationEntry[];
}> {
  return MEDICATION_CLASS_ORDER.map((medicationClass) => ({
    medicationClass,
    entries: MEDICATIONS.filter((m) => m.medicationClass === medicationClass),
  })).filter((group) => group.entries.length > 0);
}
