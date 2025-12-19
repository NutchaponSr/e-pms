import { atom, useAtom } from "jotai"

export const weightAtom = atom<number>(0);

export const useWeight = () => {
  const [weight, setWeight] = useAtom(weightAtom);
  
  return { weight, setWeight };
};