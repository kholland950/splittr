// src/collision.js — Pure collision detection functions

export function aabbOverlap(a, b) {
  return a.left < b.right && a.right > b.left &&
         a.top < b.bottom && a.bottom > b.top;
}

export function tipHitsBox(tri, box) {
  return tri.tipX >= box.left && tri.tipX <= box.right &&
         tri.tipY >= box.top && tri.tipY <= box.bottom;
}

export function edgeContact(triCenterX, boxCenterX) {
  return triCenterX < boxCenterX ? 'left' : 'right';
}

export function boxOverlap(a, b) {
  if (!aabbOverlap(a, b)) return null;
  const overlapLeft = a.right - b.left;
  const overlapRight = b.right - a.left;
  const overlap = Math.min(overlapLeft, overlapRight);
  const aCenterX = (a.left + a.right) / 2;
  const bCenterX = (b.left + b.right) / 2;
  return { overlap, aIsLeft: aCenterX < bCenterX };
}
