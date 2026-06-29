// backend/storage.js

export class InMemoryStorage {
    constructor() {
      this.users = [];
      this.rooms = [];
      this.reservations = [];
    }
  
    // Users
    addUser(user) { this.users.push(user); }
    getUsers() { return [...this.users]; }
    findUserById(id) { return this.users.find(u => u.id === id) || null; }
  
    // Rooms
    addRoom(room) { this.rooms.push(room); }
    getRooms() { return [...this.rooms]; }
    findRoomById(id) { return this.rooms.find(r => r.id === id) || null; }
  
    // Reservations
    addReservation(res) { this.reservations.push(res); }
    getReservations() { return [...this.reservations]; }
    findReservationById(id) { return this.reservations.find(r => r.id === id) || null; }
  }
  