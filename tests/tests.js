// tests/tests.js
import { User, Room, Reservation } from "../backend/models.js";
import { InMemoryStorage } from "../backend/storage.js";
import { StudyRoomService } from "../backend/service.js";

const resultsEl = document.getElementById("results");

function log(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  resultsEl.appendChild(div);
}

function assertTrue(cond, msg = "Expected true") {
  if (!cond) throw new Error(msg);
}
function assertFalse(cond, msg = "Expected false") {
  if (cond) throw new Error(msg);
}
function assertEquals(a, b, msg = "Expected equal") {
  if (a !== b) throw new Error(`${msg}: ${a} !== ${b}`);
}
function assertThrows(fn, msg = "Expected throw") {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) throw new Error(msg);
}

function test(name, fn) {
  try {
    fn();
    log(`✅ ${name}`);
  } catch (e) {
    log(`❌ ${name} — ${e.message}`);
  }
}

// Helper
function setupService() {
  const storage = new InMemoryStorage();
  const service = new StudyRoomService(storage);
  return { storage, service };
}


// USER (5 tests)

test("User: create stores fields (Kai Wong)", () => {
  const u = new User("u1", "Kai Wong", "kwong@scu.edu", "STUDENT");
  assertEquals("u1", u.getId());
  assertEquals("Kai Wong", u.getName());
  assertEquals("kwong@scu.edu", u.getEmail());
  assertEquals("STUDENT", u.getRole());
});

test("User: rejects null email (Kate Picca)", () => {
  assertThrows(() => new User("u2", "Kate Picca", null, "STUDENT"));
});

test("User: isValidScuEmail true (Tess Wei)", () => {
  const u = new User("u3", "Tess Wei", "twei@scu.edu", "STUDENT");
  assertTrue(u.isValidScuEmail());
});

test("User: isValidScuEmail false (non-scu)", () => {
  const u = new User("u4", "Alex Chen", "alex@gmail.com", "STUDENT");
  assertFalse(u.isValidScuEmail());
});

test("User: isAdmin true when ADMIN", () => {
  const u = new User("u5", "Admin User", "admin@scu.edu", "ADMIN");
  assertTrue(u.isAdmin());
});


// ROOM (5 tests)

test("Room: create stores fields (SCDI 3301)", () => {
  const r = new Room("r1", "SCDI 3301", "SCDI", 6);
  assertEquals("r1", r.getId());
  assertEquals("SCDI 3301", r.getName());
  assertEquals("SCDI", r.getBuilding());
  assertEquals(6, r.getCapacity());
});

test("Room: rejects capacity <= 0", () => {
  assertThrows(() => new Room("r2", "Bad Room", "SCDI", 0));
});

test("Room: addFeature adds unique", () => {
  const r = new Room("r3", "SCDI 3301", "SCDI", 6);
  r.addFeature("Whiteboard");
  r.addFeature("Whiteboard");
  assertEquals(1, r.getFeatures().length);
});

test("Room: hasFeature true", () => {
  const r = new Room("r4", "SCDI 3301", "SCDI", 6);
  r.addFeature("Projector");
  assertTrue(r.hasFeature("Projector"));
});

test("Room: addFeature rejects empty", () => {
  const r = new Room("r5", "SCDI 3301", "SCDI", 6);
  assertThrows(() => r.addFeature(""));
});


// RESERVATION (5 tests)

test("Reservation: create is ACTIVE", () => {
  const u = new User("u1", "Kai Wong", "kwong@scu.edu");
  const r = new Room("r1", "SCDI 3301", "SCDI", 6);
  const start = new Date(Date.now() + 3600000).toISOString();
  const end = new Date(Date.now() + 7200000).toISOString();
  const res = new Reservation("res1", u, r, start, end);
  assertEquals("ACTIVE", res.getStatus());
});

test("Reservation: rejects end before start", () => {
  const u = new User("u1", "Kai Wong", "kwong@scu.edu");
  const r = new Room("r1", "SCDI 3301", "SCDI", 6);
  const start = new Date(Date.now() + 7200000).toISOString();
  const end = new Date(Date.now() + 3600000).toISOString();
  assertThrows(() => new Reservation("res2", u, r, start, end));
});

test("Reservation: overlaps true", () => {
  const u = new User("u1", "Kai Wong", "kwong@scu.edu");
  const r = new Room("r1", "SCDI 3301", "SCDI", 6);
  const aStart = new Date("2030-01-01T10:00:00Z").toISOString();
  const aEnd = new Date("2030-01-01T12:00:00Z").toISOString();
  const bStart = new Date("2030-01-01T11:00:00Z").toISOString();
  const bEnd = new Date("2030-01-01T13:00:00Z").toISOString();
  const a = new Reservation("a", u, r, aStart, aEnd);
  const b = new Reservation("b", u, r, bStart, bEnd);
  assertTrue(a.overlaps(b));
});

test("Reservation: overlaps false when touching edge", () => {
  const u = new User("u1", "Kai Wong", "kwong@scu.edu");
  const r = new Room("r1", "SCDI 3301", "SCDI", 6);
  const aStart = new Date("2030-01-01T10:00:00Z").toISOString();
  const aEnd = new Date("2030-01-01T12:00:00Z").toISOString();
  const bStart = new Date("2030-01-01T12:00:00Z").toISOString();
  const bEnd = new Date("2030-01-01T13:00:00Z").toISOString();
  const a = new Reservation("a", u, r, aStart, aEnd);
  const b = new Reservation("b", u, r, bStart, bEnd);
  assertFalse(a.overlaps(b));
});

test("Reservation: cancel changes status", () => {
  const u = new User("u1", "Kai Wong", "kwong@scu.edu");
  const r = new Room("r1", "SCDI 3301", "SCDI", 6);
  const start = new Date(Date.now() + 3600000).toISOString();
  const end = new Date(Date.now() + 7200000).toISOString();
  const res = new Reservation("res3", u, r, start, end);
  res.cancel();
  assertEquals("CANCELLED", res.getStatus());
});


// STORAGE (5 tests)

test("Storage: addUser then getUsers length", () => {
  const s = new InMemoryStorage();
  s.addUser(new User("u1", "Kai Wong", "kwong@scu.edu"));
  assertEquals(1, s.getUsers().length);
});

test("Storage: findUserById returns user", () => {
  const s = new InMemoryStorage();
  const u = new User("u1", "Kai Wong", "kwong@scu.edu");
  s.addUser(u);
  assertEquals("Kai Wong", s.findUserById("u1").name);
});

test("Storage: findRoomById returns null if missing", () => {
  const s = new InMemoryStorage();
  assertEquals(null, s.findRoomById("nope"));
});

test("Storage: addReservation then findReservationById", () => {
  const s = new InMemoryStorage();
  const u = new User("u1", "Kai Wong", "kwong@scu.edu");
  const r = new Room("r1", "SCDI 3301", "SCDI", 6);
  const start = new Date(Date.now() + 3600000).toISOString();
  const end = new Date(Date.now() + 7200000).toISOString();
  const res = new Reservation("res1", u, r, start, end);
  s.addReservation(res);
  assertEquals("res1", s.findReservationById("res1").id);
});

test("Storage: getRooms returns copy (not same ref)", () => {
  const s = new InMemoryStorage();
  s.addRoom(new Room("r1", "SCDI 3301", "SCDI", 6));
  const a = s.getRooms();
  const b = s.getRooms();
  assertTrue(a !== b);
});


// SERVICE (5 tests)

test("Service: createUser rejects non-scu email", () => {
  const { service } = setupService();
  assertThrows(() => service.createUser(new User("u9", "Bad", "bad@gmail.com")));
});

test("Service: createRoom stores room", () => {
  const { storage, service } = setupService();
  service.createRoom(new Room("r1", "SCDI 3301", "SCDI", 6));
  assertEquals(1, storage.getRooms().length);
});

test("Service: createReservation works", () => {
  const { storage, service } = setupService();
  service.createUser(new User("u1", "Kai Wong", "kwong@scu.edu"));
  service.createRoom(new Room("r1", "SCDI 3301", "SCDI", 6));
  const start = new Date(Date.now() + 3600000).toISOString();
  const end = new Date(Date.now() + 7200000).toISOString();
  service.createReservation("res1", "u1", "r1", start, end);
  assertEquals(1, storage.getReservations().length);
});

test("Service: createReservation blocks conflicts", () => {
  const { service } = setupService();
  service.createUser(new User("u1", "Kai Wong", "kwong@scu.edu"));
  service.createRoom(new Room("r1", "SCDI 3301", "SCDI", 6));

  const start1 = new Date("2030-01-01T10:00:00Z").toISOString();
  const end1 = new Date("2030-01-01T12:00:00Z").toISOString();
  const start2 = new Date("2030-01-01T11:00:00Z").toISOString();
  const end2 = new Date("2030-01-01T13:00:00Z").toISOString();

  service.createReservation("res1", "u1", "r1", start1, end1);
  assertThrows(() => service.createReservation("res2", "u1", "r1", start2, end2));
});

test("Service: cancelReservation changes status", () => {
  const { service } = setupService();
  service.createUser(new User("u1", "Kai Wong", "kwong@scu.edu"));
  service.createRoom(new Room("r1", "SCDI 3301", "SCDI", 6));
  const start = new Date(Date.now() + 3600000).toISOString();
  const end = new Date(Date.now() + 7200000).toISOString();
  service.createReservation("res1", "u1", "r1", start, end);
  const r = service.cancelReservation("res1");
  assertEquals("CANCELLED", r.status);
});

log("---- Done ----");
