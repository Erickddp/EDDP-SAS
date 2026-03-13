export interface AvatarOption {
  id: string;
  label: string;
  src: string;
}

export const USER_AVATAR_OPTIONS: AvatarOption[] = [
  { id: "ocean", label: "Oceano", src: "/avatars/avatar-ocean.svg" },
  { id: "sunset", label: "Atardecer", src: "/avatars/avatar-sunset.svg" },
  { id: "forest", label: "Bosque", src: "/avatars/avatar-forest.svg" },
  { id: "violet", label: "Violeta", src: "/avatars/avatar-violet.svg" },
  { id: "amber", label: "Ambar", src: "/avatars/avatar-amber.svg" },
  { id: "slate", label: "Slate", src: "/avatars/avatar-slate.svg" },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getRandomAvatar(seed?: string): string {
  if (USER_AVATAR_OPTIONS.length === 0) return "/icono.png";
  const source = seed && seed.trim().length > 0 ? seed : `${Date.now()}-${Math.random()}`;
  const index = hashSeed(source) % USER_AVATAR_OPTIONS.length;
  return USER_AVATAR_OPTIONS[index].src;
}

export function isAllowedAvatar(avatarUrl: string): boolean {
  return USER_AVATAR_OPTIONS.some((option) => option.src === avatarUrl);
}

export function resolveEffectiveAvatar(payload: {
  avatarUrl?: string | null;
  googleAvatarUrl?: string | null;
  seed?: string;
}): string {
  if (payload.googleAvatarUrl && payload.googleAvatarUrl.trim().length > 0) {
    return payload.googleAvatarUrl;
  }

  if (payload.avatarUrl && isAllowedAvatar(payload.avatarUrl)) {
    return payload.avatarUrl;
  }

  return getRandomAvatar(payload.seed);
}
