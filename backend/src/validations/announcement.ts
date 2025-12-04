import { z } from 'zod';

/**
 * Phase 7: Announcement Validation Schemas
 */

// Enum values
const announcementPriority = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
const announcementTarget = z.enum(['ALL', 'CLASS', 'SUBJECT']);

/**
 * Create announcement schema
 */
export const createAnnouncementSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  content: z.string()
    .min(1, 'Content is required'),
  priority: announcementPriority.default('NORMAL'),
  targetType: announcementTarget.default('ALL'),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  isPinned: z.boolean().default(false),
}).refine(
  (data) => {
    // If targetType is CLASS, classId is required
    if (data.targetType === 'CLASS' && !data.classId) {
      return false;
    }
    // If targetType is SUBJECT, subjectId is required
    if (data.targetType === 'SUBJECT' && !data.subjectId) {
      return false;
    }
    return true;
  },
  {
    message: 'classId is required when targetType is CLASS, subjectId is required when targetType is SUBJECT',
    path: ['targetType']
  }
);

/**
 * Update announcement schema
 */
export const updateAnnouncementSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  content: z.string()
    .min(1, 'Content is required')
    .optional(),
  priority: announcementPriority.optional(),
  isPinned: z.boolean().optional(),
});

/**
 * Get announcements query params
 */
export const getAnnouncementsQuerySchema = z.object({
  targetType: announcementTarget.optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  priority: announcementPriority.optional(),
  unreadOnly: z.string().optional().transform((val) => val === 'true'),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type GetAnnouncementsQuery = z.infer<typeof getAnnouncementsQuerySchema>;
