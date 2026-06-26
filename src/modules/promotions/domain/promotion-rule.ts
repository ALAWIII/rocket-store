import { PromotionId, PromotionRuleId } from 'src/modules/shared/domain/ids';
import { PromotionRuleType } from './promotion-rule-type';

export type PromotionRuleProps<T> = {
  id: PromotionRuleId;
  promotionId: PromotionId;
  rule: PromotionRuleType<T>;
  createdAt: Date;
};
export type CreatePromotionRuleProps<T> = Omit<
  PromotionRuleProps<T>,
  'createdAt'
>;

export class PromotionRule<T> {
  private constructor(private readonly props: PromotionRuleProps<T>) {}

  static create<T>(props: CreatePromotionRuleProps<T>): PromotionRule<T> {
    return new PromotionRule({
      ...props,
      createdAt: new Date(),
    });
  }

  static restore<T>(props: PromotionRuleProps<T>): PromotionRule<T> {
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
      ruleData: this.rule.data(),
      createdAt: this.createdAt,
    };
  }
}
