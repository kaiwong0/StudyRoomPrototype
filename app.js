// Get currently logged in user from localStorage
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Security check: only students can access this page
if (!currentUser || currentUser.role !== "STUDENT") {
  window.location.href = "./login.html";
}

// Load reservations from localStorage or initialize empty array
let reservations = JSON.parse(localStorage.getItem("reservations")) || [];

// Save reservations to localStorage
function save() {
  localStorage.setItem("reservations", JSON.stringify(reservations));
}

// Reset demo data and reload page
function resetDemo() {
  localStorage.clear();
  location.reload();
}

// Retrieve stored notification messages
function getNotificationStore() {
  return JSON.parse(localStorage.getItem("reservationNotifications")) || {};
}

// Save notification store
function saveNotificationStore(store) {
  localStorage.setItem("reservationNotifications", JSON.stringify(store));
}

// Show notifications to the currently logged in student
function showStudentNotifications() {
  const banner = document.getElementById("notification");
  if (!banner) return;

  const store = getNotificationStore();
  const myNotifications = store[myEmail] || [];

  if (!myNotifications.length) {
    banner.style.display = "none";
    banner.innerHTML = "";
    return;
  }

  banner.style.display = "block";
  banner.innerHTML = myNotifications.map(msg => `<div>${msg}</div>`).join("");

  // Remove notifications after displaying them
  delete store[myEmail];
  saveNotificationStore(store);
}

// Autofill logged-in student information
document.getElementById("name").value = currentUser.name;
document.getElementById("email").value = currentUser.email;

// Prevent editing name and email fields
document.getElementById("name").disabled = true;
document.getElementById("email").disabled = true;

// Normalize student email for comparisons
const myEmail = currentUser.email.trim().toLowerCase();

// Convert time input like "4:00PM" into minutes for comparison
function parseTime(t) {
  const m = t.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);

  if (!m) throw new Error("Use format 4:00PM");

  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p = m[3].toUpperCase();

  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;

  return h * 60 + min;
}

// Event handler: student creates a reservation
document.getElementById("createBtn").onclick = function () {
  try {
    document.getElementById("error").textContent = "";
    document.getElementById("message").textContent = "";

    const date = document.getElementById("date").value;
    const room = document.getElementById("room").value;
    const start = document.getElementById("start").value.trim();
    const end = document.getElementById("end").value.trim();
    const visibility = document.getElementById("visibility").value;

    // Validate required inputs
    if (!date || !start || !end) {
      throw new Error("All fields required");
    }

    const s = parseTime(start);
    const e = parseTime(end);

    // Validate time range
    if (e <= s) {
      throw new Error("End must be after start");
    }

    // Limit student reservations to 4 hours
    if ((e - s) / 60 > 4) {
      throw new Error("Student max reservation is 4 hours");
    }

    // Check for room conflicts
    const conflict = reservations.find(r => {
      if (r.room !== room || r.date !== date) return false;

      try {
        const rs = parseTime(r.start);
        const re = parseTime(r.end);

        return !(re <= s || rs >= e);
      } catch {
        return false;
      }
    });

    if (conflict) {
      throw new Error("This room is already booked");
    }

    // Create new reservation object
    const res = {
      id: "student_" + Date.now(),
      name: currentUser.name,
      email: currentUser.email,
      room,
      date,
      start,
      end,
      visibility,
      participants: visibility === "public" ? [currentUser.email] : []
    };

    reservations.push(res);

    save();
    render();

    document.getElementById("message").textContent = "Reservation created";
  } catch (e) {
    document.getElementById("error").textContent = e.message;
  }
};

// Student joins a public reservation
function joinReservation(id) {
  const r = reservations.find(x => x.id === id);

  if (!r) return;

  if (!Array.isArray(r.participants)) {
    r.participants = [];
  }

  // Limit public reservations to 4 participants
  if (r.participants.length >= 4) {
    alert("Room full");
    return;
  }

  // Prevent joining if student already has a reservation at that time
  const overlap = reservations.find(x => {
    const isMinePrivate =
      x.email &&
      x.email.trim().toLowerCase() === myEmail;

    const isMineAdminClass =
      Array.isArray(x.students) &&
      x.students.some(s =>
        s.email &&
        s.email.trim().toLowerCase() === myEmail
      );

    const isMinePublicJoin =
      Array.isArray(x.participants) &&
      x.participants.includes(currentUser.email);

    if (!(isMinePrivate || isMineAdminClass || isMinePublicJoin)) return false;

    if (x.date !== r.date) return false;

    try {
      return !(
        parseTime(x.end) <= parseTime(r.start) ||
        parseTime(x.start) >= parseTime(r.end)
      );
    } catch {
      return false;
    }
  });

  if (overlap) {
    alert("You already have a reservation at that time");
    return;
  }

  if (!r.participants.includes(currentUser.email)) {
    r.participants.push(currentUser.email);
  }

  save();
  render();
}

// Student leaves a public reservation
function leaveReservation(id) {
  const r = reservations.find(x => x.id === id);

  if (!r || !Array.isArray(r.participants)) return;

  r.participants = r.participants.filter(p => p !== currentUser.email);

  save();
  render();
}

// Student cancels their own reservation
function cancel(id) {
  reservations = reservations.filter(r => r.id !== id);

  save();
  render();
}

// Render reservations visible to the current student
function render() {
  const c = document.getElementById("reservationList");

  c.innerHTML = "";

  let shown = false;

  reservations.forEach(r => {
    const div = document.createElement("div");

    const isMyPrivate =
      r.email &&
      r.email.trim().toLowerCase() === myEmail;

    const isMyAdminClass =
      Array.isArray(r.students) &&
      r.students.some(s =>
        s.email &&
        s.email.trim().toLowerCase() === myEmail
      );

    const isJoinedPublic =
      r.visibility === "public" &&
      Array.isArray(r.participants) &&
      r.participants.includes(currentUser.email);

    const canJoinPublic =
      r.visibility === "public" &&
      Array.isArray(r.participants) &&
      !r.participants.includes(currentUser.email);

    // Display private reservations created by the student
    if (isMyPrivate) {
      div.innerHTML = `
      <strong>${r.name}</strong> | ${r.room} | ${r.date} | ${r.start}-${r.end}
      <button onclick="cancel('${r.id}')">Cancel</button>
      <hr>
      `;

      c.appendChild(div);

      shown = true;

      return;
    }

    // Display admin class reservations the student is part of
    if (isMyAdminClass) {
      div.innerHTML = `
      <strong>${r.className}</strong> | ${r.room} | ${r.date} | ${r.start}-${r.end}
      <br><em>Class Reservation</em>
      <hr>
      `;

      c.appendChild(div);

      shown = true;

      return;
    }

    // Display public reservations student joined
    if (isJoinedPublic) {
      div.innerHTML = `
      <strong>Public Study</strong> | ${r.room} | ${r.date} | ${r.start}-${r.end}
      <br>Participants ${r.participants.length}/4
      <button onclick="leaveReservation('${r.id}')">Leave</button>
      <hr>
      `;

      c.appendChild(div);

      shown = true;

      return;
    }

    // Display public reservations student can join
    if (canJoinPublic) {
      div.innerHTML = `
      <strong>Public Study</strong> | ${r.room} | ${r.date} | ${r.start}-${r.end}
      <br>Participants ${r.participants.length}/4
      <button onclick="joinReservation('${r.id}')">Join</button>
      <hr>
      `;

      c.appendChild(div);

      shown = true;
    }
  });

  if (!shown) {
    c.innerHTML = "<p>No reservations yet.</p>";
  }
}

// Show notifications and render reservations on page load
showStudentNotifications();
render();