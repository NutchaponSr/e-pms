export enum Rank {
  PRESIDENT = "President",
  MD = "MD",
  VP = "VP",
  CHIEF = "Chief",
  FOREMAN = "Foreman",
  GM = "GM",
  MGR = "MGR",
  AGM = "AGM",
  SMGR = "SMGR",
  OFFICER = "Officer",
  STAFF = "Staff",
  WORKER = "Worker",
}

export const managerUp = [Rank.PRESIDENT, Rank.MD, Rank.VP, Rank.GM, Rank.MGR, Rank.AGM, Rank.SMGR];
export const chiefDown = [Rank.FOREMAN, Rank.STAFF, Rank.WORKER, Rank.OFFICER];