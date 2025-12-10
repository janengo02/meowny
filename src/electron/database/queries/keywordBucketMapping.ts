import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export interface BucketAssignCount {
  bucket_id: number;
  count: number;
}

export interface KeywordBucketMapping {
  id: number;
  user_id: string;
  keyword: string;
  bucket_assign_count: BucketAssignCount[];
  created_at: string;
  updated_at: string;
}

/**
 * Update keyword-bucket mappings based on transaction notes
 * This function is called automatically when a transaction is created
 */
export async function updateKeywordBucketMapping(
  notes: string | null,
  bucketId: number | null,
): Promise<void> {
  if (!notes || !bucketId || notes.trim() === '') {
    return;
  }

  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Process notes as a single keyword, removing all numbers
  const keyword = notes
    .replace(/\d/g, '') // Remove all digits
    .trim();

  // Skip if keyword is empty after removing numbers
  if (keyword === '') {
    return;
  }

  try {
    // Check if keyword already exists
    const { data: existingMapping, error: fetchError } = await supabase
      .from('keyword_bucket_mapping')
      .select('*')
      .eq('user_id', userId)
      .eq('keyword', keyword)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new keywords
      console.error('Error fetching keyword mapping:', fetchError);
      return;
    }

    if (existingMapping) {
      // Update existing keyword mapping
      const bucketAssignCount = existingMapping.bucket_assign_count as BucketAssignCount[];
      const existingBucketIndex = bucketAssignCount.findIndex(
        (item) => item.bucket_id === bucketId,
      );

      let updatedCount: BucketAssignCount[];
      if (existingBucketIndex >= 0) {
        // Increment count for existing bucket
        updatedCount = bucketAssignCount.map((item, index) =>
          index === existingBucketIndex
            ? { ...item, count: item.count + 1 }
            : item,
        );
      } else {
        // Add new bucket to the list
        updatedCount = [...bucketAssignCount, { bucket_id: bucketId, count: 1 }];
      }

      const { error: updateError } = await supabase
        .from('keyword_bucket_mapping')
        .update({
          bucket_assign_count: updatedCount,
        })
        .eq('id', existingMapping.id);

      if (updateError) {
        console.error('Error updating keyword mapping:', updateError);
      }
    } else {
      // Insert new keyword mapping
      const { error: insertError } = await supabase
        .from('keyword_bucket_mapping')
        .insert({
          user_id: userId,
          keyword: keyword,
          bucket_assign_count: [{ bucket_id: bucketId, count: 1 }],
        });

      if (insertError) {
        console.error('Error inserting keyword mapping:', insertError);
      }
    }
  } catch (error) {
    console.error(`Error processing keyword "${keyword}":`, error);
  }
}

/**
 * Get the best matching bucket ID based on keywords in notes
 * Returns null if no match is found
 */
export async function getBucketFromKeywords(
  notes: string | null,
): Promise<number | null> {
  if (!notes || notes.trim() === '') {
    return null;
  }

  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Process notes as a single keyword, removing all numbers
  const keyword = notes
    .replace(/\d/g, '') // Remove all digits
    .trim();

  if (keyword === '') {
    return null;
  }

  try {
    // Fetch keyword mapping for the exact keyword match
    const { data: mapping, error } = await supabase
      .from('keyword_bucket_mapping')
      .select('*')
      .eq('user_id', userId)
      .eq('keyword', keyword)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No matching keyword found
        return null;
      }
      console.error('Error fetching keyword mapping:', error);
      return null;
    }

    if (!mapping) {
      return null;
    }

    // Find the bucket with the highest count
    const bucketAssignCount = mapping.bucket_assign_count as BucketAssignCount[];
    let bestBucketId: number | null = null;

    const bestAssignment = bucketAssignCount.reduce((best, current) =>
      current.count > best.count ? current : best
    );

    bestBucketId = bestAssignment.bucket_id;

    return bestBucketId;
  } catch (error) {
    console.error('Error getting bucket from keywords:', error);
    return null;
  }
}

/**
 * Get all keyword mappings for the current user
 * Useful for debugging or displaying mapping statistics
 */
export async function getKeywordBucketMappings(): Promise<
  KeywordBucketMapping[]
> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('keyword_bucket_mapping')
    .select('*')
    .eq('user_id', userId)
    .order('keyword', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Delete a specific keyword mapping
 */
export async function deleteKeywordBucketMapping(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('keyword_bucket_mapping')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

/**
 * Clear all keyword mappings for a specific bucket
 * Useful when a bucket is deleted
 */
export async function clearKeywordMappingsForBucket(
  bucketId: number,
): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Get all keyword mappings
  const { data: mappings, error: fetchError } = await supabase
    .from('keyword_bucket_mapping')
    .select('*')
    .eq('user_id', userId);

  if (fetchError) throw new Error(fetchError.message);
  if (!mappings) return;

  // Update each mapping to remove the bucket
  for (const mapping of mappings) {
    const updatedCounts = (mapping.bucket_assign_count as BucketAssignCount[])
      .filter((item) => item.bucket_id !== bucketId);

    if (updatedCounts.length === 0) {
      // No more buckets for this keyword, delete the mapping
      await deleteKeywordBucketMapping(mapping.id);
    } else {
      // Update the mapping with filtered counts
      const { error: updateError } = await supabase
        .from('keyword_bucket_mapping')
        .update({ bucket_assign_count: updatedCounts })
        .eq('id', mapping.id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error clearing keyword mapping for bucket:', updateError);
      }
    }
  }
}
