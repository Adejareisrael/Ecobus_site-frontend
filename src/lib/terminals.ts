export type Terminal = {
  id: string;
  name: string;
  city: string;
  state: string;
};

export const terminals: Terminal[] = [
  // LAGOS
  {
    id: "lagos-fadeyi",
    name: "Fadeyi Terminal",
    city: "Lagos",
    state: "Lagos",
  },
  {
    id: "lagos-ajah",
    name: "Ajah Terminal",
    city: "Lagos",
    state: "Lagos",
  },

  // BENIN
  {
    id: "benin-idokpa",
    name: "Idokpa Terminal",
    city: "Benin",
    state: "Edo",
  },
  {
    id: "benin-ramat-park",
    name: "Ramat Park Terminal",
    city: "Benin",
    state: "Edo",
  },
  {
    id: "benin-uselu",
    name: "Uselu Terminal",
    city: "Benin",
    state: "Edo",
  },

  // ONITSHA
  {
    id: "onitsha-ukumango",
    name: "Ukumango Terminal",
    city: "Onitsha",
    state: "Anambra",
  },
];

export const terminalsByState = {
  Lagos: [
    "lagos-fadeyi",
    "lagos-ajah",
  ],

  Edo: [
    "benin-idokpa",
    "benin-ramat-park",
    "benin-uselu",
  ],

  Anambra: [
    "onitsha-ukumango",
  ],
};

export function getTerminalById(id: string) {
  return terminals.find((t) => t.id === id);
}

export function getTerminalsByState(state: string) {
  return terminals.filter((t) => t.state === state);
}

export function getTerminalsByCity(city: string) {
  return terminals.filter((t) => t.city === city);
}