export type Terminal = {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  hours?: string;
  mapUrl?: string;
  facilities?: string[];
};

export const terminals: Terminal[] = [
  // LAGOS
  {
    id: "lagos-fadeyi",
    name: "Fadeyi Terminal",
    city: "Lagos",
    state: "Lagos",
    address: "Fadeyi, Ikorodu Road, Lagos",
    phone: "+234 913 399 4004",
    hours: "6:00 AM - 6:00 PM",
    mapUrl: "https://maps.google.com/?q=Fadeyi+Lagos",
    facilities: ["Waiting area", "Ticket support", "Nearby transit access"],
  },
  {
    id: "lagos-ajah",
    name: "Ajah Terminal",
    city: "Lagos",
    state: "Lagos",
    address: "Ajah, Lagos",
    phone: "+234 913 399 4004",
    hours: "6:00 AM - 6:00 PM",
    mapUrl: "https://maps.google.com/?q=Ajah+Lagos",
    facilities: ["Waiting area", "Ticket support"],
  },

  // BENIN
  {
    id: "benin-idokpa",
    name: "Idokpa Terminal",
    city: "Benin",
    state: "Edo",
    address: "Idokpa, Benin City",
    phone: "+234 913 399 4004",
    hours: "6:00 AM - 6:00 PM",
    mapUrl: "https://maps.google.com/?q=Idokpa+Benin+City",
    facilities: ["Waiting area", "Boarding support", "Customer support"],
  },
  {
    id: "benin-ramat-park",
    name: "Ramat Park Terminal",
    city: "Benin",
    state: "Edo",
    address: "Ramat Park, Benin City",
    phone: "+234 913 399 4004",
    hours: "6:00 AM - 6:00 PM",
    mapUrl: "https://maps.google.com/?q=Ramat+Park+Benin+City",
    facilities: ["Waiting area", "Boarding support"],
  },
  {
    id: "benin-uselu",
    name: "Uselu Terminal",
    city: "Benin",
    state: "Edo",
    address: "Uselu, Benin City",
    phone: "+234 913 399 4004",
    hours: "6:00 AM - 6:00 PM",
    mapUrl: "https://maps.google.com/?q=Uselu+Benin+City",
    facilities: ["Waiting area", "Ticket support"],
  },

  // ONITSHA
  {
    id: "onitsha-ukumango",
    name: "Ukumango Terminal",
    city: "Onitsha",
    state: "Anambra",
    address: "Ukumango, Onitsha",
    phone: "+234 913 399 4004",
    hours: "6:00 AM - 6:00 PM",
    mapUrl: "https://maps.google.com/?q=Ukumango+Onitsha",
    facilities: ["Waiting area", "Boarding support"],
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
