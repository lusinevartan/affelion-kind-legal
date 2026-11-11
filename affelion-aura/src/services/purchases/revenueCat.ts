import Purchases, { LOG_LEVEL, PURCHASES_ERROR_CODE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { NO_ENTITLEMENT, PLANS, type Entitlement, type PlanId, type PurchaseProvider } from '../entitlements';

/**
 * Store-backed purchases through RevenueCat. Configure with the public SDK keys
 * (EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY) and an entitlement named "pro" that is
 * attached to the three products in PLANS. Subscription state comes from the store, never from
 * local flags.
 */
export const RC_ENTITLEMENT = 'pro';

function toEntitlement(info: CustomerInfo): Entitlement {
  const ent = info.entitlements.active[RC_ENTITLEMENT];
  if (!ent) return NO_ENTITLEMENT;
  const plan = PLANS.find((p) => ent.productIdentifier.startsWith(p.productId))?.id ?? null;
  const expiresAt = ent.expirationDate ? Date.parse(ent.expirationDate) : null;
  return { isPro: true, plan, expiresAt: expiresAt !== null && Number.isFinite(expiresAt) ? expiresAt : null, source: 'store' };
}

export class RevenueCatPurchaseProvider implements PurchaseProvider {
  readonly name = 'revenuecat';
  private configured = false;

  constructor(private readonly apiKey: string) {}

  private async ensure() {
    if (this.configured) return;
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: this.apiKey });
    this.configured = true;
  }

  async getEntitlement(): Promise<Entitlement> {
    await this.ensure();
    try {
      return toEntitlement(await Purchases.getCustomerInfo());
    } catch {
      return NO_ENTITLEMENT;
    }
  }

  private async findPackage(plan: PlanId): Promise<PurchasesPackage> {
    const productId = PLANS.find((p) => p.id === plan)!.productId;
    const offerings = await Purchases.getOfferings();
    const packages = [...(offerings.current?.availablePackages ?? []), ...Object.values(offerings.all).flatMap((o) => o.availablePackages)];
    const pkg = packages.find((p) => p.product.identifier === productId || p.product.identifier.startsWith(productId));
    if (!pkg) throw new Error(`Product ${productId} is not configured in the store yet.`);
    return pkg;
  }

  async purchase(plan: PlanId): Promise<Entitlement> {
    await this.ensure();
    const pkg = await this.findPackage(plan);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return toEntitlement(customerInfo);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return this.getEntitlement();
      throw e;
    }
  }

  async restore(): Promise<Entitlement> {
    await this.ensure();
    return toEntitlement(await Purchases.restorePurchases());
  }

  async openManageSubscriptions(): Promise<void> {
    await this.ensure();
    await Purchases.showManageSubscriptions();
  }
}
