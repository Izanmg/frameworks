// services/permissionService.js
// Lògica de permisos efectius amb herència jeràrquica + delegacions

const Role = require("../models/Role");
const User = require("../models/User");
const DelegatedPermission = require("../models/DelegatedPermission");

/**
 * Recorre la jerarquia (rol -> parentRole -> ...) i acumula permisos heretats.
 * Detecta cicles per evitar bucles infinits.
 */
async function getRoleHierarchyPermissions(roleId, visited = new Set()) {
  if (!roleId) return [];
  const id = String(roleId);
  if (visited.has(id)) return [];
  visited.add(id);

  const role = await Role.findById(roleId).populate("permissions");
  if (!role) return [];

  let perms = [...(role.permissions || [])];

  if (role.parentRole) {
    const parentPerms = await getRoleHierarchyPermissions(
      role.parentRole,
      visited
    );
    perms = [...perms, ...parentPerms];
  }

  // Deduplica per nom
  const seen = new Set();
  return perms.filter((p) => {
    if (!p || !p.name) return false;
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

/** Construeix la cadena de rols (root -> ... -> rol) */
async function getRoleChain(roleId) {
  const chain = [];
  const visited = new Set();
  let current = roleId;
  while (current) {
    const id = String(current);
    if (visited.has(id)) break;
    visited.add(id);
    const role = await Role.findById(current).lean();
    if (!role) break;
    chain.push(role);
    current = role.parentRole;
  }
  return chain.reverse();
}

/** Detecta si crear/actualitzar un rol introduiria un cicle */
async function wouldCreateCycle(roleId, parentRoleId) {
  if (!parentRoleId) return false;
  if (String(roleId) === String(parentRoleId)) return true;
  let current = parentRoleId;
  const visited = new Set();
  while (current) {
    const id = String(current);
    if (visited.has(id)) return true;
    visited.add(id);
    if (String(current) === String(roleId)) return true;
    const parent = await Role.findById(current).select("parentRole").lean();
    if (!parent) break;
    current = parent.parentRole;
  }
  return false;
}

/**
 * Permisos efectius d'un usuari = permisos heretats del rol + delegats vigents + assignats directament
 */
async function getEffectivePermissions(userId) {
  const user = await User.findById(userId).populate("permissions");
  if (!user) return [];

  // Permisos del rol (i jerarquia)
  const rolePerms = user.role
    ? await getRoleHierarchyPermissions(user.role)
    : [];

  // Permisos delegats actius
  const delegations = await DelegatedPermission.findActiveForUser(user._id);
  const delegatedPerms = delegations
    .map((d) => d.permission)
    .filter(Boolean);

  // Permisos directes
  const directPerms = (user.permissions || []).filter(Boolean);

  const all = [...rolePerms, ...delegatedPerms, ...directPerms];
  const seen = new Set();
  const unique = [];
  for (const p of all) {
    if (!p || !p.name) continue;
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    unique.push(p);
  }
  return unique;
}

/** Llista de noms de permisos efectius (string[]) */
async function getEffectivePermissionNames(userId) {
  const perms = await getEffectivePermissions(userId);
  return perms.map((p) => p.name);
}

/** Comprova si l'usuari té un permís concret (per nom) */
async function hasPermission(userId, permissionName) {
  const names = await getEffectivePermissionNames(userId);
  return names.includes(permissionName);
}

module.exports = {
  getRoleHierarchyPermissions,
  getRoleChain,
  wouldCreateCycle,
  getEffectivePermissions,
  getEffectivePermissionNames,
  hasPermission,
};
