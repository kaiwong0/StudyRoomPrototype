// backend/service.js
import { Reservation } from "./models.js";

export class StudyRoomService {
  constructor(storage) {
    this.storage = storage;
  }

  // ---- Helpers ----
  _requireUser(userId) {
    const u = this.storage.findUserById(userId);
    if (!u) throw new Error("User not found");
    return u;
  }

  _requireRoom(roomId) {
    const r = this.storage.findRoomById(roomId);
    if (!r) throw new Error("Room not found");
    return r;
  }

  _requireReservation(resId) {
    const r = this.storage.findReservationById(resId);
    if (!r) throw new Error("Reservation not found");
    return r;
  }

  _ensureAdmin(user) {
    if (!user?.isAdmin?.()) throw new Error("Admin privileges required");
  }

  createUser(user) {
    if (!user.isValidScuEmail()) throw new Error("Non-SCU email not allowed");
    this.storage.addUser(user);
    return user;
  }

  createRoom(room) {
    this.storage.addRoom(room);
    return room;
  }

  createReservation(resId, userId, roomId, startIso, endIso) {
    const user = this._requireUser(userId);
    const room = this._requireRoom(roomId);

    const newRes = new Reservation(resId, user, room, startIso, endIso);

    const existing = this.storage
      .getReservations()
      .filter(r => r.room.id === roomId && r.status === "ACTIVE");

    for (const r of existing) {
      if (newRes.overlaps(r)) throw new Error("Reservation conflict");
    }

    this.storage.addReservation(newRes);
    return newRes;
  }

  /**
   * Admin-only: reserve a room for a class/public session that students can join.
   * - The reservation is marked public (topicOrClass required)
   * - maxParticipants defaults to room capacity unless overridden
   */
  createPublicClassReservation(resId, adminId, roomId, startIso, endIso, topicOrClass, maxParticipants = null) {
    const admin = this._requireUser(adminId);
    this._ensureAdmin(admin);
    const room = this._requireRoom(roomId);

    const res = this.createReservation(resId, adminId, roomId, startIso, endIso);
    res.makePublic(topicOrClass, maxParticipants);
    return res;
  }

  /** Student: join an ACTIVE public reservation */
  joinPublicReservation(resId, studentId) {
    const student = this._requireUser(studentId);
    const res = this._requireReservation(resId);

    if (!res.isPublic?.()) throw new Error("Reservation is not public");
    if (res.status !== "ACTIVE") throw new Error("Reservation not active");
    res.addParticipant(student);
    return res;
  }

  /** Admin: add a student to a reservation the admin created */
  adminAddStudent(resId, adminId, studentId) {
    const admin = this._requireUser(adminId);
    this._ensureAdmin(admin);
    const student = this._requireUser(studentId);
    const res = this._requireReservation(resId);

    if (res.owner?.id !== admin.id) throw new Error("Only the reservation owner admin can modify participants");
    res.addParticipant(student);
    return res;
  }

  /** Admin: remove a student from a reservation the admin created */
  adminRemoveStudent(resId, adminId, studentId) {
    const admin = this._requireUser(adminId);
    this._ensureAdmin(admin);
    const res = this._requireReservation(resId);

    if (res.owner?.id !== admin.id) throw new Error("Only the reservation owner admin can modify participants");
    res.removeParticipant(studentId);
    return res;
  }

  listPublicReservations() {
    return this.storage
      .getReservations()
      .filter(r => r.status === "ACTIVE" && r.isPublic?.());
  }

  cancelReservation(resId) {
    const r = this._requireReservation(resId);
    r.cancel();
    return r;
  }
}
