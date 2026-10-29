import {
  aiRuntimeConnectionBindingSchema,
  type AiRuntimeConnectionBinding,
} from "@paperclipai/shared";

/**
 * Compares managed bindings after validating both sides. PostgreSQL jsonb does
 * not preserve object key insertion order, so comparing a parsed request to
 * the raw persisted value can turn an unrelated agent edit into a credential
 * revalidation.
 */
export function hasManagedAiBindingChanged(
  previous: unknown,
  next: AiRuntimeConnectionBinding,
): boolean {
  const previousBinding = aiRuntimeConnectionBindingSchema.safeParse(previous).data;
  const nextBinding = aiRuntimeConnectionBindingSchema.safeParse(next).data;
  return !previousBinding || !nextBinding || JSON.stringify(previousBinding) !== JSON.stringify(nextBinding);
}

/** Compare model/harness selection after callers apply the same adapter defaults.
 * Other config changes (instructions, turn limits, env) do not change identity.
 */
export function hasManagedAiSelectionChanged(
  previousAdapterType: string,
  previousConfig: Record<string, unknown>,
  nextAdapterType: string,
  nextConfig: Record<string, unknown>,
): boolean {
  const text = (value: unknown) => typeof value === "string" ? value : null;
  const selection = (adapterType: string, config: Record<string, unknown>) => {
    const provider = adapterType === "paperclip_runner" ? text(config.provider) : null;
    return [adapterType, text(config.model), provider, provider === "acpx" ? text(config.acpxAgent) : null];
  };
  return JSON.stringify(selection(previousAdapterType, previousConfig))
    !== JSON.stringify(selection(nextAdapterType, nextConfig));
}
