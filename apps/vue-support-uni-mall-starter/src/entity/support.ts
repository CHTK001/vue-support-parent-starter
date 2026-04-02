export interface SupportContactEntity {
  id: string;
  type: "phone" | "wechat" | "email";
  label: string;
  value: string;
  description: string;
  actionText: string;
}

export interface SupportFaqEntity {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface SupportCenterEntity {
  serviceHours: string;
  responseSla: string;
  notice: string;
  contacts: SupportContactEntity[];
  faqs: SupportFaqEntity[];
}
