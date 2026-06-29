// backend/models.js

export class User {
    constructor(id, name, email, role = "STUDENT") {
      if (!id) throw new Error("User id required");
      if (!name) throw new Error("User name required");
      if (!email) throw new Error("User email required");
  
      this.id = id;
      this.name = name;
      this.email = email;
      this.role = role;
    }
  
    getId() { return this.id; }
    getName() { return this.name; }
    getEmail() { return this.email; }
    getRole() { return this.role; }
  
    isValidScuEmail() {
      return typeof this.email === "string" && this.email.toLowerCase().endsWith("@scu.edu");
    }
  
    isAdmin() {
      return String(this.role).toUpperCase() === "ADMIN";
    }
  }
  
  export class Room {
    constructor(id, name, building, capacity) {
      if (!id) throw new Error("Room id required");
      if (!name) throw new Error("Room name required");
      if (!building) throw new Error("Room building required");
      if (typeof capacity !== "number" || capacity <= 0) throw new Error("Room capacity must be > 0");
  
      this.id = id;
      this.name = name;
      this.building = building;
      this.capacity = capacity;
      this.features = [];
    }
  
    getId() { return this.id; }
    getName() { return this.name; }
    getBuilding() { return this.building; }
    getCapacity() { return this.capacity; }
  
    addFeature(feature) {
      if (!feature || !String(feature).trim()) throw new Error("Feature cannot be empty");
      const f = String(feature).trim();
      if (!this.features.includes(f)) this.features.push(f);
    }
  
    getFeatures() { return [...this.features]; }
  
    hasFeature(feature) {
      if (!feature) return false;
      return this.features.includes(String(feature).trim());
    }
  }
  
  export class Reservation {
    constructor(id, user, room, startIso, endIso) {
      if (!id) throw new Error("Reservation id required");
      if (!user) throw new Error("Reservation user required");
      if (!room) throw new Error("Reservation room required");
      if (!startIso || !endIso) throw new Error("Reservation start/end required");
  
      const start = new Date(startIso);
      const end = new Date(endIso);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error("Invalid date");
      if (end.getTime() <= start.getTime()) throw new Error("End must be after start");
  
      this.id = id;
      // Back-compat: "user" is the reservation owner/creator.
      this.user = user;
      this.owner = user;
      this.room = room;
      this.start = start.toISOString();
      this.end = end.toISOString();
      this.status = "ACTIVE";

      // Public/class reservation fields (optional)
      this.public = false;
      this.topicOrClass = "";

      // Participants: by default the owner is the only participant
      this.participants = [user];
      // Defaults to room capacity unless overridden
      this.maxParticipants = room?.capacity ?? 1;
    }
  
    getStatus() { return this.status; }
    getRoom() { return this.room; }
    getOwner() { return this.owner; }

    isPublic() { return this.public === true; }
    getTopicOrClass() { return this.topicOrClass; }
    getParticipants() { return [...this.participants]; }
    getMaxParticipants() { return this.maxParticipants; }
  
    cancel() { this.status = "CANCELLED"; }

    makePublic(topicOrClass, maxParticipants = null) {
      const t = String(topicOrClass ?? "").trim();
      if (!t) throw new Error("Topic/class required for public reservation");
      this.public = true;
      this.topicOrClass = t;

      if (maxParticipants != null) {
        const n = Number(maxParticipants);
        if (!Number.isFinite(n) || n <= 0) throw new Error("maxParticipants must be > 0");
        // Can't exceed physical room capacity
        this.maxParticipants = Math.min(n, this.room.capacity);
      }
    }

    isFull() {
      return this.participants.length >= this.maxParticipants;
    }

    addParticipant(user) {
      if (!user) throw new Error("User required");
      if (this.status !== "ACTIVE") throw new Error("Reservation not active");
      if (this.isFull()) throw new Error("Reservation is full");
      if (this.participants.some(u => u.id === user.id)) return; // idempotent
      this.participants.push(user);
    }

    removeParticipant(userId) {
      const id = String(userId ?? "").trim();
      if (!id) throw new Error("User id required");
      // Do not allow removing the owner via this method.
      if (this.owner?.id === id) throw new Error("Cannot remove reservation owner");
      this.participants = this.participants.filter(u => u.id !== id);
    }
  
    overlaps(other) {
      // Touching edge is NOT overlap
      const aStart = new Date(this.start).getTime();
      const aEnd = new Date(this.end).getTime();
      const bStart = new Date(other.start).getTime();
      const bEnd = new Date(other.end).getTime();
      return aStart < bEnd && aEnd > bStart;
    }
  }
  