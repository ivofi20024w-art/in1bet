import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import {
  createPromoCode,
  getPromoCodes,
  getPromoCodeById,
  validatePromoCode,
  usePromoCode,
  updatePromoCode,
  deactivatePromoCode,
  togglePromoCodeStatus,
  getPromoCodeStats,
  getUserPromoCodeHistory,
} from "./promo.service";
import {
  createPromoCodeSchema,
  updatePromoCodeSchema,
  applyPromoCodeSchema,
} from "@shared/schema";

const router = Router();

router.post("/apply", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = applyPromoCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { code, depositAmount } = parsed.data;
    const userId = req.user!.id;

    const result = await usePromoCode(code, userId, depositAmount);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: "Código promocional aplicado com sucesso!",
      bonusAmount: result.bonusAmount,
      rolloverTotal: result.rolloverTotal,
    });
  } catch (error: any) {
    console.error("Apply promo code error:", error);
    res.status(500).json({ error: "Erro ao aplicar código promocional" });
  }
});

router.get("/validate/:code", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const userId = req.user!.id;

    const validation = await validatePromoCode(code, userId);

    if (!validation.valid) {
      return res.status(400).json({ valid: false, error: validation.error });
    }

    const promoCode = validation.promoCode!;

    res.json({
      valid: true,
      code: promoCode.code,
      type: promoCode.type,
      value: parseFloat(promoCode.value),
      description: promoCode.description,
      minDeposit: promoCode.minDeposit ? parseFloat(promoCode.minDeposit) : null,
      rolloverMultiplier: parseFloat(promoCode.rolloverMultiplier),
    });
  } catch (error: any) {
    console.error("Validate promo code error:", error);
    res.status(500).json({ error: "Erro ao validar código promocional" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = await getUserPromoCodeHistory(userId);

    res.json({ history });
  } catch (error: any) {
    console.error("Get promo code history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

export const promoUserRoutes = router;

const adminRouter = Router();

function isAdmin(req: Request): boolean {
  return req.user?.isAdmin === true;
}

adminRouter.get("/", authMiddleware, async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as "active" | "inactive" | "expired" | "all" | undefined;
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;

    const { promoCodes, total } = await getPromoCodes({
      page,
      limit,
      status,
      type,
      search,
    });

    res.json({
      promoCodes: promoCodes.map((p) => ({
        id: p.id,
        code: p.code,
        description: p.description,
        type: p.type,
        value: parseFloat(p.value),
        minDeposit: p.minDeposit ? parseFloat(p.minDeposit) : null,
        maxUses: p.maxUses,
        maxUsesPerUser: p.maxUsesPerUser,
        usesCount: p.usesCount,
        startsAt: p.startsAt,
        expiresAt: p.expiresAt,
        isActive: p.isActive,
        rolloverMultiplier: parseFloat(p.rolloverMultiplier),
        createdAt: p.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Get promo codes error:", error);
    res.status(500).json({ error: "Erro ao buscar códigos promocionais" });
  }
});

adminRouter.post("/", authMiddleware, async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    const parsed = createPromoCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const result = await createPromoCode(parsed.data, req.user!.id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: "Código promocional criado com sucesso",
      promoCode: result.promoCode,
    });
  } catch (error: any) {
    console.error("Create promo code error:", error);
    res.status(500).json({ error: "Erro ao criar código promocional" });
  }
});

adminRouter.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    const { id } = req.params;
    const parsed = updatePromoCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const result = await updatePromoCode(id, parsed.data);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: "Código promocional atualizado",
      promoCode: result.promoCode,
    });
  } catch (error: any) {
    console.error("Update promo code error:", error);
    res.status(500).json({ error: "Erro ao atualizar código promocional" });
  }
});

adminRouter.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    const { id } = req.params;
    const result = await deactivatePromoCode(id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: "Código promocional desativado" });
  } catch (error: any) {
    console.error("Deactivate promo code error:", error);
    res.status(500).json({ error: "Erro ao desativar código promocional" });
  }
});

adminRouter.post("/:id/toggle", authMiddleware, async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    const { id } = req.params;
    const result = await togglePromoCodeStatus(id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: result.promoCode?.isActive ? "Código ativado" : "Código desativado",
      promoCode: result.promoCode,
    });
  } catch (error: any) {
    console.error("Toggle promo code error:", error);
    res.status(500).json({ error: "Erro ao alterar status" });
  }
});

adminRouter.get("/:id/stats", authMiddleware, async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    const { id } = req.params;
    const promoCode = await getPromoCodeById(id);

    if (!promoCode) {
      return res.status(404).json({ error: "Código não encontrado" });
    }

    const stats = await getPromoCodeStats(id);

    res.json({
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        type: promoCode.type,
        value: parseFloat(promoCode.value),
        isActive: promoCode.isActive,
      },
      stats,
    });
  } catch (error: any) {
    console.error("Get promo code stats error:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

export const promoAdminRoutes = adminRouter;
