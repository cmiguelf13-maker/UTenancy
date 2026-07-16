/**
 * Platform launch flags.
 *
 * FREE_MODE — when true, the entire landlord paid model is bypassed:
 *   • per-plan listing limits are removed (unlimited listings for everyone)
 *   • all premium features (analytics, households, API access) are unlocked
 *   • pricing / upgrade / billing UI is hidden
 *
 * The paid infrastructure (Stripe endpoints, subscription tiers, FeatureGate)
 * stays fully intact — flip this back to `false` to restore the paid model
 * exactly as it was, with no code changes required.
 */
export const FREE_MODE = true

// free-mode launch active
