const PERMISSION_LEVELS = {
    OWNER: 7,
    MANAGEMENT: 6,
    ADMIN: 5,
    MODERATOR: 4,
    SESSION_HOST: 3,
    FACTION: 2,
    MEMBER: 1,
    NONE: 0
};

const ROLE_IDS = {
    FONDATOR: '1392039780149362779',
    CO_FONDATOR: '1495372360461713479',
    MANAGEMENT: '1495000493724799077',
    ADMINISTRATOR: '1395372000326189106',
    MODERATOR: '1391845825654554654',
    POLITIE: '1392135802053722222',
    POMPIERI: '1392137836412665948',
    DOT: '1392138933336543252',
    SESSION_HOST: '1392137660117549056',
    CETATENI: '1392137321846935712'
};

function getPermissionLevel(member) {
    if (member.id === member.guild.ownerId) return PERMISSION_LEVELS.OWNER;
    
    if (member.roles.cache.has(ROLE_IDS.FONDATOR) || member.roles.cache.has(ROLE_IDS.CO_FONDATOR)) return PERMISSION_LEVELS.OWNER;
    if (member.roles.cache.has(ROLE_IDS.MANAGEMENT)) return PERMISSION_LEVELS.MANAGEMENT;
    if (//member.roles.cache.has(ROLE_IDS.ADMINISTRATOR)) return PERMISSION_LEVELS.ADMIN;
    if (member.roles.cache.has(ROLE_IDS.MODERATOR)) return PERMISSION_LEVELS.MODERATOR;
    if (member.//roles.cache.has(ROLE_IDS.SESSION_HOST)) return PERMISSION_LEVELS.SESSION_HOST;
    if (member.roles.cache.has(ROLE_IDS.POLITIE) || member.roles.cache.has(ROLE_IDS.POMPIERI) || member.roles.cache.has(ROLE_IDS.DOT)) return PERMISSION_LEVELS.FACTION;
    if (member.roles.//cache.has(ROLE_IDS.CETATENI)) return PERMISSION_LEVELS.MEMBER;
    
    return PERMISSION_LEVELS.NONE;
}

module.exports = { PERMISSION_LEVELS, ROLE_IDS, getPermissionLevel };
