import { describe, expect, it } from 'vitest';
import {
  ACCESSORIES,
  DEFAULT_AVATAR,
  EYE_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTH_STYLES,
  SKIN_TONES,
  clearCustomAvatar,
  hasCustomAvatar,
  loadCustomAvatar,
  randomDesign,
  saveCustomAvatar,
  validDesign,
  type AvatarDesign,
  type StorageLike,
} from '../lib/kid/avatar-studio';

function fakeStore(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
  };
}

describe('customization model', () => {
  it('has 8 skin tones', () => {
    expect(SKIN_TONES.length).toBe(8);
  });
  it('has 6 eye styles, 6 mouth styles, 6 hair styles, 6 hair colors, 6 accessories', () => {
    expect(EYE_STYLES.length).toBe(6);
    expect(MOUTH_STYLES.length).toBe(6);
    expect(HAIR_STYLES.length).toBe(6);
    expect(HAIR_COLORS.length).toBe(6);
    expect(ACCESSORIES.length).toBe(6);
  });
  it('default avatar is a valid design', () => {
    expect(validDesign(DEFAULT_AVATAR)).toBe(true);
  });
  it('rejects invalid designs', () => {
    expect(validDesign(null)).toBe(false);
    expect(validDesign({})).toBe(false);
    expect(validDesign({ ...DEFAULT_AVATAR, skin: '#BADDAD' })).toBe(false);
    expect(validDesign({ ...DEFAULT_AVATAR, eyes: 'laser' })).toBe(false);
    expect(validDesign({ ...DEFAULT_AVATAR, hair: { style: 'curly', color: 'pink' } })).toBe(false);
    expect(validDesign({ ...DEFAULT_AVATAR, hair: null })).toBe(false);
    expect(validDesign({ ...DEFAULT_AVATAR, accessory: 'jetpack' })).toBe(false);
  });
});

describe('save / load round-trip', () => {
  it('saves and loads a design per child', () => {
    const store = fakeStore();
    const design: AvatarDesign = {
      ...DEFAULT_AVATAR,
      eyes: 'wink',
      hair: { style: 'mohawk', color: '#3B82F6' },
      accessory: 'glasses',
    };
    saveCustomAvatar('kid-1', design, store);
    expect(loadCustomAvatar('kid-1', store)).toEqual(design);
    // namespaced per child
    expect(loadCustomAvatar('kid-2', store)).toBeNull();
  });
  it('hasCustomAvatar reflects saved state', () => {
    const store = fakeStore();
    expect(hasCustomAvatar('kid-1', store)).toBe(false);
    saveCustomAvatar('kid-1', DEFAULT_AVATAR, store);
    expect(hasCustomAvatar('kid-1', store)).toBe(true);
  });
  it('clearCustomAvatar forgets the design', () => {
    const store = fakeStore();
    saveCustomAvatar('kid-1', DEFAULT_AVATAR, store);
    clearCustomAvatar('kid-1', store);
    expect(loadCustomAvatar('kid-1', store)).toBeNull();
  });
  it('heals corrupt data: bad JSON', () => {
    const store = fakeStore();
    store.setItem('sky-avatar-kid-1', 'not-json{{{');
    expect(loadCustomAvatar('kid-1', store)).toBeNull();
  });
  it('heals corrupt data: invalid design shape', () => {
    const store = fakeStore();
    store.setItem('sky-avatar-kid-1', JSON.stringify({ skin: 'green', eyes: 42 }));
    expect(loadCustomAvatar('kid-1', store)).toBeNull();
  });
  it('throws when saving an invalid design', () => {
    const store = fakeStore();
    expect(() => saveCustomAvatar('kid-1', { skin: 'x' } as unknown as AvatarDesign, store)).toThrow();
  });
  it('randomDesign always produces a valid design', () => {
    for (let i = 0; i < 50; i++) {
      expect(validDesign(randomDesign())).toBe(true);
    }
  });
});

describe('avatarComponentFor', () => {
  it('returns the preset component when no custom design exists', async () => {
    const { avatarComponentFor } = await import('../components/avatars-custom');
    const { AVATARS } = await import('../components/avatars');
    const store = fakeStore();
    expect(avatarComponentFor('kid-9', 'luna', store)).toBe(AVATARS.luna.Component);
  });
  it('falls back to curio for unknown preset ids', async () => {
    const { avatarComponentFor } = await import('../components/avatars-custom');
    const { AVATARS } = await import('../components/avatars');
    const store = fakeStore();
    expect(avatarComponentFor('kid-9', 'not-a-real-avatar', store)).toBe(AVATARS.curio.Component);
  });
  it('returns a custom renderer when a design is saved', async () => {
    const { avatarComponentFor } = await import('../components/avatars-custom');
    const { AVATARS } = await import('../components/avatars');
    const store = fakeStore();
    saveCustomAvatar('kid-9', { ...DEFAULT_AVATAR, eyes: 'starry' }, store);
    const C = avatarComponentFor('kid-9', 'luna', store);
    expect(C).not.toBe(AVATARS.luna.Component);
  });
});

describe('CustomAvatar rendering', () => {
  it('renders valid SVG for the default and random designs', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { default: CustomAvatar } = await import('../components/avatars-custom');
    const html = renderToStaticMarkup(
      React.createElement(CustomAvatar, { design: DEFAULT_AVATAR, className: 'h-10 w-10' })
    );
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 96 96"');
    for (let i = 0; i < 30; i++) {
      const h = renderToStaticMarkup(React.createElement(CustomAvatar, { design: randomDesign() }));
      expect(h).toContain('<svg');
      expect(h.length).toBeGreaterThan(500);
    }
  });
});

describe('content hygiene', () => {
  it('has no emoji in option labels', async () => {
    const fs = await import('node:fs');
    const src = [
      fs.readFileSync('lib/kid/avatar-studio.ts', 'utf8'),
      fs.readFileSync('components/kid/avatar-studio.tsx', 'utf8'),
      fs.readFileSync('components/avatars-custom.tsx', 'utf8'),
    ].join('\n');
    // eslint-disable-next-line no-control-regex
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(src)).toBe(false);
  });
});
