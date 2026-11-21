import { TaskStep } from '../../types/agents';
export function needsApproval(step: TaskStep & { requiresConfirmation?: boolean }, state: any): boolean {
  if (step.requiresConfirmation) return true;
  if (!['click', 'trustedClick', 'sendKeys', 'selectDropdownOption'].includes(step.type)) return false;
  const element = state.elements?.find((item: any) => item.index === step.elementIndex);
  if (['click', 'trustedClick'].includes(step.type) && (element?.submitControl || element?.form && element?.type === 'submit')) return true;
  if (step.type === 'sendKeys' && step.data?.keys === 'Enter' && element?.tag !== 'textarea') return true;
  return /\b(submit|send|purchase|buy|pay|checkout|place order|delete|remove|publish|post|confirm booking|transfer|unsubscribe)\b/i.test([step.description, element?.label, element?.text].join(' '));
}
