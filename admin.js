// Get the currently logged in user from localStorage
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Security check: only admins are allowed to access this page
if (!currentUser || currentUser.role !== "ADMIN") {
  window.location.href = "./login.html";
}

// Load reservations from localStorage or initialize empty list
let reservations = JSON.parse(localStorage.getItem("reservations")) || [];

// Hardcoded student database used for validation when adding students
const STUDENTS = [
{name:"Risha Desai",email:"rsdesai@scu.edu"},
{name:"Tess Wei",email:"twei@scu.edu"},
{name:"Alex Chen",email:"achen@scu.edu"},
{name:"Kai Wong",email:"kwong@scu.edu"},
{name:"Maria Lopez",email:"mlopez@scu.edu"},
{name:"David Kim",email:"dkim@scu.edu"},
{name:"Emily Zhang",email:"ezhang@scu.edu"},
{name:"Ryan Patel",email:"rpatel@scu.edu"},
{name:"Sophia Park",email:"spark@scu.edu"},
{name:"Lucas Brown",email:"lbrown@scu.edu"}
];

// Save reservations back to localStorage
function save() {
  localStorage.setItem("reservations", JSON.stringify(reservations));
}

// Retrieve notification store used to notify students when reservations change
function getNotificationStore() {
  return JSON.parse(localStorage.getItem("reservationNotifications")) || {};
}

// Save updated notification store
function saveNotificationStore(store) {
  localStorage.setItem("reservationNotifications", JSON.stringify(store));
}

// Add a notification message for a specific student email
function addNotification(email, message) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return;

  const store = getNotificationStore();
  if (!Array.isArray(store[normalized])) {
    store[normalized] = [];
  }
  store[normalized].push(message);
  saveNotificationStore(store);
}

// Notify all students when their reservation gets overridden by an admin class
function notifyCancelledReservation(reservation, className) {
  const notifiedEmails = new Set();

  if (reservation.email) {
    notifiedEmails.add(reservation.email.trim().toLowerCase());
  }

  if (Array.isArray(reservation.participants)) {
    reservation.participants.forEach(email => {
      if (email) notifiedEmails.add(String(email).trim().toLowerCase());
    });
  }

  const message = `Your reservation for ${reservation.room} on ${reservation.date} from ${reservation.start} to ${reservation.end} was cancelled because an admin created the \"${className}\" reservation for that time.`;

  notifiedEmails.forEach(email => addNotification(email, message));
}

// Convert time input like "4:00PM" into minutes for comparison
function parseTime(input) {
  const match = input.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);

  if (!match) throw new Error("Time must be like 4:00PM");

  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

// Event handler: admin creates a new class reservation
document.getElementById("createAdminRes").onclick = function () {
  try {
    document.getElementById("error").textContent = "";
    document.getElementById("message").textContent = "";

    const className = document.getElementById("className").value.trim();
    const room = document.getElementById("room").value;
    const date = document.getElementById("date").value;
    const start = document.getElementById("start").value.trim();
    const end = document.getElementById("end").value.trim();

    // Validate required fields
    if (!className || !date || !start || !end) {
      throw new Error("All fields required");
    }

    const s = parseTime(start);
    const e = parseTime(end);

    // Validate time range
    if (e <= s) {
      throw new Error("End must be after start");
    }

    // Detect overlapping reservations for the same room/date
    const conflicts = reservations.filter(r => {
      if (r.room !== room || r.date !== date) return false;

      try {
        const rs = parseTime(r.start);
        const re = parseTime(r.end);
        return !(re <= s || rs >= e);
      } catch {
        return false;
      }
    });

    // Prevent overlapping admin reservations
    const blockingAdminConflict = conflicts.find(r => r.owner || r.className);

    if (blockingAdminConflict) {
      throw new Error("Another admin reservation already exists during that time");
    }

    // Student reservations that will be overridden
    const overriddenStudentReservations = conflicts.filter(r => r.email);

    // Notify affected students
    overriddenStudentReservations.forEach(r => notifyCancelledReservation(r, className));

    // Remove overridden student reservations
    reservations = reservations.filter(r => !overriddenStudentReservations.some(x => x.id === r.id));

    // Create new admin reservation object
    const newRes = {
      id: "admin_" + Date.now(),
      owner: currentUser.email,
      className,
      room,
      date,
      start,
      end,
      students: []
    };

    reservations.push(newRes);

    save();
    render();

    // Display confirmation message
    if (overriddenStudentReservations.length > 0) {
      document.getElementById("message").textContent = `Admin reservation created. ${overriddenStudentReservations.length} student reservation(s) were overridden and notified.`;
    } else {
      document.getElementById("message").textContent = "Reservation created";
    }
  } catch (e) {
    document.getElementById("error").textContent = e.message;
  }
};

// Event handler: admin adds a student to a reservation
document.getElementById("addStudent").onclick = function () {
  try {
    document.getElementById("error").textContent = "";
    document.getElementById("message").textContent = "";

    const resId = document.getElementById("resId").value.trim();
    const name = document.getElementById("studentName").value.trim();
    const email = document.getElementById("studentEmail").value.trim().toLowerCase();

    // Validate student exists in database
    const valid = STUDENTS.find(s => s.name === name && s.email === email);

    if (!valid) {
      throw new Error("Student not found in database");
    }

    const res = reservations.find(r => r.id === resId);

    if (!res) {
      throw new Error("Reservation not found");
    }

    // Prevent duplicate students in reservation
    if (res.students.some(s => s.email === email)) {
      throw new Error("Student is already in this reservation");
    }

    res.students.push({ name, email });

    save();
    render();

    document.getElementById("message").textContent = "Student added to reservation";
  } catch (e) {
    document.getElementById("error").textContent = e.message;
  }
};

// Event handler: admin removes a student from a reservation
document.getElementById("removeStudent").onclick = function () {
  try {
    document.getElementById("error").textContent = "";
    document.getElementById("message").textContent = "";

    const resId = document.getElementById("resId").value.trim();
    const email = document.getElementById("studentEmail").value.trim().toLowerCase();

    const res = reservations.find(r => r.id === resId);

    if (!res) {
      throw new Error("Reservation not found");
    }

    // Remove student from reservation
    res.students = res.students.filter(s => s.email !== email);

    save();
    render();

    document.getElementById("message").textContent = "Student removed from reservation";
  } catch (e) {
    document.getElementById("error").textContent = e.message;
  }
};

// Render reservations created by this admin
function render() {
  const list = document.getElementById("reservationList");
  list.innerHTML = "";

  reservations
    .filter(r => r.owner === currentUser.email)
    .forEach(r => {
      const div = document.createElement("div");

      const students = (r.students || []).map(s => s.name).join(", ");

      div.innerHTML = `
<strong>${r.className}</strong>
<br>${r.room} | ${r.date} | ${r.start}-${r.end}
<br>Students: ${students || "None"}
<br>ID: ${r.id}
<hr>
`;

      list.appendChild(div);
    });
}

// Initial render when page loads
render();