// Shared socket manager — lets routes emit events without circular deps
let _io = null;
const _userSockets = new Map(); // userId -> Set<socketId>

module.exports = {
  init(io) { _io = io; },
  
  registerSocket(userId, socketId) {
    if (!_userSockets.has(userId)) _userSockets.set(userId, new Set());
    _userSockets.get(userId).add(socketId);
  },

  removeSocket(userId, socketId) {
    const sockets = _userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (!sockets.size) _userSockets.delete(userId);
    }
  },

  emitToUser(targetId, event, data) {
    if (!_io) return;
    _userSockets.get(String(targetId))?.forEach(sid => _io.to(sid).emit(event, data));
  },

  getUserSockets() { return _userSockets; },
};
