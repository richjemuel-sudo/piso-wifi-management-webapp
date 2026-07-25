import { Router } from "express";
import {
  getPortalState, postClaim, postDonePaying, postRedeem,
  postPause, postResume, getRates, postCoin,
} from "./portal.controller";
import { requireDevice } from "../../middleware/requireDevice";

export const portalRoutes = Router();

// Customer-facing — unauthenticated by definition. Identity comes from
// MikroTik's host table, so there's nothing for the browser to spoof.
portalRoutes.get("/state", getPortalState);
portalRoutes.get("/rates", getRates);
portalRoutes.post("/claim", postClaim);
portalRoutes.post("/done-paying", postDonePaying);
portalRoutes.post("/redeem", postRedeem);
portalRoutes.post("/pause", postPause);
portalRoutes.post("/resume", postResume);

// Vendo-facing.
portalRoutes.post("/coin", requireDevice, postCoin);
