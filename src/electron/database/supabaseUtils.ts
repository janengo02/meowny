/**
 * Represents a Supabase query builder that supports pagination.
 * This is a minimal interface that captures the methods we need.
 */
interface PaginatableQueryBuilder {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>;
}

/**
 * Fetches all rows from a Supabase query using pagination to bypass the default row limit.
 * Supabase has a default limit of ~1000 rows per query, so this function automatically
 * fetches all pages until no more data is available.
 */
export async function fetchAllPages<T>(
  queryBuilder: PaginatableQueryBuilder,
  pageSize: number = 1000,
): Promise<T[]> {
  let allResults: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    // Clone the query and add pagination
    const { data, error } = await queryBuilder.range(
      page * pageSize,
      (page + 1) * pageSize - 1,
    );

    if (error) {
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      allResults = allResults.concat(data as T[]);
      hasMore = data.length === pageSize; // Continue if we got a full page
      page++;
    } else {
      hasMore = false;
    }
  }

  return allResults;
}
