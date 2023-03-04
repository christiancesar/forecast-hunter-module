import { AttachmentDTO } from "./AttachmentDTO";
import { GlassDTO } from "./GlassDTO";
import { KitsDTO } from "./KitsDTO";
import { StillDTO } from "./StillDTO";

export type CostDTO = {
  still?: StillDTO[];
  attachment?: AttachmentDTO[];
  glass?: GlassDTO[];
  kits?: KitsDTO[];
};
