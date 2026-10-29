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
