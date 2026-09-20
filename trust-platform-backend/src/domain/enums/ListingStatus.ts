/** Digital goods listing statuses */
export const ListingStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SOLD: 'SOLD',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
} as const;

export type ListingStatusType = typeof ListingStatus[keyof typeof ListingStatus];

/** Digital goods category types */
export const ListingCategory = {
  GAMING_ACCOUNT: 'GAMING_ACCOUNT',
  API_KEY: 'API_KEY',
  SOCIAL_MEDIA_HANDLE: 'SOCIAL_MEDIA_HANDLE',
  DIGITAL_LICENSE: 'DIGITAL_LICENSE',
  DOMAIN_NAME: 'DOMAIN_NAME',
  OTHER: 'OTHER',
} as const;

export type ListingCategoryType = typeof ListingCategory[keyof typeof ListingCategory];
