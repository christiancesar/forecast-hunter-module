import { BudgetItemsDTO } from "./BudgetItemsDTO";
import { CostDTO } from "./CostDTO";

export type BudgetDTO = {
  shortId: number;
  license: number;
  customer: {
    name: string;
    phones: string[];
    email: string;
    address: {
      street: string;
      number: number;
      neighborhood: string;
      city: string;
      state: string;
    };
  };
  items: BudgetItemsDTO[];
  billedAt: Date | null;
  soldAt: Date | null;
  registeredAt: Date | null;
  amount: number;
  status_budget: string;
  status_producer: string;
  salesman: string;
  costs?: CostDTO;
};
