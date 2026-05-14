export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export function mapPrismaStatusToUiStatus(prisma: string): PostStatus {
  switch (prisma) {
    case "DRAFT":
      return "draft";
    case "SCHEDULED":
      return "scheduled";
    case "PUBLISHED":
      return "published";
    case "PUBLISHING":
      return "scheduled";
    default:
      return "failed";
  }
}
