import { BusLayout, Seat } from "./types";

type DbBusLayout = {
  id: string;
  name: string;
  model: string;
  totalSeats: number;
  seatsJson: string;
  isDefault: boolean;
};

export const toyotaLayoutId = "toyota-14";

export function createSeat(label: string, row: number, column: number): Seat {
  return {
    id: `seat-${label}`,
    label,
    isAvailable: true,
    row,
    column,
  };
}

export function generateToyotaSeats(): Seat[] {
  return [
    createSeat("1", 0, 3),
    createSeat("2", 1, 0),
    createSeat("3", 1, 1),
    createSeat("4", 1, 2),
    createSeat("5", 2, 0),
    createSeat("6", 2, 1),
    createSeat("7", 2, 3),
    createSeat("8", 3, 0),
    createSeat("9", 3, 1),
    createSeat("10", 3, 3),
    createSeat("11", 4, 0),
    createSeat("12", 4, 1),
    createSeat("13", 4, 2),
    createSeat("14", 4, 3),
  ];
}

export function generateGenericSeats(availableSeats: number): Seat[] {
  return Array.from({ length: availableSeats }, (_, index) => {
    const seatNumber = index + 1;
    return createSeat(String(seatNumber), Math.floor(index / 4), index % 4);
  });
}

export const defaultToyotaLayout: BusLayout = {
  id: toyotaLayoutId,
  name: "Toyota 14-seater",
  model: "Toyota",
  totalSeats: 14,
  seats: generateToyotaSeats(),
  isDefault: true,
};

export function formatBusLayout(layout: DbBusLayout): BusLayout {
  return {
    id: layout.id,
    name: layout.name,
    model: layout.model,
    totalSeats: layout.totalSeats,
    seats: JSON.parse(layout.seatsJson) as Seat[],
    isDefault: layout.isDefault,
  };
}

export function busLayoutToDbInput(layout: Omit<BusLayout, "id">) {
  return {
    name: layout.name,
    model: layout.model,
    totalSeats: layout.totalSeats,
    seatsJson: JSON.stringify(layout.seats),
    isDefault: layout.isDefault,
  };
}

export function validateLayoutSeats(seats: Seat[]): Seat[] {
  const labels = new Set<string>();

  return seats.map((seat) => {
    const label = String(seat.label).trim();
    if (!label) throw new Error("Seat labels are required");
    if (labels.has(label)) throw new Error("Seat labels must be unique");
    labels.add(label);

    return {
      id: seat.id || `seat-${label}`,
      label,
      isAvailable: true,
      row: Number(seat.row),
      column: Number(seat.column),
    };
  });
}
