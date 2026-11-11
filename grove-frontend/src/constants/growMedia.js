// `hint` says what each medium is, shown under the choice. These are definitions, not care advice.
export const MEDIUMS = [
  { value: 'soil', label: 'Soil', hint: 'The plant grows in potting mix.' },
  { value: 'leca', label: 'LECA', hint: 'LECA is lightweight clay pebbles. The roots grow in the pebbles instead of soil, often with water kept below them.' },
  { value: 'bark', label: 'Bark', orchidOnly: true, hint: 'Chunks of tree bark instead of soil, often used for orchids.' },
  { value: 'water', label: 'Water', hint: 'The plant lives in water with no soil. Its roots stay in the water for good.' },
  { value: 'propagation_jar', label: 'Propagation jar', hint: 'A cutting growing roots in a jar of water, usually before it moves to soil or another home.' },
  { value: 'other', label: 'Other', hint: 'Anything not listed here.' },
];
