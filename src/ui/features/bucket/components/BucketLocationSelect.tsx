import { ChipAutocomplete } from '../../../shared/components/ChipAutocomplete';
import { useUpdateBucketMutation } from '../api/bucketApi';
import {
  useGetBucketLocationsQuery,
  useCreateBucketLocationMutation,
} from '../api/bucketLocationApi';

interface BucketLocationSelectProps {
  bucketId: number;
  value: number | null;
  disabled?: boolean;
}

export function BucketLocationSelect({
  bucketId,
  value,
  disabled = false,
}: BucketLocationSelectProps) {
  const { data: locations = [] } = useGetBucketLocationsQuery();
  const [updateBucket, { isLoading: isUpdating }] = useUpdateBucketMutation();
  const [createLocation, { isLoading: isCreating }] =
    useCreateBucketLocationMutation();

  const handleLocationChange = async (locationId: string | null) => {
    try {
      await updateBucket({
        id: bucketId,
        params: { bucket_location_id: locationId ? Number(locationId) : null },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update bucket location:', error);
    }
  };

  const handleCreateLocation = async (name: string) => {
    try {
      const newLocation = await createLocation({ name }).unwrap();
      if (newLocation) {
        await updateBucket({
          id: bucketId,
          params: { bucket_location_id: newLocation.id },
        }).unwrap();
      }
    } catch (error) {
      console.error('Failed to create location:', error);
    }
  };

  return (
    <ChipAutocomplete
      value={value?.toString() ?? null}
      options={locations.map((loc) => ({
        value: loc.id.toString(),
        label: loc.name,
      }))}
      onChange={handleLocationChange}
      onCreate={handleCreateLocation}
      label="Location"
      placeholder="Search locations..."
      variant="outlined"
      disabled={disabled || isUpdating || isCreating}
    />
  );
}
