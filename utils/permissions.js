const config = require('../config');
const logger = require('./logger');

const STAFF_ROLES = ['Founder', 'Admin', 'Moderator', 'Helper'];

const isOwner = (userId) => {
  return config.ownerIds.includes(userId);
};

const isStaff = (member) => {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return member.roles.cache.some(role => STAFF_ROLES.includes(role.name));
};

const isAdmin = (member) => {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return member.roles.cache.some(role => ['Founder', 'Admin'].includes(role.name));
};

const isModerator = (member) => {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return member.roles.cache.some(role => ['Founder', 'Admin', 'Moderator'].includes(role.name));
};

const hasRole = (member, roleName) => {
  if (!member) return false;
  return member.roles.cache.some(role => role.name === roleName);
};

const hasDepartmentRole = (member, department) => {
  if (!member) return false;
  const roleMap = {
    politie: 'Politie',
    pompieri: 'Pompieri',
    medic: 'Medic',
    dot: 'DOT',
  };
  return member.roles.cache.some(role => role.name.includes(roleMap[department]));
};

const canModerate = (executor, target) => {
  if (!executor || !target) return false;
  if (isOwner(executor.id)) return true;
  if (executor.roles.highest.position <= target.roles.highest.position) return false;
  return isStaff(executor);
};

const generateId = (prefix = '') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}_${result}` : result;
};

module.exports = {
  STAFF_ROLES,
  isOwner,
  isStaff,
  isAdmin,
  isModerator,
  hasRole,
  hasDepartmentRole,
  canModerate,
  generateId,
};
