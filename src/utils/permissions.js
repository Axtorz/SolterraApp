const { PermissionsBitField } = require('discord.js');

function permissionName(flag) {
  const entry = Object.entries(PermissionsBitField.Flags).find(([, value]) => value === flag);
  const rawName = entry?.[0] ?? String(flag);
  return rawName.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function missingPermissions(permissionSet, required = []) {
  if (!permissionSet) return required;
  return required.filter((permission) => !permissionSet.has(permission));
}

function formatPermissionList(permissions) {
  return permissions.map(permissionName).join(', ');
}

module.exports = { formatPermissionList, missingPermissions, permissionName };
