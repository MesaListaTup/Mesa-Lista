// Roles que pueden entrar al panel administrativo (/admin).
// Es la única fuente de verdad: la usan el middleware, el layout del panel y el navbar.
// Si el local quiere que el staff también entre al panel, agregá 'staff' acá.
export const ROLES_PANEL = ['admin'];

export const puedeVerPanel = (rol) => ROLES_PANEL.includes(rol);
