import { atom, useAtom } from "jotai";

const saveAtom = atom(false);

export const useSaveForm = () => {
  const [save, setSave] = useAtom(saveAtom);

  return { save, setSave };
}