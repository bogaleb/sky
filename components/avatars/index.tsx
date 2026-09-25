import Curio from './curio';
import Nova from './nova';
import Luna from './luna';
import Milo from './milo';
import Bea from './bea';
import Tuno from './tuno';
import Riff from './riff';
import Atlas from './atlas';

export const AVATARS: Record<string, { name: string; Component: (props: { className?: string }) => React.JSX.Element }> = {
  curio: { name: 'Curio', Component: Curio },
  nova: { name: 'Nova', Component: Nova },
  luna: { name: 'Luna', Component: Luna },
  milo: { name: 'Milo', Component: Milo },
  bea: { name: 'Bea', Component: Bea },
  tuno: { name: 'Tuno', Component: Tuno },
  riff: { name: 'Riff', Component: Riff },
  atlas: { name: 'Atlas', Component: Atlas },
};
export const AVATAR_IDS = Object.keys(AVATARS);
