import { z } from 'zod';
import { ListingCategory, ListingStatus } from '../../domain/enums/ListingStatus.js';

export const CreateListingSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters' })
    .max(200, { message: 'Title cannot exceed 200 characters' }),
  description: z.string().max(2000).optional(),
  price: z
    .number()
    .int({ message: 'Price must be an integer in paise' })
    .positive({ message: 'Price must be greater than zero' }),
  category: z
    .enum(
      [
        ListingCategory.GAMING_ACCOUNT,
        ListingCategory.API_KEY,
        ListingCategory.SOCIAL_MEDIA_HANDLE,
        ListingCategory.DIGITAL_LICENSE,
        ListingCategory.DOMAIN_NAME,
        ListingCategory.OTHER,
      ],
      { message: 'Invalid listing category' },
    )
    .optional(),
  insuranceOpted: z.boolean().optional(),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

export const SubmitDeliverySchema = z.object({
  credentialsOrPayload: z
    .string()
    .min(1, { message: 'Delivery credentials or payload cannot be empty' }),
  instructions: z.string().max(1000).optional(),
});

export type SubmitDeliveryInput = z.infer<typeof SubmitDeliverySchema>;

export const ListingFilterQuerySchema = z.object({
  category: z
    .enum([
      ListingCategory.GAMING_ACCOUNT,
      ListingCategory.API_KEY,
      ListingCategory.SOCIAL_MEDIA_HANDLE,
      ListingCategory.DIGITAL_LICENSE,
      ListingCategory.DOMAIN_NAME,
      ListingCategory.OTHER,
    ])
    .optional(),
  status: z
    .enum([
      ListingStatus.DRAFT,
      ListingStatus.ACTIVE,
      ListingStatus.SOLD,
      ListingStatus.SUSPENDED,
      ListingStatus.CANCELLED,
    ])
    .optional(),
  sellerId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListingFilterQuery = z.infer<typeof ListingFilterQuerySchema>;

export const ListingIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Listing ID is required' }),
});

export type ListingIdParam = z.infer<typeof ListingIdParamSchema>;
