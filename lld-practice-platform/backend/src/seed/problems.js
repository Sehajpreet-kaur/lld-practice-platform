import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import Problem from "../models/Problem.js";

const PROBLEMS = [
  {
    title: "Design a Parking Lot",
    slug: "parking-lot",
    difficulty: "Medium",
    description:
      "Design a parking lot system that supports multiple vehicle types and multiple floors, and tracks available spots in real time.",
    requirements: [
      "Support at least 3 vehicle types (motorcycle, car, bus) with different spot size needs",
      "Assign the nearest available valid spot to an entering vehicle",
      "Support multiple floors, each with a fixed number of spots per type",
      "Compute parking fee based on duration on exit",
      "Handle the lot being full gracefully",
    ],
    tags: ["OOP", "Strategy Pattern"],
  },
  {
    title: "Design an Elevator System",
    slug: "elevator-system",
    difficulty: "Hard",
    description:
      "Design the control system for a bank of elevators in a building, handling scheduling of pickup/drop-off requests.",
    requirements: [
      "Support multiple elevators serving the same set of floors",
      "Handle both external (floor button) and internal (cabin button) requests",
      "Decide which elevator should service a new request",
      "Support direction state (up/down/idle) per elevator",
      "Design should make it possible to swap the scheduling strategy later",
    ],
    tags: ["State Pattern", "Strategy Pattern", "Concurrency"],
  },
  {
    title: "Design a Vending Machine",
    slug: "vending-machine",
    difficulty: "Easy",
    description:
      "Design a vending machine that accepts cash, dispenses items, and gives change, modeled as a clear state machine.",
    requirements: [
      "Support browsing items with price and stock count",
      "Accept coins/notes incrementally and track balance",
      "Dispense the selected item only if balance is sufficient and it's in stock",
      "Return change and handle insufficient-stock/insufficient-balance cases",
      "Model the machine's states explicitly (Idle, HasMoney, Dispensing, OutOfStock, etc.)",
    ],
    tags: ["State Pattern"],
  },
  {
    title: "Design a Library Management System",
    slug: "library-management-system",
    difficulty: "Medium",
    description:
      "Design a system to manage a library's book catalog, member borrowing, and due dates/fines.",
    requirements: [
      "Support multiple copies of the same book (ISBN vs physical copy)",
      "A member can borrow up to N books at a time",
      "Track due dates and compute late fines",
      "Support reserving a book that is currently checked out",
      "Handle a book being lost or damaged",
    ],
    tags: ["OOP", "Aggregation"],
  },
  {
    title: "Design a Ride-Hailing Matching Service",
    slug: "ride-hailing-matching",
    difficulty: "Hard",
    description:
      "Design the core domain model for matching riders to nearby available drivers (ignore real-time geo-indexing internals - focus on the domain model and state transitions).",
    requirements: [
      "Model a ride's lifecycle: Requested -> DriverAssigned -> InProgress -> Completed/Cancelled",
      "A driver can be Available, EnRoute, or OnTrip",
      "Support cancellation by rider or driver at different stages with different consequences",
      "Design should support pluggable matching strategies (nearest driver, highest rated, etc.)",
      "Handle no-drivers-available gracefully",
    ],
    tags: ["State Pattern", "Strategy Pattern"],
  },
];

async function run() {
  await connectDB(process.env.MONGO_URI);
  for (const p of PROBLEMS) {
    await Problem.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
  }
  console.log(`[seed] upserted ${PROBLEMS.length} problems`);
  await disconnectDB();
}

run().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
