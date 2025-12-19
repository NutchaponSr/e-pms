export enum Rank {
  PRESIDENT = "President",
  MD = "MD",
  VP = "VP",
  CHIEF = "Chief",
  FOREMAN = "Foreman",
  GM = "GM",
  MGR = "MGR",
  OFFICER = "Officer",
  STAFF = "Staff",
}

export const managerUp = [Rank.PRESIDENT, Rank.MD, Rank.VP, Rank.GM, Rank.MGR];
export const chiefDown = [Rank.FOREMAN, Rank.STAFF, Rank.OFFICER];