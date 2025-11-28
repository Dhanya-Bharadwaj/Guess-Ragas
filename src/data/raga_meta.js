// Centralized raga metadata. This file seeds a few hand-authored entries
// and then ensures every raga from `src/data/ragas.js` (melakarta + janya)
// has at least a placeholder object so the UI pages render without errors.
//
// Placeholders use empty strings/arrays for arohana/avarohana/notes and
// can be filled in later (manually or via an automated fetch step).

import curated from './ragas';
import melakartaMeta from './melakarta_meta.json';

const seed = {
  Kalyani: {
    arohana: "S R2 G3 M2 P D2 N3 S'",
    avarohana: "S' N3 D2 P M2 G3 R2 S",
    notes: ["S", "R2", "G3", "M2", "P", "D2", "N3"],
    keerthanas: ["Sri Ranganatha (Tyagaraja)", "Kamalambam bhavayami"],
    songs: ["Sankari Sankuru (MS Subbulakshmi)", "Bhajare Re Chitta (Thyagaraja)"]
  },
  Shankarabharanam: {
    arohana: "S R2 G3 M1 P D2 N3 S'",
    avarohana: "S' N3 D2 P M1 G3 R2 S",
    notes: ["S", "R2", "G3", "M1", "P", "D2", "N3"],
    keerthanas: ["Endaro Mahanubhavulu", "Rama Nee Samanamu"],
    songs: ["Nagumomu Ganaleni", "Brochevarevarura"]
  },
  Kambhoji: {
    arohana: "S R2 G3 M1 P D2 S'",
    avarohana: "S' N2 D2 P M1 G3 R2 S",
    notes: ["S", "R2", "G3", "M1", "P", "D2", "N2"],
    keerthanas: ["Marivere Gati (Muthuswami Dikshitar)"],
    songs: ["Vathapi Ganapathim"]
  },
  Hindolam: {
    arohana: "S G2 M1 D2 N2 S'",
    avarohana: "S' N2 D2 M1 G2 S",
    notes: ["S", "G2", "M1", "D2", "N2"],
    keerthanas: ["Nada Vinodamu"],
    songs: ["O Rangasayee"]
  },
  Kharaharapriya: {
    arohana: "S R2 G2 M1 P D2 N2 S'",
    avarohana: "S' N2 D2 P M1 G2 R2 S",
    notes: ["S", "R2", "G2", "M1", "P", "D2", "N2"],
    keerthanas: ["Sami Ninne Korukunnana"],
    songs: ["Vasudevayani (Tyagaraja)"]
  },
  Chalanata: {
    arohana: "S R2 G3 M1 P D2 N3 S'",
    avarohana: "S' N3 D2 P M1 G3 R2 S",
    notes: ["S", "R2", "G3", "M1", "P", "D2", "N3"],
    keerthanas: ["(example) Chalanata Keerthana 1"],
    songs: ["(example) Popular Song 1"]
  },
  Hamsadhwani: {
    arohana: "S R2 G3 P N3 S",
    avarohana: "S N3 P G3 R2 S",
    notes: ["S","R2","G3","P","N3"],
    keerthanas: ["Vatapi Ganapatim (Dikshitar)"],
    songs: ["Vatapi Ganapatim"]
  },
  Mohanam: {
    arohana: "S R2 G3 P D2 S",
    avarohana: "S D2 P G3 R2 S",
    notes: ["S","R2","G3","P","D2"],
    keerthanas: ["(example) Mohanam Keerthana"],
    songs: ["Saroja (Purandara Dasa)"]
  },
  "Dheera Shankarabharanam": {
    arohana: "S R2 G3 M1 P D2 N3 S",
    avarohana: "S N3 D2 P M1 G3 R2 S",
    notes: ["S","R2","G3","M1","P","D2","N3"],
    keerthanas: ["Endaro Mahanubhavulu"],
    songs: ["Vatapi Ganapatim"]
  }
};

// Merge canonical melakarta metadata (from fetched/curated source)
const ragaMeta = { ...melakartaMeta, ...seed };

function addPlaceholder(name) {
  if (!ragaMeta[name]) {
    ragaMeta[name] = {
      arohana: "",
      avarohana: "",
      notes: [],
      keerthanas: [],
      songs: []
    };
  }
}

// Add melakarta (strip numeric prefixes)
if (curated && curated.melakarta) {
  curated.melakarta.forEach((m) => {
    const name = m.replace(/^\d+\s+/, '');
    // small normalize: fix known concatenations
    const display = name === 'Dheerasankarabharanam' ? 'Dheera Shankarabharanam' : name;
    addPlaceholder(display);
  });
}

// Add janya ragas as-is
if (curated && curated.janya) {
  curated.janya.forEach((j) => {
    addPlaceholder(j);
  });
}

export default ragaMeta;

