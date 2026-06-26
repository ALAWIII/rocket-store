import { PromotionId, PromotionRuleId } from 'src/modules/shared/domain/ids';
import { PromotionRuleType } from './promotion-rule-type';

export type PromotionRuleProps<T extends Record<string, unknown>> = {
  id: PromotionRuleId;
  promotionId: PromotionId;
  rule: PromotionRuleType<T>;
  createdAt: Date;
};
export type CreatePromotionRuleProps<T extends Record<string, unknown>> = Omit<
  PromotionRuleProps<T>,
  'createdAt'
>;

export class PromotionRule<T extends Record<string, unknown>> {
  private constructor(private readonly props: PromotionRuleProps<T>) {}

  static create<T extends Record<string, unknown>>(
    props: CreatePromotionRuleProps<T>,
  ): PromotionRule<T> {
    return new PromotionRule({
      ...props,
      createdAt: new Date(),
    });
  }

  static restore<T extends Record<string, unknown>>(
    props: PromotionRuleProps<T>,
  ): PromotionRule<T> {
    return new PromotionRule(props);
  }

  get id(): PromotionRuleId {
    return this.props.id;
  }

  get promotionId(): PromotionId {
    return this.props.promotionId;
  }
  get rule(): PromotionRuleType<T> {
    return this.props.rule;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  toJSON() {
    return {
      id: this.id,
      promotionId: this.promotionId,
      ruleType: this.rule.ruleType.toLowerCase(),
      ruleData: this.rule.toJSON(),
      createdAt: this.createdAt,
    };
  }
}
